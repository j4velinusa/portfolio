import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";
import {
  LOGIN_LINK_MINUTES,
  MAX_PENDING_LINKS,
  isEmail,
  issueLoginLink,
  normalizeEmail,
} from "@/lib/subscriber-auth";
import { isLang, SITE_URL, type Lang } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COPY: Record<Lang, { subject: string; lead: string; button: string; note: string }> = {
  tr: {
    subject: "Riviera Aesthetic — giriş bağlantın",
    lead: "Derslere girmek için aşağıdaki bağlantıya tıkla.",
    button: "Giriş yap",
    note: `Bu bağlantı ${LOGIN_LINK_MINUTES} dakika geçerli ve yalnızca bir kez kullanılabilir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.`,
  },
  en: {
    subject: "Riviera Aesthetic — your sign-in link",
    lead: "Click the link below to open the lessons.",
    button: "Sign in",
    note: `This link is valid for ${LOGIN_LINK_MINUTES} minutes and can only be used once. If you did not request it, you can ignore this email.`,
  },
};

/**
 * Sends a magic link. Deliberately answers the same 200 whatever happens after
 * validation: whether an address has ever subscribed is not something an
 * unauthenticated caller gets to probe by watching responses.
 *
 * Entitlement is NOT checked here. Anyone may hold a session; what a session
 * buys is checked at the lesson, against the subscription table. Gating the
 * link itself would leak the subscriber list and would break the case where
 * someone pays under one address and signs in before the webhook lands.
 */
export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  // Names the variables that are actually absent rather than listing all four.
  // "Something is unconfigured" is unactionable when four things could be, and
  // a variable NAME is not a secret — publish/route.ts already names its own.
  const missing = (
    [
      ["DATABASE_URL", dbConfigured()],
      ["RESEND_API_KEY", Boolean(key)],
      ["RESEND_FROM", Boolean(from)],
      ["SESSION_SECRET", Boolean(process.env.SESSION_SECRET)],
    ] as const
  )
    .filter(([, present]) => !present)
    .map(([name]) => name);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Giriş yapılandırılmamış — eksik: ${missing.join(", ")}` },
      { status: 503 },
    );
  }

  const origin = req.headers.get("origin");
  const self = process.env.SITE_ORIGIN ?? SITE_URL;
  if (origin && origin !== self) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }

  let body: { email?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi gir." }, { status: 400 });
  }
  const lang: Lang = typeof body.lang === "string" && isLang(body.lang) ? body.lang : "tr";

  const ok = NextResponse.json({
    ok: true,
    message:
      lang === "tr"
        ? "Bağlantıyı gönderdik. Gelen kutunu kontrol et."
        : "Link sent. Check your inbox.",
  });

  try {
    const sql = db();

    // Housekeeping on the cheapest path there is — this table is only ever
    // read by token hash, so letting dead rows accumulate would cost nothing
    // except a table that grows forever.
    await sql`DELETE FROM login_token WHERE expires_at < now()`;

    // Rate limit by counting live links rather than keeping a counter table.
    const pending = await sql`
      SELECT count(*)::int AS n FROM login_token
       WHERE email = ${email} AND expires_at > now()
    `;
    if ((pending[0]?.n ?? 0) >= MAX_PENDING_LINKS) {
      // Still a 200-shaped answer to the caller: a 429 here would confirm the
      // address is being targeted. The log is where this belongs.
      console.warn("[auth/link] rate limited", email);
      return ok;
    }

    const link = issueLoginLink(email, lang);
    await sql`
      INSERT INTO login_token (token_hash, email, expires_at)
      VALUES (${link.tokenHash}, ${email}, ${link.expiresAt.toISOString()})
    `;

    const url = `${self}/api/auth/verify?t=${encodeURIComponent(link.token)}`;
    const c = COPY[lang];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from,
        to: [email],
        subject: c.subject,
        text: `${c.lead}\n\n${url}\n\n${c.note}`,
        html:
          `<div style="font:16px/1.6 -apple-system,Segoe UI,sans-serif;color:#1c1b19">` +
          `<p>${c.lead}</p>` +
          `<p><a href="${url}" style="display:inline-block;background:#137a63;color:#fbfaf7;` +
          `padding:12px 22px;border-radius:11px;text-decoration:none;font-weight:700">${c.button}</a></p>` +
          `<p style="font-size:13px;color:#5c5749">${c.note}</p></div>`,
      }),
    });

    if (!res.ok) {
      // The upstream body can name the account and the domain; it goes to the
      // log, never to the caller.
      console.error("[auth/link] resend failed", res.status, await res.text());
    }
  } catch (e) {
    console.error("[auth/link] unexpected", e);
  }

  return ok;
}
