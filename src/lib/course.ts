import fs from "node:fs";
import path from "node:path";
import { LANGS, type Loc } from "@/lib/i18n";

/**
 * The owner-editable half of the course page.
 *
 * Fixed prose lives in src/content/courses.ts and only changes with a commit.
 * Everything here comes from content/course.json, which the admin panel writes
 * — so it can arrive malformed, half-written, or with a field an older admin
 * build did not know about. Same contract as src/lib/posts.ts: validate like
 * data, drop what fails with a console.warn, and fall back to a baked-in
 * default. A bad commit from the admin must cost the page some rows, never the
 * whole build.
 *
 * Server-only: reads the repo synchronously at build time. Never import this
 * from a "use client" module.
 */

/** A mosaic image at the top of the page. Decorative — the comp ships alt="". */
export type CourseHeroImage = { id: string; image: string };

/** A gallery image. Real alt text, because these are the page's proof. */
export type CourseGalleryImage = { id: string; image: string; alt: Loc };

export type CourseModule = { id: string; title: Loc; summary: Loc; lessons: number };

/** One "added this month" row. `date` is ISO, e.g. 2026-08-01. */
export type CourseChangelogEntry = { id: string; date: string; title: Loc };

export type CourseData = {
  price: Loc;
  /** "" on purpose when there is no checkout — the CTA falls back to mailto. */
  paymentLink: string;
  ctaLabel: Loc;
  hero: CourseHeroImage[];
  gallery: CourseGalleryImage[];
  modules: CourseModule[];
  changelog: CourseChangelogEntry[];
};

const COURSE_FILE = path.join(process.cwd(), "content", "course.json");

/**
 * What the page renders when content/course.json is missing, unparseable, or
 * so broken that nothing survives validation. Deliberately lean — its job is
 * to keep the build green and the page coherent, not to be the real content.
 */
const DEFAULT_COURSE: CourseData = {
  price: { en: "₺1,000 / month", tr: "₺1.000 / ay" },
  paymentLink: "",
  ctaLabel: { en: "Get the course", tr: "Kursu al" },
  hero: [
    { id: "h1", image: "/courses/riviera-01.jpg" },
    { id: "h2", image: "/courses/riviera-02.jpg" },
    { id: "h3", image: "/courses/riviera-03.jpg" },
    { id: "h4", image: "/courses/riviera-04.jpg" },
  ],
  gallery: [
    {
      id: "g1",
      image: "/courses/riviera-05.jpg",
      alt: {
        en: "A turquoise water channel running through a cream stucco wall.",
        tr: "Krem sıvalı bir duvarın içinden geçen turkuaz su kanalı.",
      },
    },
    {
      id: "g2",
      image: "/courses/riviera-06.jpg",
      alt: {
        en: "Watercolour of a green tiled courtyard pool seen from above.",
        tr: "Tepeden görülen yeşil çinili avlu havuzunun suluboyası.",
      },
    },
    {
      id: "g3",
      image: "/courses/riviera-03.jpg",
      alt: {
        en: "A vinyl record whose grooves read as pool water, with koi swimming across it.",
        tr: "Oyukları havuz suyu gibi okunan bir plak; üzerinde yüzen koi balıkları.",
      },
    },
  ],
  modules: [
    {
      id: "m1",
      title: { en: "Building a visual language", tr: "Görsel dili kurmak" },
      summary: {
        en: "Reading references, palette, light, composition, texture.",
        tr: "Referans okuma, palet, ışık, kompozisyon, doku.",
      },
      lessons: 6,
    },
    {
      id: "m2",
      title: { en: "Magazines and publications", tr: "Dergi ve yayın" },
      summary: {
        en: "A 12-page publication end to end: grid, typography, print prep.",
        tr: "Baştan sona 12 sayfalık yayın: ızgara, tipografi, baskıya hazırlık.",
      },
      lessons: 8,
    },
    {
      id: "m3",
      title: { en: "Marketing and social", tr: "Pazarlama ve sosyal" },
      summary: {
        en: "Campaign sets and post series that hold together as one brand.",
        tr: "Tek bir marka dili olarak duran kampanya setleri ve post serileri.",
      },
      lessons: 7,
    },
    {
      id: "m4",
      title: { en: "Interfaces and web", tr: "Arayüz ve web" },
      summary: {
        en: "Connecting generated imagery to a real design system.",
        tr: "Üretilen görseli gerçek bir tasarım sistemine bağlamak.",
      },
      lessons: 7,
    },
  ],
  changelog: [],
};

