import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { sessionIsValid, SESSION_COOKIE } from "@/lib/admin-auth";
import { MEDIA_TYPES, MEDIA_PATHNAME_RE, MAX_CLIENT_UPLOAD_BYTES } from "@/lib/media";

// handleUpload verifies the completion callback with node:crypto, and the
// session guard reaches it through @/lib/admin-auth. Neither works on edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Matches the server-proxy path; the URL never changes under a blob. */
const CACHE_MAX_AGE = 31536000;

/**
 * Issues short-lived client tokens so a magazine PDF can go straight from the
 * browser to Blob. It exists because Vercel Functions hard-cap a request body
 * at 4.5 MB — /api/admin/media can never carry a 30 MB file, no matter how the
 * cap is written.
 *
 * TWO DIFFERENT CALLERS HIT THIS ROUTE AND THEY AUTHENTICATE DIFFERENTLY:
 *
 *   blob.generate-client-token — the admin's browser, carrying our session
 *     cookie. Gated here on the session and the Origin, exactly like every
 *     other admin route.
 *
 *   blob.upload-completed — Vercel's servers, calling back after the upload
 *     lands. This request has no session cookie and no same-site Origin, so
 *     gating it on either would break every large upload. It authenticates
 *     itself instead: handleUpload recomputes an HMAC-SHA256 over the body
 *     keyed with BLOB_READ_WRITE_TOKEN and timing-safe-compares it against the
 *     x-vercel-signature header, throwing when it does not match. Forging the
 *     type to skip the session check therefore buys nothing — the request dies
 *     on the signature a moment later.
 */
export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Admin is not configured." }, { status: 503 });
  }
  if (!token) {
    return NextResponse.json(
      { error: "Medya deposu yapılandırılmamış (BLOB_READ_WRITE_TOKEN eksik)." },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (body.type !== "blob.upload-completed") {
    const origin = req.headers.get("origin");
    const self = process.env.SITE_ORIGIN ?? "https://doganaykac.com";
    if (origin && origin !== self) {
      return NextResponse.json({ error: "Bad origin" }, { status: 403 });
    }
    const jar = await cookies();
    if (!sessionIsValid(jar.get(SESSION_COOKIE)?.value)) {
      return NextResponse.json({ error: "Oturum geçersiz. Tekrar giriş yap." }, { status: 401 });
    }
  }

  try {
    const result = await handleUpload({
      token,
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        // The browser picks the pathname and this hook cannot rewrite it —
        // only accept or reject. src/lib/media.ts is what the client used to
        // build it, and MEDIA_PATHNAME_RE is what that function can produce:
        // one segment under media/, lowercase, no slashes, so `..` and nested
        // paths cannot appear. Throwing here refuses the token.
        if (!MEDIA_PATHNAME_RE.test(pathname)) {
          throw new Error(`rejected pathname: ${pathname}`);
        }
        return {
          // Enforced by Blob itself against the real upload, not just by us.
          allowedContentTypes: [...MEDIA_TYPES],
          maximumSizeInBytes: MAX_CLIENT_UPLOAD_BYTES,
          // The client path skips our sniffing, so a random suffix is the only
          // thing keeping one upload from quietly replacing another.
          addRandomSuffix: true,
          cacheControlMaxAge: CACHE_MAX_AGE,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Nothing to persist: the panel lists media by querying Blob, so the
        // upload is already visible. Logged only so a failing callback is
        // findable. Note Vercel cannot reach localhost, so this never fires in
        // development — which is fine precisely because nothing depends on it.
        console.log("[media/token] upload completed", blob.pathname);
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    // Covers a rejected pathname, a bad signature, and an expired token alike.
    // The detail goes to the log; the caller gets a status and nothing else.
    console.error("[media/token] failed", e);
    return NextResponse.json({ error: "Yükleme izni verilemedi." }, { status: 400 });
  }
}
