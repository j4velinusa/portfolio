import { NextResponse } from "next/server";
import { passwordMatches, issueSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "Admin is not configured on this deployment (ADMIN_PASSWORD / SESSION_SECRET)." },
      { status: 503 },
    );
  }

  let password = "";
  try {
    ({ password } = await req.json());
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
