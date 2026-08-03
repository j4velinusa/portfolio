import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionIsValid, SESSION_COOKIE } from "@/lib/admin-auth";
import {
  getCourse,
  type CourseChangelogEntry,
  type CourseData,
  type CourseGalleryImage,
  type CourseHeroImage,
  type CourseModule,
} from "@/lib/course";
import { LANGS, type Loc } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The owner-editable half of the course page, stored as one JSON file in the
 * repo. Same storage mechanism as /api/admin/publish: the GitHub Contents API
 * over plain fetch with a Bearer token. Nothing here touches the filesystem —
 * a commit is the only write, and the site picks it up on the next build.
 *
 *   GET  -> { course: CourseData }        (content/course.json, or the default)
 *   PUT  -> { ok: true, commit: "abc1234" }
 */

const REPO = process.env.GITHUB_REPO ?? "j4velinusa/portfolio";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const FILE = "content/course.json";
const API = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

/**
 * Everything below is a hard server-side limit. The editor caps the same
 * fields client-side for the owner's benefit, but this is where it has to be
 * true: without these, one authenticated request could commit an unbounded
 * blob to a public git history.
 */
const MAX_BODY = 200_000;
const MAX_HERO = 8;
const MAX_GALLERY = 48;
const MAX_MODULES = 20;
const MAX_CHANGELOG = 50;

/** Ids become React keys and DOM fragments, so keep them to a safe shape. */
// 39 trailing chars, not 40: src/lib/course.ts caps an id at 40 total, and an
// id this route accepts but the loader drops would delete the row from the
// page with nothing but a console.warn to show for it. The writer stays the
// strict subset of the reader.
const ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Root-relative image paths only, in the same shape src/lib/course.ts accepts
 * — no query strings, no traversal, no protocol-relative `//host`.
 */
const REL_IMAGE_RE = /^\/[A-Za-z0-9._\-/]+$/;

/** Vercel Blob's public buckets: `<store>.public.blob.vercel-storage.com`. */
const BLOB_HOST_RE = /(^|\.)blob\.vercel-storage\.com$/;

/**
 * Per-field text caps, deliberately identical to the ones src/lib/course.ts
 * enforces when it reads the file back. Anything longer would be committed and
 * then silently dropped by the loader, so refuse it at the door instead.
 */
const MAX_PRICE = 60;
const MAX_CTA = 60;
const MAX_ALT = 300;
const MAX_MODULE_TITLE = 120;
const MAX_MODULE_SUMMARY = 600;
const MAX_CHANGELOG_TITLE = 200;
const MAX_IMAGE_PATH = 200;
const MAX_PAYMENT_LINK = 500;
const MAX_LESSONS = 999;

function gh(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/** Shared gate: both verbs need config + a valid session. */
async function guard() {
  const token = process.env.GITHUB_TOKEN;
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET || !token) {
    return {
      error: NextResponse.json(
        { error: "Course editing is not configured (ADMIN_PASSWORD / SESSION_SECRET / GITHUB_TOKEN missing)." },
        { status: 503 },
      ),
    };
  }
  const jar = await cookies();
  if (!sessionIsValid(jar.get(SESSION_COOKIE)?.value)) {
    return {
      error: NextResponse.json({ error: "Oturum geçersiz. Tekrar giriş yap." }, { status: 401 }),
    };
  }
  return { token };
}

/* ---------------------------------------------------------------- validation */

/** A rejected payload. The message is Turkish and names the offending field. */
class Invalid extends Error {}

function asRecord(v: unknown, field: string): Record<string, unknown> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    throw new Invalid(`${field} bir nesne olmalı.`);
  }
  return v as Record<string, unknown>;
}

/**
 * A translated string, present in EVERY locale. Iterating LANGS rather than
 * hardcoding en/tr matches the loader: adding a language starts rejecting
 * untranslated rows instead of shipping `undefined` to a reader.
 */
function locOf(v: unknown, field: string, max: number): Loc {
  const r = asRecord(v, field);
  const out = {} as Loc;
  for (const l of LANGS) {
    const s = r[l];
    if (typeof s !== "string" || s.trim().length === 0) {
      throw new Invalid(`${field}.${l} boş olamaz.`);
    }
    if (s.length > max) {
      throw new Invalid(`${field}.${l} çok uzun (en fazla ${max} karakter).`);
    }
    out[l] = s;
  }
  return out;
}

function idOf(r: Record<string, unknown>, field: string, seen: Set<string>): string {
  const id = r.id;
  if (typeof id !== "string" || !ID_RE.test(id)) {
    throw new Invalid(
      `${field}.id geçersiz — küçük harf, rakam ve tire kullan (en fazla 40 karakter).`,
    );
  }
  if (seen.has(id)) {
    throw new Invalid(`${field}.id tekrar ediyor: "${id}". Her satırın id'si benzersiz olmalı.`);
  }
  seen.add(id);
  return id;
}

/**
 * This value ends up in an <img src>, so the scheme is the whole point.
 * Allowed: a root-relative path, or an https URL on the Vercel Blob host.
 * Refused: javascript:, data:, http:, protocol-relative `//host`, traversal.
 */
