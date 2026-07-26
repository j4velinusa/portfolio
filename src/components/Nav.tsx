"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { site } from "@/content/site";

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label="Language">
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>
        EN
      </button>
      <button className={lang === "tr" ? "on" : ""} onClick={() => setLang("tr")} aria-pressed={lang === "tr"}>
        TR
      </button>
    </div>
  );
}

export function Nav({ variant = "home" }: { variant?: "home" | "project" }) {
  const { lang } = useLang();
  const t = site.nav;

  return (
    <nav className="nav">
      {variant === "home" ? (
        <Link href="/" className="nav-brand">
          {site.name}
        </Link>
      ) : (
        <Link href="/" className="nav-brand" style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>
          ‹ {site.name}
        </Link>
      )}
      <div className="nav-links">
        <a href="/#work">{t.work[lang]}</a>
        <a href="/#stack">{t.stack[lang]}</a>
        <a href="/#about">{t.about[lang]}</a>
        <a href="/#contact" className="nav-cta">
          {t.contact[lang]}
        </a>
        <LangSwitch />
      </div>
    </nav>
  );
}
