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
 * POST, AND THAT IS THE WHOLE POINT. This was a GET reached straight from the
 * email, and it did not survive contact with a real inbox: Gmail visits links
 * in incoming mail to scan them, so the token was consumed by a crawler before
 * the human ever clicked, and the human got "already used". Verified in
 * production, on the first real send.
 *
 * So the email now points at /[lang]/courses/giris, a page that only reads the
 * token and renders a button. Consuming happens here, on the POST that button
 * submits. Scanners issue GET; they land on the page, and nothing is spent.
 *
 * The cost is one extra click, which is the standard price for this and is
 * cheap next to a sign-in flow that silently fails for every Gmail user.
 *
 * The form is a plain HTML form — no JavaScript — so this also works with
 * scripting disabled, and `form-action 'self'` in the CSP already permits it.
 */
export async function POST(req: Request) {
  const self = process.env.SITE_ORIGIN ?? SITE_URL;
  const back = (lang: string, status: string) =>
    NextResponse.redirect(`${self}/${lang}/courses?giris=${status}`, 303);

  const origin = req.headers.get("origin");
  if (origin && origin !== self) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  if (!dbConfigured() || !process.env.SESSION_SECRET) {
    return back("tr", "yapilandirilmamis");
  }

  let token: string | undefined;
  try {
    const form = await req.formData();
    const t = form.get("t");
    token = typeof t === "string" ? t : undefined;
  } catch {
    return back("tr", "gecersiz");
  }

  const link = readLoginLink(token);
  if (!link || !token) {
    // Expired and forged are the same answer on purpose.
    return back("tr", "gecersiz");
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
      return back(link.lang, "kullanilmis");
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

    return back(link.lang, "tamam");
  } catch (e) {
    console.error("[auth/verify] unexpected", e);
    return back(link.lang, "hata");
  }
}