/** A real calendar date, not just four-two-two digits: 2026-99-99 must fail. */
function isRealDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * A translated string, present in EVERY locale. Iterating LANGS rather than
 * hardcoding en/tr is the whole point of Loc: adding a language immediately
 * starts rejecting rows that have not been translated, instead of rendering
 * `undefined` at the reader.
 */
function loc(v: unknown, max: number): Loc | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  const rec = v as Record<string, unknown>;
  const out = {} as Loc;
  for (const l of LANGS) {
    const s = rec[l];
    if (typeof s !== "string" || s.length === 0 || s.length > max) return null;
    out[l] = s;
  }
  return out;
}

/**
 * React keys come off these, so an id is not decoration. It must exist, be
 * short, and contain nothing that would make a bad DOM id or query fragment.
 */
const isId = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= 40 && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(v);

/** The media library uploads here, so the loader has to accept what it returns. */
const BLOB_HOST_RE = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/;

/**
 * Either a root-relative path or an image on our own Vercel Blob store.
 *
 * The blob host survives the `img-src 'self' data: blob:` CSP because every
 * image on this site is rendered through next/image: the browser only ever
 * requests same-origin /_next/image, and the optimizer fetches the original
 * server-side, where CSP does not apply. That only holds while the host is
 * also listed in images.remotePatterns in next.config.ts — the two are one
 * decision, and changing either alone breaks the media grid.
 *
 * Rejects the protocol-relative `//host/x` form, any `..` traversal, and any
 * query or fragment (an <Image> src with `?v=` would fail the remotePatterns
 * `search: ""` rule).
 */
const isImagePath = (v: unknown): v is string => {
  if (typeof v !== "string" || v.length < 2 || v.length > 200) return false;
  if (v.startsWith("//") || v.includes("..")) return false;
  if (v.startsWith("/")) return /^\/[A-Za-z0-9._\-/]+$/.test(v);
  try {
    const u = new URL(v);
    return (
      u.protocol === "https:" && BLOB_HOST_RE.test(u.hostname) && u.search === "" && u.hash === ""
    );
  } catch {
    // Not a URL at all — a bare word, a mailto:, whatever. Drop the row.
    return false;
  }
};

/** Empty (mailto fallback) or an absolute https URL. Nothing else is a link we send people to. */
function paymentLink(v: unknown): string {
  if (typeof v !== "string" || v.length === 0) return "";
  if (v.length > 500) {
    console.warn("[course] paymentLink is too long — falling back to mailto");
    return "";
  }
  try {
    if (new URL(v).protocol !== "https:") throw new Error("not https");
  } catch {
    console.warn("[course] paymentLink is not an absolute https URL — falling back to mailto");
    return "";
  }
  return v;
}

/** Drops repeated ids, keeping the first. Duplicate React keys are a real bug, not a warning. */
function dedupe<T extends { id: string }>(rows: T[], kind: string): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) {
      console.warn(`[course] skipping ${kind} "${r.id}": duplicate id`);
      return false;
    }
    seen.add(r.id);
    return true;
  });
}

/** Parses an array field, dropping bad rows. Returns [] when the field is not an array. */
function rows<T>(v: unknown, kind: string, parse: (row: unknown, i: number) => T | null): T[] {
  if (!Array.isArray(v)) {
    if (v !== undefined) console.warn(`[course] ${kind} is not an array — ignoring it`);
    return [];
  }
  const out: T[] = [];
  v.forEach((row, i) => {
    const parsed = parse(row, i);
    if (parsed === null) console.warn(`[course] skipping ${kind}[${i}]: does not match the schema`);
    else out.push(parsed);
  });
  return out;
}

const asRecord = (v: unknown): Record<string, unknown> | null =>
  typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

