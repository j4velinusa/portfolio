/**
 * Shared vocabulary for the media library.
 *
 * There are two upload paths and they MUST agree on what is allowed and what a
 * stored filename looks like:
 *
 *   - small files POST to /api/admin/media, which streams them to Blob from the
 *     server. Vercel Functions hard-cap a request body at 4.5 MB.
 *   - large files (a magazine PDF is routinely 20 MB+) go straight from the
 *     browser to Blob with a short-lived client token from
 *     /api/admin/media/token, bypassing the function and its 4.5 MB ceiling.
 *
 * On the client-token path the BROWSER chooses the pathname — the SDK's
 * onBeforeGenerateToken hook can accept or reject a pathname but cannot rewrite
 * one. So the sanitiser has to run in the browser, and the route only gets to
 * verify the result. Two copies of that logic would drift, and the failure mode
 * is silent: the client would mint a name the server refuses, or worse, one it
 * accepts but did not expect. Hence one implementation, imported by both.
 *
 * This module must stay importable from a "use client" component: no node:*,
 * no next/server, no side effects.
 */

export type MediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "application/pdf";

export const MEDIA_TYPES: readonly MediaType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
];

export const isMediaType = (t: string): t is MediaType =>
  (MEDIA_TYPES as readonly string[]).includes(t);

/** The `accept` attribute for the file input, kept in step with the allowlist. */
export const MEDIA_ACCEPT = MEDIA_TYPES.join(",");

export const MEDIA_EXTENSION: Record<MediaType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

export const isPdf = (t: string) => t === "application/pdf";

/** A stored name ends in one of these, because the extension is derived from verified bytes. */
export const isPdfPath = (pathOrUrl: string) => /\.pdf$/i.test(pathOrUrl.split("?")[0]);

/** Everything this feature touches lives under one prefix, so a stray path can't reach other blobs. */
export const MEDIA_PREFIX = "media/";

/**
 * Below this a file goes through our own route. Vercel Functions reject a body
 * over 4.5 MB with their own opaque English 413, so ours has to fire first.
 */
export const MAX_PROXY_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Ceiling for the direct-to-Blob path. Blob itself accepts far more, but an
 * unbounded token is an unbounded bill — and nothing on this site is a 100 MB
 * document on purpose.
 */
export const MAX_CLIENT_UPLOAD_BYTES = 100 * 1024 * 1024;

/** Turkish letters NFKD cannot fix: ı has no decomposition, and ş/ğ round-trip badly. */
const TURKISH: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ç: "c",
  Ç: "c",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
};

/**
 * Filenames become URL path segments, so they get the same treatment slugs do:
 * ASCII-only, lowercase, bounded. The extension is derived from the *verified*
 * type rather than copied from the upload, so `x.png` holding a JPEG cannot
 * produce a lying url.
 */
export function safeMediaName(raw: string, type: MediaType): string {
  const ext = MEDIA_EXTENSION[type];
  const dot = raw.lastIndexOf(".");
  const base = dot > 0 ? raw.slice(0, dot) : raw;

  const stem =
    base
      .replace(/[ıİşŞğĞçÇöÖüÜ]/g, (c) => TURKISH[c] ?? c)
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .slice(0, 80 - ext.length - 1)
      .replace(/^[-.]+|[-.]+$/g, "") || "dosya";

  return `${stem}.${ext}`;
}

/** Full pathname for a fresh upload, prefix included. */
export const mediaPathFor = (raw: string, type: MediaType) =>
  `${MEDIA_PREFIX}${safeMediaName(raw, type)}`;

/**
 * What safeMediaName can produce, prefix included — the shape the token route
 * verifies before it will issue a token for a browser-chosen pathname. No
 * slashes beyond the prefix, so `..` and nested paths cannot appear.
 */
export const MEDIA_PATHNAME_RE = /^media\/[a-z0-9][a-z0-9._-]{0,119}$/;

/** Public blob delivery host: <storeId>.public.blob.vercel-storage.com, storeId is [a-z0-9]. */
export const BLOB_HOST_RE = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/;

/** Sanitised name + the SDK's random suffix, as it appears in a delivery URL's path. */
export const BLOB_PATH_RE = /^\/media\/[a-zA-Z0-9._-]{1,120}$/;
