import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, dbConfigured } from "@/lib/db";
import {
  SUBSCRIBER_COOKIE,
  issueSubscriberSession,
  readLoginLink,
  sha256,
  subscriberCookieOptions,
} from "@/lib/subscriber-auth";
import { SITE_URL } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consumes a magic link and starts a subscriber session.
 *
 * GET, because it is reached by clicking a link in an email. That makes it the
 * one endpoint here without CSRF protection, which is fine only because it is
 * not a state-changing action an attacker can aim at a victim: the worst a
 * forged visit achieves is burning a token the attacker already holds. A
 * genuine link is unforgeable (HMAC) and single-use (the DELETE below).
 *
 * The redirect target comes from the signed payload, never from the query
 * string — a redirect that trusts its own URL is an open redirect.
 */
export async function GET(req: Request) {
  const self = process.env.SITE_ORIGIN ?? SITE_URL;

  if (!dbConfigured() || !process.env.SESSION_SECRET) {
    return NextResponse.redirect(`${self}/tr/courses?giris=yapilandirilmamis`, 303);
  }

  const token = new URL(req.url).searchParams.get("t") ?? undefined;
  const link = readLoginLink(token);
  if (!link || !token) {
    // Expired and forged are the same answer on purpose.
    return NextResponse.redirect(`${self}/tr/courses?giris=gecersiz`, 303);
  }

  try {
    const sql = db();

    // The single-use guarantee, and the reason this is one statement: two
    // concurrent redemptions of the same link both reach here, and exactly one
    // DELETE can return a row. A SELECT-then-DELETE would let both through.
    const consumed = await sql`
      DELETE FROM login_token
       WHERE token_hash = ${sha256(token)} AND expires_at > now()
      RETURNING email
    `;
    if (consumed.length === 0) {
      return NextResponse.redirect(`${self}/${link.lang}/courses?giris=kullanilmis`, 303);
    }

    // Trust the row, not the token: the address that was stored when the link
    // was issued is authoritative.
    const email = String(consumed[0].email);

    const rows = await sql`
      INSERT INTO subscriber (email) VALUES (${email})
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `;
    const subscriberId = Number(rows[0].id);
    if (!Number.isSafeInteger(subscriberId) || subscriberId <= 0) {
      throw new Error(`unexpected subscriber id: ${rows[0]?.id}`);
    }

    const jar = await cookies();
    jar.set(SUBSCRIBER_COOKIE, issueSubscriberSession(subscriberId, email), subscriberCookieOptions);

    return NextResponse.redirect(`${self}/${link.lang}/courses?giris=tamam`, 303);
  } catch (e) {
    console.error("[auth/verify] unexpected", e);
    return NextResponse.redirect(`${self}/${link.lang}/courses?giris=hata`, 303);
  }
}
