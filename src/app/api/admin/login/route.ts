import { NextResponse } from "next/server";
import { passwordMatches, issueSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A password fits in far less; anything larger is not a login attempt. */
const MAX_BODY = 2048;

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "Admin is not configured on this deployment (ADMIN_PASSWORD / SESSION_SECRET)." },
      { status: 503 },
    );
  }

  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let password = "";
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    ({ password } = JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Levels the response time between "wrong length" and "wrong bytes" so the
  // reply shape leaks nothing. It is NOT rate limiting: on serverless, parallel
  // requests each sleep independently. Brute-force resistance comes from a
  // high-entropy ADMIN_PASSWORD plus an edge rate-limit rule (see README).
  await new Promise((r) => setTimeout(r, 400));

  if (!passwordMatches(password ?? "")) {
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, issueSession(), sessionCookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
