import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionIsValid, SESSION_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Incoming = {
  slug?: string;
  title?: string;
  category?: string;
  date?: string;
  excerpt?: string;
  body?: string;
  published?: boolean;
};

const REPO = process.env.GITHUB_REPO ?? "j4velinusa/portfolio";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";

/** Slugs become file paths, so keep them to a safe, predictable shape. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const WORDS_PER_MINUTE = 200;

export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET || !token) {
    return NextResponse.json(
      { error: "Publishing is not configured (ADMIN_PASSWORD / SESSION_SECRET / GITHUB_TOKEN missing)." },
      { status: 503 },
    );
  }

  const jar = await cookies();
  if (!sessionIsValid(jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Oturum geçersiz. Tekrar giriş yap." }, { status: 401 });
  }

  // Defence in depth against CSRF. SameSite=Lax already withholds the cookie
  // on cross-site POSTs; this survives an accidental future switch to None.
  const origin = req.headers.get("origin");
  const self = process.env.SITE_ORIGIN ?? "https://doganaykac.com";
  if (origin && origin !== self) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }

  let p: Incoming;
  try {
    p = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const slug = (p.slug ?? "").trim();
  const title = (p.title ?? "").trim();
  const body = p.body ?? "";

  // The editor caps these client-side; the server is where it has to be true.
  // Without this, one authenticated request could commit an unbounded blob to git.
  const tooLong =
    slug.length > 80 ||
    title.length > 200 ||
    (p.excerpt ?? "").length > 300 ||
    (p.category ?? "").length > 60;
  if (tooLong) {
    return NextResponse.json({ error: "Alanlardan biri çok uzun." }, { status: 400 });
  }
  if (body.length > 100_000) {
    return NextResponse.json({ error: "Yazı çok büyük (en fazla 100.000 karakter)." }, { status: 413 });
  }

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Slug yalnızca küçük harf, rakam ve tire içerebilir." },
      { status: 400 },
    );
  }
  if (!title) return NextResponse.json({ error: "Başlık boş olamaz." }, { status: 400 });
  if (!body.trim()) return NextResponse.json({ error: "Yazı boş olamaz." }, { status: 400 });

  // SEC-06: the repo is public, so a "draft" committed here would be readable
  // on GitHub and would stay in the commit history forever — the opposite of
  // what "Taslak olarak kaydet" implies. Drafts therefore never leave the
  // browser; only an explicit publish writes to git.
  if (p.published === false) {
    return NextResponse.json(
      {
        error:
          "Taslaklar herkese açık repoya yazılmaz — tarayıcında saklanıyor. Yayınlamak için durumu 'Yayında' yap.",
      },
      { status: 400 },
    );
  }

  const words = body.trim().split(/\s+/).length;
  const post = {
    slug,
    title,
    category: (p.category ?? "Genel").trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "") ? p.date : new Date().toISOString().slice(0, 10),
    readMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    excerpt: (p.excerpt ?? "").trim(),
    // Drafts are rejected above, so anything reaching git is published.
    published: true,
    body,
  };

  const path = `content/posts/${slug}.json`;
  const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  try {
    // A file that already exists must be updated with its blob sha.
    let sha: string | undefined;
    const existing = await fetch(`${api}?ref=${BRANCH}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (existing.ok) sha = (await existing.json()).sha;
    else if (existing.status !== 404) {
      return NextResponse.json(
        { error: `GitHub okunamadı (${existing.status}).` },
        { status: 502 },
      );
    }

    const content = Buffer.from(JSON.stringify(post, null, 2) + "\n", "utf8").toString("base64");
    const write = await fetch(api, {
      method: "PUT",
      headers,
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        message: `${sha ? "post: update" : "post: add"} ${slug}`,
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!write.ok) {
      // Detail goes to the server log, not to the response: even an
      // authenticated caller doesn't need our integration internals.
      console.error("[publish] GitHub write failed", write.status, await write.text());
      return NextResponse.json({ error: `Yayınlanamadı (${write.status}).` }, { status: 502 });
    }

    const result = await write.json();
    return NextResponse.json({
      ok: true,
      updated: Boolean(sha),
      commit: result.commit?.sha?.slice(0, 7),
      url: `/tr/blog/${slug}`,
    });
  } catch (e) {
    console.error("[publish] unexpected", e);
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "GitHub yanıt vermedi, tekrar dene." : "Beklenmeyen bir hata oldu." },
      { status: timedOut ? 504 : 500 },
    );
  }
}
