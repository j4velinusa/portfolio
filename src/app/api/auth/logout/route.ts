import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUBSCRIBER_COOKIE, subscriberCookieOptions } from "@/lib/subscriber-auth";
import { SITE_URL } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST, not GET: a logout on GET can be triggered by any image tag pointing at
 * it, which is a nuisance rather than a breach but a pointless one to allow.
 *
 * The session is a signed cookie with no server-side record, so this cannot
 * revoke a token that has already been copied elsewhere — it clears the one in
 * this browser. Real revocation would need a session table, which is a cost
 * worth paying only if account sharing turns out to be a problem.
 */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const self = process.env.SITE_ORIGIN ?? SITE_URL;
  if (origin && origin !== self) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  const jar = await cookies();
  jar.set(SUBSCRIBER_COOKIE, "", { ...subscriberCookieOptions, maxAge: 0 });

  return NextResponse.json({ ok: true });
}
