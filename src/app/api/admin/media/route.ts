import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put, list, del, head, BlobNotFoundError, BlobServiceRateLimited } from "@vercel/blob";
import { sessionIsValid, SESSION_COOKIE } from "@/lib/admin-auth";
import {
  BLOB_HOST_RE,
  BLOB_PATH_RE,
  MAX_PROXY_UPLOAD_BYTES,
  MEDIA_PREFIX,
  isMediaType,
  mediaPathFor,
  type MediaType,
} from "@/lib/media";

// The Blob SDK is Node-only (engines node>=20, undici + is-node-process), and
// the session guard reaches node:crypto through @/lib/admin-auth. Neither
// works on the edge runtime — this export is load-bearing, not decorative.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The allowlist, the caps, the prefix and the filename sanitiser all live in
 * @/lib/media, because /api/admin/media/token has to agree with this route
 * exactly. On the client-token path the browser builds the pathname itself and
 * the SDK's hook can only accept or reject it, so a second copy of that logic
 * here would drift into a bug nobody sees until an upload silently lands under
 * the wrong name.
 */

/** A year — media is content-addressed by the random suffix, so it never changes under a url. */
const CACHE_MAX_AGE = 31536000;

/** Shared gate: every verb needs config + a valid session. */
async function guard() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return {
      error: NextResponse.json({ error: "Admin is not configured." }, { status: 503 }),
    };
  }
  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Medya deposu yapılandırılmamış (BLOB_READ_WRITE_TOKEN eksik)." },
        { status: 503 },
      ),
    };
  }
  const jar = await cookies();
  if (!sessionIsValid(jar.get(SESSION_COOKIE)?.value)) {
    return { error: NextResponse.json({ error: "Oturum geçersiz. Tekrar giriş yap." }, { status: 401 }) };
  }
  return { token };
}

/**
 * Defence in depth against CSRF. SameSite=Lax already withholds the cookie
 * on cross-site writes; this survives an accidental future switch to None.
 */
function badOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const self = process.env.SITE_ORIGIN ?? "https://doganaykac.com";
  if (origin && origin !== self) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  return null;
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  let out = "";
  for (let i = start; i < end && i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/**
 * A client-declared Content-Type is a claim, not evidence: multipart lets the
 * caller write whatever they like into it. Read the container's own magic bytes
 * and only trust an upload whose header agrees with what it says it is.
 */
function sniff(b: Uint8Array): MediaType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  if (b.length >= 12 && ascii(b, 4, 8) === "ftyp") {
    // Major brand plus the compatible-brands list; encoders emit either
    // `avif`/`avis` as the major brand or `mif1` with `avif` listed after it.
    const brands = ascii(b, 8, 32);
    if (brands.includes("avif") || brands.includes("avis")) return "image/avif";
  }
  // %PDF- at offset 0. The spec tolerates leading bytes before the header, but
  // a file that needs that tolerance is one a viewer has to guess about, and
  // we are the ones choosing what to store — so require it at the front.
  if (b.length >= 5 && ascii(b, 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

/** Never return an upstream message; log it and answer with something generic. */
function failed(scope: string, e: unknown) {
  console.error(`[media] ${scope}`, e);
  if (e instanceof BlobServiceRateLimited) {
    return NextResponse.json({ error: "Medya servisi yoğun, biraz sonra dene." }, { status: 429 });
  }
  const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
  return NextResponse.json(
    { error: timedOut ? "Medya deposu yanıt vermedi, tekrar dene." : "Beklenmeyen bir hata oldu." },
    { status: timedOut ? 504 : 500 },
  );
}

type MediaItem = { url: string; pathname: string; size: number; uploadedAt: string };

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;

  try {
    const items: MediaItem[] = [];
    let cursor: string | undefined;

    // list() returns lexicographical pathname order, never recency, and pages
    // at 1000 by default. Walk the pages, then sort ourselves. The page cap
    // keeps one panel load from turning into an unbounded request loop.
    for (let page = 0; page < 10; page++) {
      const res = await list({
        prefix: MEDIA_PREFIX,
        limit: 100,
        cursor,
        token: g.token!,
        abortSignal: AbortSignal.timeout(15_000),
      });
      for (const b of res.blobs) {
        items.push({
          url: b.url,
          pathname: b.pathname,
          size: b.size,
          // uploadedAt is a real Date; pin the wire format instead of leaving
          // it to whatever Response.json() happens to do with it.
          uploadedAt: b.uploadedAt.toISOString(),
        });
      }
      if (!res.hasMore || !res.cursor) break;
      cursor = res.cursor;
    }

    items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return NextResponse.json({ items });
  } catch (e) {
    return failed("list", e);
  }
}

export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const bad = badOrigin(req);
  if (bad) return bad;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı (alan adı: file)." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Dosya boş." }, { status: 400 });
  }
  // Anything larger is supposed to have gone to /api/admin/media/token and
  // straight to Blob from the browser, because Vercel Functions reject a body
  // over 4.5 MB with their own opaque English 413 before this code ever runs.
  // Reaching here with a bigger file means the client routed it wrong, so say
  // so plainly rather than repeating a size the panel already checked.
  if (file.size > MAX_PROXY_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Bu dosya bu yoldan yüklenemeyecek kadar büyük — doğrudan yükleme kullanılmalı." },
      { status: 413 },
    );
  }

  // Strip any ";charset=" parameter before matching — the allowlist is exact.
  const declared = file.type.split(";")[0].trim().toLowerCase();
  if (!isMediaType(declared)) {
    return NextResponse.json(
      { error: "Yalnızca JPEG, PNG, WebP, AVIF ve PDF yüklenebilir." },
      { status: 415 },
    );
  }

  // Slicing a File does not consume it — the same File still goes to put()
  // unbuffered below.
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const actual = sniff(header);
  if (!actual || actual !== declared) {
    return NextResponse.json(
      { error: "Dosya içeriği belirtilen türle uyuşmuyor." },
      { status: 415 },
    );
  }

  // Built from the *verified* type, not the upload's own extension, so a file
  // called x.png holding a JPEG cannot mint a lying url.
  const pathname = mediaPathFor(file.name || "dosya", actual);

  try {
    const blob = await put(pathname, file, {
      access: "public",
      // Defaults to false on put(); without it a repeated filename throws
      // instead of quietly living alongside the first one.
      addRandomSuffix: true,
      contentType: actual,
      token: g.token!,
      cacheControlMaxAge: CACHE_MAX_AGE,
      abortSignal: AbortSignal.timeout(20_000),
    });

    return NextResponse.json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (e) {
    return failed("upload", e);
  }
}

export async function DELETE(req: Request) {
  const g = await guard();
  if (g.error) return g.error;

  const bad = badOrigin(req);
  if (bad) return bad;

  const raw = new URL(req.url).searchParams.get("url") ?? "";

  // The url arrives from the client, so it is treated as hostile until it has
  // been proven to name one of OUR blobs. Without this the endpoint would be a
  // credentialled proxy that forwards any attacker-chosen url to the delete API.
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Geçersiz adres." }, { status: 400 });
  }
  const mine =
    target.protocol === "https:" &&
    BLOB_HOST_RE.test(target.hostname) &&
    BLOB_PATH_RE.test(target.pathname) &&
    target.search === "" &&
    target.hash === "";
  if (!mine) {
    return NextResponse.json({ error: "Geçersiz adres." }, { status: 400 });
  }

  // Rebuild from the parsed parts so no userinfo, port or query rides along.
  const url = `https://${target.hostname}${target.pathname}`;

  try {
    // del() succeeds silently for a url that was never there, so it cannot
    // double as an existence check — head() is what turns a bogus url into a
    // 404, and it only resolves blobs inside the store our token owns.
    try {
      await head(url, { token: g.token!, abortSignal: AbortSignal.timeout(10_000) });
    } catch (e) {
      if (e instanceof BlobNotFoundError) {
        return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
      }
      throw e;
    }

    await del(url, { token: g.token!, abortSignal: AbortSignal.timeout(15_000) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failed("delete", e);
  }
}
