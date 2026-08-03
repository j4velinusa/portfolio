import type { Metadata } from "next";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/lib/i18n";
import { readLoginLink } from "@/lib/subscriber-auth";
import { rivieraTheme } from "@/lib/riviera";
import { courseCopy } from "@/content/courses";

const ui = Manrope({ variable: "--font-ui", subsets: ["latin", "latin-ext"], display: "swap" });

/**
 * A one-time link target. It must never be indexed, and there is nothing here
 * worth crawling anyway.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const COPY: Record<Lang, Record<string, string>> = {
  tr: {
    title: "Giriş yap",
    lead: "Devam etmek için aşağıdaki butona bas.",
    button: "Giriş yap",
    why: "Bu bir adım fazladan görünebilir, ama gerekli: e-posta sağlayıcıları gelen postalardaki bağlantıları güvenlik taraması için otomatik ziyaret ediyor. Bağlantı tıklanır tıklanmaz tükenseydi, giriş hakkını sen değil o tarama harcardı.",
    badTitle: "Bu bağlantı çalışmıyor",
    badLead: "Bağlantının süresi dolmuş ya da geçersiz. Giriş bağlantıları 15 dakika geçerli.",
    back: "← Kurs sayfasına dön",
  },
  en: {
    title: "Sign in",
    lead: "Press the button below to continue.",
    button: "Sign in",
    why: "This extra step is deliberate: mail providers visit links in incoming email to scan them. If the link spent itself on being opened, that scan would use up your sign-in before you ever clicked.",
    badTitle: "This link does not work",
    badLead: "It has expired or is invalid. Sign-in links are valid for 15 minutes.",
    back: "← Back to the course",
  },
};

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const { t } = await searchParams;

  // Signature and expiry only — deliberately NOT consumed here. This page is
  // what a link scanner reaches, and it has to leave the token spendable.
  const link = readLoginLink(t);
  const c = COPY[lang];

  return (
    <div className={`riviera ${ui.variable}`} style={rivieraTheme}>
      <main className="giris">
        <div className="giris-card">
          <div className="giris-brand">{courseCopy.brand}</div>

          {link && t ? (
            <>
              <h1 className="giris-title">{c.title}</h1>
              <p className="giris-lead">{c.lead}</p>
              <p className="giris-mail">{link.email}</p>

              {/* A plain form, so this works without JavaScript. The POST is
                  what consumes the token; `form-action 'self'` already allows
                  it, so the CSP needs no change. */}
              <form method="POST" action="/api/auth/verify">
                <input type="hidden" name="t" value={t} />
                <button type="submit" className="giris-btn">
                  {c.button}
                </button>
              </form>

              <p className="giris-why">{c.why}</p>
            </>
          ) : (
            <>
              <h1 className="giris-title">{c.badTitle}</h1>
              <p className="giris-lead">{c.badLead}</p>
              <Link href={`/${lang}/courses`} className="giris-back">
                {c.back}
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