function parseHero(row: unknown): CourseHeroImage | null {
  const r = asRecord(row);
  if (!r || !isId(r.id) || !isImagePath(r.image)) return null;
  return { id: r.id, image: r.image };
}

function parseGallery(row: unknown): CourseGalleryImage | null {
  const r = asRecord(row);
  if (!r || !isId(r.id) || !isImagePath(r.image)) return null;
  const alt = loc(r.alt, 300);
  if (!alt) return null;
  return { id: r.id, image: r.image, alt };
}

function parseModule(row: unknown): CourseModule | null {
  const r = asRecord(row);
  if (!r || !isId(r.id)) return null;
  const title = loc(r.title, 120);
  const summary = loc(r.summary, 600);
  const lessons = r.lessons;
  if (!title || !summary) return null;
  if (typeof lessons !== "number" || !Number.isInteger(lessons) || lessons < 0 || lessons > 999) {
    return null;
  }
  return { id: r.id, title, summary, lessons };
}

function parseChangelog(row: unknown): CourseChangelogEntry | null {
  const r = asRecord(row);
  if (!r || !isId(r.id) || !isRealDate(r.date)) return null;
  const title = loc(r.title, 200);
  if (!title) return null;
  return { id: r.id, date: r.date, title };
}

/**
 * The course page's editable content. Server-only — reads the repo at build
 * time, exactly like getPosts(). Uncached and re-read per call, matching the
 * posts loader; at one file that is not worth memoising.
 */
export function getCourse(): CourseData {
  if (!fs.existsSync(COURSE_FILE)) {
    console.warn("[course] content/course.json not found — using defaults");
    return DEFAULT_COURSE;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(COURSE_FILE, "utf8"));
  } catch {
    console.warn("[course] content/course.json is not valid JSON — using defaults");
    return DEFAULT_COURSE;
  }

  const c = asRecord(raw);
  if (!c) {
    console.warn("[course] content/course.json is not an object — using defaults");
    return DEFAULT_COURSE;
  }

  const price = loc(c.price, 60);
  if (!price) console.warn("[course] price is missing or not translated — using the default");

  const ctaLabel = loc(c.ctaLabel, 60);
  if (!ctaLabel) console.warn("[course] ctaLabel is missing or not translated — using the default");

  const hero = dedupe(rows(c.hero, "hero", parseHero), "hero");
  const gallery = dedupe(rows(c.gallery, "gallery", parseGallery), "gallery");
  const modules = dedupe(rows(c.modules, "modules", parseModule), "module");
  // An empty changelog is a legitimate state — a new course has nothing to log
  // yet — so unlike the others it does not fall back.
  const changelog = dedupe(rows(c.changelog, "changelog", parseChangelog), "changelog").sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  if (hero.length === 0) console.warn("[course] no usable hero images — using the defaults");
  if (gallery.length === 0) console.warn("[course] no usable gallery images — using the defaults");
  if (modules.length === 0) console.warn("[course] no usable modules — using the defaults");

  return {
    price: price ?? DEFAULT_COURSE.price,
    paymentLink: paymentLink(c.paymentLink),
    ctaLabel: ctaLabel ?? DEFAULT_COURSE.ctaLabel,
    hero: hero.length > 0 ? hero : DEFAULT_COURSE.hero,
    gallery: gallery.length > 0 ? gallery : DEFAULT_COURSE.gallery,
    modules: modules.length > 0 ? modules : DEFAULT_COURSE.modules,
    changelog,
  };
}

/** Sum of the module lesson counts — the "28" in the stats band and the TOC line. */
export const totalLessons = (data: CourseData): number =>
  data.modules.reduce((n, m) => n + m.lessons, 0);

/**
 * Fills the {modules} / {lessons} markers used by courseCopy.curriculum.meta
 * and courseCopy.buy.perks[0], so those sentences can never contradict the
 * module list the owner just edited.
 */
export const fillCounts = (template: string, data: CourseData): string =>
  template
    .replace(/\{modules\}/g, String(data.modules.length))
    .replace(/\{lessons\}/g, String(totalLessons(data)));