function imageOf(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new Invalid(`${field}.image boş olamaz.`);
  }
  if (v.length > MAX_IMAGE_PATH) {
    throw new Invalid(`${field}.image çok uzun (en fazla ${MAX_IMAGE_PATH} karakter).`);
  }
  // The media library holds PDFs too now, and these slots render through
  // next/image, which cannot display one. src/lib/course.ts drops such a row
  // with only a console.warn, so refuse it here where the panel can say why.
  if (!/\.(?:jpe?g|png|webp|avif)$/i.test(v)) {
    throw new Invalid(`${field}.image bir görsel olmalı (jpg, png, webp veya avif) — PDF kullanılamaz.`);
  }

  if (v.startsWith("/")) {
    if (v.startsWith("//") || v.includes("..") || !REL_IMAGE_RE.test(v)) {
      throw new Invalid(`${field}.image geçersiz bir yol — "/gorseller/ad.jpg" biçiminde olmalı.`);
    }
    return v;
  }

  let u: URL;
  try {
    u = new URL(v);
  } catch {
    throw new Invalid(
      `${field}.image "/" ile başlayan bir yol ya da https:// adresi olmalı.`,
    );
  }
  if (u.protocol !== "https:" || !BLOB_HOST_RE.test(u.hostname)) {
    throw new Invalid(
      `${field}.image yalnızca "/" ile başlayan bir yol ya da https Vercel Blob adresi olabilir.`,
    );
  }
  return v;
}

/**
 * Empty (the CTA falls back to mailto) or an absolute https URL. Nothing else:
 * this value becomes an href the owner sends buyers to.
 *
 * A missing key is read as empty rather than rejected — "" is the documented
 * no-checkout state, and JSON.stringify drops an undefined field on the way in.
 */
function paymentLinkOf(v: unknown): string {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v !== "string") {
    throw new Invalid("paymentLink bir metin olmalı (ödeme yoksa boş bırak).");
  }
  if (v.length > MAX_PAYMENT_LINK) {
    throw new Invalid(`paymentLink çok uzun (en fazla ${MAX_PAYMENT_LINK} karakter).`);
  }
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    throw new Invalid("paymentLink geçerli bir adres değil — https:// ile başlamalı ya da boş olmalı.");
  }
  if (u.protocol !== "https:") {
    throw new Invalid("paymentLink yalnızca https:// ile başlayabilir ya da boş olmalı.");
  }
  return v;
}

/** A real calendar date, not just four-two-two digits: 2026-99-99 must fail. */
function dateOf(v: unknown, field: string): string {
  if (typeof v !== "string" || !DATE_RE.test(v)) {
    throw new Invalid(`${field}.date YYYY-AA-GG biçiminde olmalı.`);
  }
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Invalid(`${field}.date gerçek bir takvim tarihi değil: ${v}`);
  }
  return v;
}

function arrayOf<T>(
  v: unknown,
  field: string,
  max: number,
  parse: (row: unknown, at: string, seen: Set<string>) => T,
): T[] {
  if (!Array.isArray(v)) throw new Invalid(`${field} bir dizi olmalı.`);
  if (v.length > max) {
    throw new Invalid(`${field} en fazla ${max} kayıt içerebilir (${v.length} gönderildi).`);
  }
  // Ids only have to be unique within their own list — they are that list's
  // React keys, exactly as src/lib/course.ts dedupes them.
  const seen = new Set<string>();
  return v.map((row, i) => parse(row, `${field}[${i}]`, seen));
}

function heroOf(row: unknown, at: string, seen: Set<string>): CourseHeroImage {
  const r = asRecord(row, at);
  return { id: idOf(r, at, seen), image: imageOf(r.image, at) };
}

function galleryOf(row: unknown, at: string, seen: Set<string>): CourseGalleryImage {
  const r = asRecord(row, at);
  return {
    id: idOf(r, at, seen),
    image: imageOf(r.image, at),
    alt: locOf(r.alt, `${at}.alt`, MAX_ALT),
  };
}

function moduleOf(row: unknown, at: string, seen: Set<string>): CourseModule {
  const r = asRecord(row, at);
  const id = idOf(r, at, seen);
  const title = locOf(r.title, `${at}.title`, MAX_MODULE_TITLE);
  const summary = locOf(r.summary, `${at}.summary`, MAX_MODULE_SUMMARY);
  const lessons = r.lessons;
  if (
    typeof lessons !== "number" ||
    !Number.isInteger(lessons) ||
    lessons < 0 ||
    lessons > MAX_LESSONS
  ) {
    throw new Invalid(`${at}.lessons 0 ile ${MAX_LESSONS} arasında bir tam sayı olmalı.`);
  }
  return { id, title, summary, lessons };
}

function changelogOf(row: unknown, at: string, seen: Set<string>): CourseChangelogEntry {
  const r = asRecord(row, at);
  return {
    id: idOf(r, at, seen),
    date: dateOf(r.date, at),
    title: locOf(r.title, `${at}.title`, MAX_CHANGELOG_TITLE),
  };
}

