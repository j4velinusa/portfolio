import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * One signed-token primitive, shared by the admin session, the subscriber
 * session and the single-use magic link.
 *
 * WHY THE ENCODING CHANGED. The original admin cookie was `<expiry>.<mac>`
 * with the expiry as a bare integer, read back with `token.split(".")` and
 * `Number(payload)`. That is correct only while the payload can never contain
 * a "." — and the first thing a subscriber cookie has to carry is an email
 * address, most of which do. It would not have failed loudly either: split()
 * would hand back the wrong segments, Number() would produce NaN, and every
 * comparison against it is false, so everyone is simply locked out.
 *
 * base64url has no "." in its alphabet, so exactly one separator can ever
 * appear no matter what the payload holds, and the split is unambiguous.
 *
 * THE KIND FIELD IS NOT DECORATION. Every token here is signed with the same
 * key, so without it a valid admin cookie would verify perfectly as a
 * subscriber cookie and vice versa. The kind is inside the signed payload, so
 * it cannot be swapped.
 *
 * Server-only: reaches node:crypto. Never import from a "use client" module.
 */

export type TokenKind = "admin" | "subscriber" | "login";

/** Bumped only if the payload shape changes incompatibly; old tokens then fail closed. */
const VERSION = 1;

/**
 * The MAC key is deliberately NOT any login password.
 *
 * A token is `<payload>.HMAC(key, <payload>)` and the payload travels in
 * plaintext, so anyone holding one token holds a matched (message, MAC) pair.
 * If the key were a human-chosen password, a single leaked cookie — a proxy
 * log, a shared machine, an error report with headers — would let them crack
 * it offline at GPU speed. With a full-entropy key the same pair is worthless.
 */
function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 chars — generate one with: openssl rand -base64 32",
    );
  }
  return s;
}

const sign = (payload: string) =>
  createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

type Claims = Record<string, unknown>;

export function issueToken(kind: TokenKind, claims: Claims, ttlMs: number): string {
  const body = { ...claims, v: VERSION, k: kind, exp: Date.now() + ttlMs };
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * Returns the claims, or null for anything at all wrong. Callers get one
 * boolean's worth of information: there is no "expired" vs "forged" vs
 * "malformed" distinction to leak.
 *
 * Order matters here. The MAC is checked BEFORE the payload is decoded and
 * parsed, so JSON.parse never touches bytes an attacker chose.
 */
export function readToken(kind: TokenKind, token: string | undefined): Claims | null {
  if (!token) return null;

  // indexOf, not split: a forged token with extra dots would otherwise have
  // its later segments silently dropped by array destructuring.
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (mac.includes(".")) return null;

  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof claims !== "object" || claims === null || Array.isArray(claims)) return null;

  const c = claims as Claims;
  if (c.v !== VERSION) return null;
  if (c.k !== kind) return null;
  if (typeof c.exp !== "number" || !Number.isFinite(c.exp) || c.exp <= Date.now()) return null;

  return c;
}
