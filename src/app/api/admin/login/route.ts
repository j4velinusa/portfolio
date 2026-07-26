import { NextResponse } from "next/server";
import { passwordMatches, issueSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin is not configured on this deployment." }, { status: 503 });
  }

  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // A deliberate small delay blunts trivial online guessing without needing
  // shared state for rate limiting.
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
