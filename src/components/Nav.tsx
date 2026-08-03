"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { otherLang, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";

/**
 * The language switcher is a real <a href> pointing at the same page in the other
 * locale. A button that swapped state client-side would be invisible to crawlers:
 * Google only follows <a> elements that have an href.
 */
export function Nav({ lang, variant = "home" }: { lang: Lang; variant?: "home" | "project" }) {
  const pathname = usePathname() || `/${lang}`;
  const other = otherLang(lang);
  const rest = pathname.replace(/^\/(en|tr)(?=\/|$)/, "");
  const home = `/${lang}`;
  const t = site.nav;

  return (
    <nav className="nav">
      <Link
        href={home}
        className="nav-brand"
        style={variant === "project" ? { color: "var(--muted)", fontWeight: 400, fontSize: 13 } : undefined}
      >
        {variant === "project" ? `‹ ${site.name}` : site.name}
      </Link>

      <div className="nav-links">
        <Link href={`${home}/work`}>{t.work[lang]}</Link>
        <Link href={`${home}/stack`}>{t.stack[lang]}</Link>
        <Link href={`${home}/blog`}>{t.blog[lang]}</Link>
        <Link href={`${home}/about`}>{t.about[lang]}</Link>
        <Link href={`${home}/courses`}>{t.courses[lang]}</Link>
        <Link href={`${home}/cv`}>{t.cv[lang]}</Link>
        <a href={`${home}#contact`} className="nav-cta">
          {t.contact[lang]}
        </a>

        <span className="lang" role="group" aria-label="Language">
          <Link href={home} className="on" hrefLang={lang} aria-current="true">
            {lang.toUpperCase()}
          </Link>
          <Link href={`/${other}${rest}`} hrefLang={other}>
            {other.toUpperCase()}
          </Link>
        </span>
      </div>
    </nav>
  );
}