/** Throws `Invalid` with a Turkish message on the first field that fails. */
function parseCourse(raw: unknown): CourseData {
  const c = asRecord(raw, "Gövde");
  return {
    price: locOf(c.price, "price", MAX_PRICE),
    paymentLink: paymentLinkOf(c.paymentLink),
    ctaLabel: locOf(c.ctaLabel, "ctaLabel", MAX_CTA),
    hero: arrayOf(c.hero, "hero", MAX_HERO, heroOf),
    gallery: arrayOf(c.gallery, "gallery", MAX_GALLERY, galleryOf),
    modules: arrayOf(c.modules, "modules", MAX_MODULES, moduleOf),
    changelog: arrayOf(c.changelog, "changelog", MAX_CHANGELOG, changelogOf),
  };
}

/* ---------------------------------------------------------------------- GET */

/**
 * Reads straight from GitHub rather than from the built site, so the panel
 * shows what is actually in the repo — including an edit saved seconds ago,
 * before the redeploy that would put it on the page.
 */
export async function GET() {
  const g = await guard();
  if (g.error) return g.error;

  try {
    const res = await fetch(`${API}?ref=${BRANCH}`, {
      headers: gh(g.token!),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    // Not committed yet: hand back the same defaults the page renders.
    if (res.status === 404) return NextResponse.json({ course: getCourse() });
    if (!res.ok) {
      console.error("[course] read failed", res.status);
      return NextResponse.json({ error: `Kurs verisi alınamadı (${res.status}).` }, { status: 502 });
    }

    const file: { content?: string; encoding?: string } = await res.json();
    if (typeof file.content !== "string" || file.encoding !== "base64") {
      console.error("[course] unexpected Contents API shape", file.encoding);
      return NextResponse.json({ course: getCourse() });
    }

    // A file edited by hand can be anything, so it goes through the same
    // validator as an incoming save. If it does not survive, the panel gets
    // the defaults — the response has to actually be a CourseData.
    try {
      return NextResponse.json({ course: parseCourse(JSON.parse(Buffer.from(file.content, "base64").toString("utf8"))) });
    } catch (e) {
      console.error("[course] stored file is not valid CourseData", e instanceof Error ? e.message : e);
      return NextResponse.json({ course: getCourse() });
    }
  } catch (e) {
    console.error("[course] read unexpected", e);
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "GitHub yanıt vermedi, tekrar dene." : "Kurs verisi alınamadı." },
      { status: timedOut ? 504 : 500 },
    );
  }
}

/* ---------------------------------------------------------------------- PUT */

export async function PUT(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  // Defence in depth against CSRF. SameSite=Lax already withholds the cookie
  // on cross-site requests; this survives an accidental future switch to None.
  const origin = req.headers.get("origin");
  const self = process.env.SITE_ORIGIN ?? "https://doganaykac.com";
  if (origin && origin !== self) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }

  const tooBig = NextResponse.json(
    { error: `Kurs verisi çok büyük (en fazla ${MAX_BODY.toLocaleString("tr-TR")} karakter).` },
    { status: 413 },
  );

  // Cheap pre-check on the declared length, then the real one on what arrived.
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > MAX_BODY) return tooBig;

  let text: string;
  try {
    text = await req.text();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi okunamadı." }, { status: 400 });
  }
  if (text.length > MAX_BODY) return tooBig;

  let course: CourseData;
  try {
    course = parseCourse(JSON.parse(text));
  } catch (e) {
    if (e instanceof Invalid) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Gövde geçerli JSON değil." }, { status: 400 });
  }

  try {
    // A file that already exists must be updated with its blob sha.
    let sha: string | undefined;
    const existing = await fetch(`${API}?ref=${BRANCH}`, {
      headers: gh(g.token!),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (existing.ok) sha = (await existing.json()).sha;
    else if (existing.status !== 404) {
      console.error("[course] sha lookup failed", existing.status);
      return NextResponse.json({ error: `GitHub okunamadı (${existing.status}).` }, { status: 502 });
    }

    const content = Buffer.from(JSON.stringify(course, null, 2) + "\n", "utf8").toString("base64");
    const write = await fetch(API, {
      method: "PUT",
      headers: gh(g.token!),
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        message: "course: update",
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!write.ok) {
      // Detail goes to the server log, not to the response: even an
      // authenticated caller doesn't need our integration internals.
      console.error("[course] GitHub write failed", write.status, await write.text());
      return NextResponse.json({ error: `Kaydedilemedi (${write.status}).` }, { status: 502 });
    }

    const result: { commit?: { sha?: string } } = await write.json();
    return NextResponse.json({ ok: true, commit: result.commit?.sha?.slice(0, 7) });
  } catch (e) {
    console.error("[course] write unexpected", e);
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "GitHub yanıt vermedi, tekrar dene." : "Beklenmeyen bir hata oldu." },
      { status: timedOut ? 504 : 500 },
    );
  }
}
