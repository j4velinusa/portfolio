import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionIsValid, SESSION_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO ?? "j4velinusa/portfolio";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const DIR = "content/posts";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
      error: NextResponse.json({ error: "Admin is not configured." }, { status: 503 }),
    };
  }
  const jar = await cookies();
  if (!sessionIsValid(jar.get(SESSION_COOKIE)?.value)) {
    return { error: NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 }) };
  }
  return { token };
}

/**
 * Reads posts straight from GitHub rather than from the built site, so the
 * panel shows what is actually in the repo — including a post published
 * seconds ago, before the redeploy that would put it on the site.
 */
export async function GET() {
  const g = await guard();
  if (g.error) return g.error;

  try {
    const listRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${DIR}?ref=${BRANCH}`, {
      headers: gh(g.token!),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (listRes.status === 404) return NextResponse.json({ posts: [] });
    if (!listRes.ok) {
      console.error("[posts] list failed", listRes.status);
      return NextResponse.json({ error: `Liste alınamadı (${listRes.status}).` }, { status: 502 });
    }

    const entries: { name: string; download_url: string }[] = await listRes.json();
    const files = entries.filter((e) => e.name.endsWith(".json"));

    const posts = await Promise.all(
      files.map(async (f) => {
        const r = await fetch(f.download_url, {
          headers: { Authorization: `Bearer ${g.token}` },
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (!r.ok) return null;
        const p = await r.json();
        return {
          slug: p.slug,
          title: p.title,
          category: p.category,
          date: p.date,
          excerpt: p.excerpt ?? "",
          published: p.published !== false,
          body: p.body ?? "",
        };
      }),
    );

    return NextResponse.json({
      posts: posts
        .filter(Boolean)
        .sort((a, b) => String(b!.date).localeCompare(String(a!.date))),
    });
  } catch (e) {
    console.error("[posts] unexpected", e);
    return NextResponse.json({ error: "Yazılar alınamadı." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const origin = req.headers.get("origin");
  const self = process.env.SITE_ORIGIN ?? "https://doganaykac.com";
  if (origin && origin !== self) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Geçersiz slug." }, { status: 400 });
  }

  const api = `https://api.github.com/repos/${REPO}/contents/${DIR}/${slug}.json`;
  try {
    const cur = await fetch(`${api}?ref=${BRANCH}`, {
      headers: gh(g.token!),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (cur.status === 404) {
      return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });
    }
    if (!cur.ok) {
      console.error("[posts] delete lookup failed", cur.status);
      return NextResponse.json({ error: `Silinemedi (${cur.status}).` }, { status: 502 });
    }
    const { sha } = await cur.json();

    const del = await fetch(api, {
      method: "DELETE",
      headers: gh(g.token!),
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ message: `post: remove ${slug}`, sha, branch: BRANCH }),
    });
    if (!del.ok) {
      console.error("[posts] delete failed", del.status, await del.text());
      return NextResponse.json({ error: `Silinemedi (${del.status}).` }, { status: 502 });
    }

    const result = await del.json();
    return NextResponse.json({ ok: true, commit: result.commit?.sha?.slice(0, 7) });
  } catch (e) {
    console.error("[posts] delete unexpected", e);
    return NextResponse.json({ error: "Beklenmeyen bir hata oldu." }, { status: 500 });
  }
}
