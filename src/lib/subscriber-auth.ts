import { createHash, randomBytes } from "node:crypto";
import { issueToken, readToken } from "@/lib/signed-token";
import { isLang, type Lang } from "@/lib/i18n";

/**
 * Subscriber identity for the course.
 *
 * There is no password and no user table to register into: identity is an
 * email address, proven by receiving a link at it. That keeps the surface
 * small — nothing to leak, nothing to reset, no password rules — and it fits
 * the shape of the product, where the thing being protected is a monthly
 * subscription rather than an account.
 *
 * TWO INDEPENDENT LAYERS GUARD THE LINK, and they cover different attacks:
 *
 *   The HMAC makes a link unforgeable. Without it, anyone could mint a token
 *   for any address and read the email straight out of the payload.
 *
 *   The database row makes it single-use. An HMAC alone is happily replayable
 *   forever until it expires, so a link sitting in an inbox — or in a mail
 *   provider's link-scanner logs — would stay live. Verification is one atomic
 *   DELETE ... RETURNING, so two concurrent redemptions cannot both win.
 *
 * Only the SHA-256 of the token is ever stored. A leaked database dump must
 * not contain working login links.
 *
 * Server-only: reaches node:crypto.
 */

export const SUBSCRIBER_COOKIE = "da_sub";

/** Long enough that a monthly subscriber is not re-authenticating constantly. */
const SESSION_DAYS = 30;

/** Short: the link is delivered instantly and only has to survive one click. */
export const LOGIN_LINK_MINUTES = 15;

/** Unexpired links one address may hold at once — a cheap send-rate limit. */
export const MAX_PENDING_LINKS = 5;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Stored lower-cased and trimmed; the schema CHECK enforces the same thing. */
export const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

/**
 * Deliberately loose. Strict RFC 5322 validation rejects addresses that work,
 * and the real proof of an address is that a link sent to it comes back — this
 * only rejects input that cannot be an address at all.
 */
export function isEmail(v: string): boolean {
  return v.length >= 6 && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export type LoginLink = { token: string; tokenHash: string; expiresAt: Date };

/**
 * `lang` rides inside the signed payload rather than on the verify URL. The
 * verify route redirects using it, and a redirect target taken from an
 * attacker-controllable query string is how open redirects happen.
 */
export function issueLoginLink(email: string, lang: Lang): LoginLink {
  const ttl = LOGIN_LINK_MINUTES * 60_000;
  // The nonce keeps two links issued in the same millisecond for the same
  // address from being byte-identical, so their hashes differ and consuming
  // one cannot consume the other.
  const token = issueToken(
    "login",
    { email, lang, n: randomBytes(16).toString("base64url") },
    ttl,
  );
  return { token, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttl) };
}

/** Signature and expiry only. Single-use is the caller's atomic DELETE. */
export function readLoginLink(token: string | undefined): { email: string; lang: Lang } | null {
  const claims = readToken("login", token);
  if (!claims) return null;
  const email = typeof claims.email === "string" ? claims.email : null;
  if (!email || !isEmail(email)) return null;
  const lang: Lang = typeof claims.lang === "string" && isLang(claims.lang) ? claims.lang : "tr";
  return { email, lang };
}

export function issueSubscriberSession(subscriberId: number, email: string): string {
  return issueToken("subscriber", { sub: subscriberId, email }, SESSION_DAYS * 86_400_000);
}

export function readSubscriberSession(
  cookie: string | undefined,
): { subscriberId: number; email: string } | null {
  const claims = readToken("subscriber", cookie);
  if (!claims) return null;
  const sub = claims.sub;
  const email = claims.email;
  if (typeof sub !== "number" || !Number.isSafeInteger(sub) || sub <= 0) return null;
  if (typeof email !== "string" || !isEmail(email)) return null;
  return { subscriberId: sub, email };
}

export const subscriberCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
};
