import { timingSafeEqual } from "node:crypto";
import { issueToken, readToken } from "@/lib/signed-token";

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

/**
 * The token itself lives in @/lib/signed-token, which is also what the
 * subscriber session and the magic link will use. The "admin" kind is signed
 * into the payload: without it, one key signing several token types would let
 * a subscriber cookie verify as an admin cookie.
 */
export function issueSession(): string {
  return issueToken("admin", {}, SESSION_HOURS * 3600_000);
}

export function sessionIsValid(token: string | undefined): boolean {
  return readToken("admin", token) !== null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};
