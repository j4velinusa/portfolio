import { createHash } from "node:crypto";

/**
 * Signed playback URLs for Bunny Stream.
 *
 * The library has "Embed view token authentication" switched on, so an embed
 * URL without a valid token is refused and the player never loads. That is the
 * whole gate: the entitlement check happens on our server, and only if it
 * passes do we mint a token. "Enable direct play" is off for the same reason —
 * with it on, anyone holding a video id could watch, and none of this would
 * matter.
 *
 * Server-only. BUNNY_TOKEN_SECURITY_KEY must never reach the browser: anyone
 * holding it can sign their own URLs for any video in the library, forever.
 * Bunny's own docs are explicit — "Generate tokens server-side — never expose
 * your token security key in client-side code."
 */

const EMBED_HOST = "https://player.mediadelivery.net";

/**
 * How long a minted URL stays playable. A token cannot be revoked once issued,
 * so this is also the worst-case lag between a subscription ending and access
 * actually stopping. Two hours is long enough to watch a lesson and seek
 * around inside it, short enough that a link pasted into a group chat is dead
 * before it spreads.
 */
export const PLAYBACK_TTL_SECONDS = 2 * 60 * 60;

export function bunnyConfigured(): boolean {
  return Boolean(process.env.BUNNY_LIBRARY_ID && process.env.BUNNY_TOKEN_SECURITY_KEY);
}

/** Names what is absent, so a misconfiguration is diagnosable from the outside. */
export function bunnyMissing(): string[] {
  return (
    [
      ["BUNNY_LIBRARY_ID", Boolean(process.env.BUNNY_LIBRARY_ID)],
      ["BUNNY_TOKEN_SECURITY_KEY", Boolean(process.env.BUNNY_TOKEN_SECURITY_KEY)],
    ] as const
  )
    .filter(([, present]) => !present)
    .map(([name]) => name);
}

/** Bunny video ids are GUIDs; refuse anything else before it reaches a URL. */
export const isBunnyVideoId = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/**
 * token = SHA256_HEX(token_security_key + video_id + expires)
 *
 * `expires` is a UNIX timestamp in SECONDS. Bunny's docs say so explicitly,
 * and Date.now() returns milliseconds — passing it straight through yields a
 * token that looks fine and is rejected, or one valid for fifty thousand
 * years. It is the easiest thing here to get wrong.
 */
export function playbackToken(videoId: string, expiresAtSeconds: number): string {
  const key = process.env.BUNNY_TOKEN_SECURITY_KEY;
  if (!key) throw new Error("BUNNY_TOKEN_SECURITY_KEY is not set");
  return createHash("sha256").update(`${key}${videoId}${expiresAtSeconds}`).digest("hex");
}

export type EmbedOptions = {
  /** Resume position in seconds, from lesson_progress. */
  startAtSeconds?: number;
  /** Seconds from now until the URL stops working. */
  ttlSeconds?: number;
};

/**
 * The full signed embed URL. Never build this in a client component and never
 * bake it into a statically generated page — it carries a live credential and
 * a static page would serve one long-expired token to everybody.
 */
export function signedEmbedUrl(videoId: string, opts: EmbedOptions = {}): string {
  if (!isBunnyVideoId(videoId)) throw new Error(`not a Bunny video id: ${videoId}`);

  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!libraryId) throw new Error("BUNNY_LIBRARY_ID is not set");

  const expires = Math.floor(Date.now() / 1000) + (opts.ttlSeconds ?? PLAYBACK_TTL_SECONDS);
  const token = playbackToken(videoId, expires);

  const url = new URL(`${EMBED_HOST}/embed/${libraryId}/${videoId}`);
  url.searchParams.set("token", token);
  url.searchParams.set("expires", String(expires));

  // Resume. Bunny's own `rememberPosition` keeps state in the viewer's browser,
  // which is exactly the thing that does not survive changing devices — the
  // position comes from our own table instead.
  const start = Math.floor(opts.startAtSeconds ?? 0);
  if (start > 0) url.searchParams.set("t", `${start}s`);

  return url.toString();
}

/** The one host that has to be allowed in `frame-src`, and nothing else. */
export const BUNNY_EMBED_ORIGIN = EMBED_HOST;
