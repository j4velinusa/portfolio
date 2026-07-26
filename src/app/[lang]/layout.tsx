import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { LANGS, isLang, metaAlternates, SITE_URL, type Lang } from "@/lib/i18n";

// latin-ext is what carries the Turkish glyphs ğ Ğ ş Ş İ. Without it they are
// still served (they live in a separate @font-face) but the file is discovered
// late, so Turkish letters visibly swap in after the rest of the text.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const COPY: Record<Lang, { title: string; description: string }> = {
  en: {
    title: "Doğan Aykaç — Full-Stack Developer",
    description:
      "Full-stack developer building agent platforms, encrypted communities, safe marketplaces and retail automation. Twelve years of shipping. Available for work.",
  },
  tr: {
    title: "Doğan Aykaç — Full-Stack Geliştirici",
    description:
      "Ajan platformları, şifreli topluluklar, güvenli pazar yerleri ve perakende otomasyonu geliştiren full-stack geliştirici. On iki yıllık üretim. İşe açık.",
  },
};

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = COPY[lang];

  return {
    metadataBase: new URL(SITE_URL),
    title: copy.title,
    description: copy.description,
    alternates: metaAlternates(lang),
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `${SITE_URL}/${lang}`,
      siteName: "Doğan Aykaç",
      locale: lang === "tr" ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
