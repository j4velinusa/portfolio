import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Single-author admin. There is no user table: one password from the
 * environment, exchanged for a short-lived signed cookie. The password itself
 * is never stored in the cookie and never reaches the client bundle.
 */

export const SESSION_COOKIE = "da_admin";
const SESSION_HOURS = 12;

function adminPassword(): string {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD is not set");
  return s;
}

/**
 * The session MAC key is deliberately NOT the login password.
 *
 * A cookie is `<expires>.HMAC(key, <expires>)`, and `expires` travels in
 * plaintext — so anyone holding one cookie holds a matched (message, MAC)
 * pair. If that key were the password, a single leaked cookie (proxy log,
 * shared machine, error report with headers) would let them crack a
 * human-chosen password offline at GPU speed. With a full-entropy key the
 * same pair is worthless.
 */
function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 chars — generate one with: openssl rand -base64 32");
  }
  return s;
}

/** Constant-time compare so a wrong password can't be found by timing. */
export function passwordMatches(given: string): boolean {
  const expected = Buffer.from(adminPassword());
  const actual = Buffer.from(given ?? "");
  if (expected.length !== actual.length) {
    // Still burn a comparison so the failure takes the same shape.
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(expected, actual);
}

const sign = (payload: string) =>
  createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

export function issueSession(): string {
  const expires = Date.now() + SESSION_HOURS * 3600_000;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function sessionIsValid(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;

  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return Number(payload) > Date.now();
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};
