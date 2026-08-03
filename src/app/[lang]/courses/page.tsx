import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, otherLang, SITE_URL, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { courseCopy } from "@/content/courses";
import { getCourse, totalLessons, fillCounts, type CourseData } from "@/lib/course";
import { CourseJsonLd } from "@/components/JsonLd";

// Loaded only by this route, so the dark chrome pages never fetch them. Both
// carry `latin-ext` because the page is Turkish-first (zekâ, İçindekiler, ₺).
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});

const ui = Manrope({
  variable: "--font-ui",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const title = courseCopy.meta.title[lang];
  const description = courseCopy.meta.description[lang];
  return {
    title,
    description,
    alternates: metaAlternates(lang, "/courses"),
    // Metadata merging is shallow — setting openGraph here replaces the
    // layout's whole object, so siteName/locale/url are restated.
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/${lang}/courses`,
      siteName: site.name,
      locale: lang === "tr" ? "tr_TR" : "en_US",
      images: [{ url: "/og/courses.jpg", width: 1200, height: 630, alt: title }],
    },
  };
}

/** "2026-08-01" -> "August 2026" / "Ağustos 2026". Dates are validated by getCourse(). */
function monthYear(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * The buy CTA. `paymentLink` is "" in the shipped state, which means the button
 * falls back to the mailto the comp specified; a real https:// link overrides it.
 */
function ctaTarget(data: CourseData) {
  if (data.paymentLink !== "") return { href: data.paymentLink, external: true };
  return {
    href: `mailto:${site.links.email}?subject=${encodeURIComponent(courseCopy.brand)}`,
    external: false,
  };
}

export default async function CoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const data = getCourse();
  const lessons = totalLessons(data);
  const cta = ctaTarget(data);
  const other = otherLang(lang);

  // The word after a module's lesson count ("6 lessons" / "6 ders") is the same
  // noun the stats band uses, so it is read from there instead of hardcoded.
  const lessonWord = courseCopy.stats[0].label[lang];

  // The site chrome is hard black; this page is warm paper. Redeclaring the
  // tokens on this one wrapper shadows :root for this subtree only — no other
  // route is touched. --line/--line2 MUST be dark alphas here or every border,
  // card edge and section rule inherits a white alpha and vanishes on paper.
  const themeVars = {
    "--bg": "#F1EFEA",
    "--bg2": "#FBFAF7",
    "--surface": "#FBFAF7",
    "--surface2": "#FFFFFF",
    "--text": "#1C1B19",
    "--muted": "#5C5749",
    "--dim": "#8E897D",
    "--accent": "#137A63",
    "--accent2": "#5FCBAA",
    "--deep": "#0E3A2E",
    "--sand": "#E7E4DD",
    "--line": "rgba(28, 27, 25, 0.07)",
    "--line2": "rgba(28, 27, 25, 0.16)",
  } as React.CSSProperties;

  return (
    <div className={`riviera ${display.variable} ${ui.variable}`} style={themeVars}>
      {/* No `price`: the only price we hold is a localised display string
          ("₺1.000 / ay" vs "₺1,000 / month"), and guessing a number out of it
          would mean deciding whether "1.000" is one or a thousand. A Course
          without an Offer is still valid schema; an Offer with the wrong
          number is a lie about what the page charges. The visible price on
          the page is the source of truth until course.json carries a real
          numeric field. */}
      <CourseJsonLd
        lang={lang}
        name={courseCopy.meta.title[lang]}
        description={courseCopy.meta.description[lang]}
        price={null}
        modules={data.modules.map((m) => ({
          name: m.title[lang],
          description: m.summary[lang],
        }))}
      />

      <nav className="rv-nav">
        <a href="#top" className="rv-brand">
          {courseCopy.brand}
        </a>
        {/* The comp hides these below 900px with no replacement; here they stay
            reachable as a horizontally scrollable row on the second nav line. */}
        <div className="rv-nav-links">
          <a href="#gallery">{courseCopy.nav.gallery[lang]}</a>
          <a href="#curriculum">{courseCopy.nav.curriculum[lang]}</a>
          <a href="#who">{courseCopy.nav.who[lang]}</a>
          <a href="#faq">{courseCopy.nav.faq[lang]}</a>
        </div>
        <div className="rv-nav-right">
          {/* A real link, not a state toggle: a client-side switch is invisible
              to crawlers and would break the canonical/hreflang scheme. */}
          <Link href={`/${other}/courses`} hrefLang={other} className="rv-lang">
            {courseCopy.nav.langLabel[lang]}
          </Link>
          <a href="#buy" className="rv-nav-cta">
            {data.ctaLabel[lang]}
          </a>
        </div>
      </nav>

      <div id="top" className="rv-mosaic">
        {data.hero.map((h, i) => {
          const wide = i === 0 || i === 3;
          return (
            <div key={h.id} className="rv-shot">
              <Image
                src={h.image}
                alt=""
                fill
                preload
                sizes={
                  wide ? "(max-width: 900px) 100vw, 50vw" : "(max-width: 900px) 50vw, 25vw"
                }
              />
            </div>
          );
        })}
      </div>

      <header className="rv-hero">
        <div className="rv-eyebrow">{courseCopy.hero.eyebrow[lang]}</div>
        <h1 className="rv-h1">
          {courseCopy.hero.line1[lang]}
          <br />
          {courseCopy.hero.line2[lang]}
        </h1>
        <p className="rv-hero-sub">{courseCopy.hero.sub[lang]}</p>
        <div className="rv-cta-row">
          <a href="#buy" className="rv-cta">
            <span className="rv-cta-label">{data.ctaLabel[lang]}</span>
            <span className="rv-cta-price">{data.price[lang]}</span>
          </a>
          <a href="#curriculum" className="rv-cta-ghost">
            {courseCopy.hero.ctaSecondary[lang]}
          </a>
        </div>
      </header>

      <section className="rv-stats">
        {courseCopy.stats.map((s, i) => (
          <div key={s.label.en}>
            {/* The first two figures are derived from content/course.json so an
                owner edit can never contradict the module list below. */}
            <div className="rv-stat-n">
              {i === 0 ? String(lessons) : i === 1 ? String(data.modules.length) : s.value}
            </div>
            <div className="rv-stat-l">{s.label[lang]}</div>
          </div>
        ))}
      </section>

      <section className="rv-sec rv-sec-narrow">
        <h2 className="rv-h2 rv-h2-lead">{courseCopy.thesis.title[lang]}</h2>
        <p className="rv-p">{courseCopy.thesis.p1[lang]}</p>
        <p className="rv-p">{courseCopy.thesis.p2[lang]}</p>
        <div className="rv-quote">
          <p>{courseCopy.thesis.pullQuote[lang]}</p>
        </div>
      </section>

      <section id="curriculum" className="rv-sec">
        <div className="rv-toc-head">
          <span className="rv-toc-label">{courseCopy.curriculum.label[lang]}</span>
          <span className="rv-toc-meta">
            {fillCounts(courseCopy.curriculum.meta[lang], data)}
          </span>
        </div>
        {data.modules.map((m, i) => (
          <div key={m.id} className="rv-mod">
            <span className="rv-mod-no">{String(i + 1).padStart(2, "0")}</span>
            <div className="rv-mod-body">
              <div className="rv-mod-title">{m.title[lang]}</div>
              <div className="rv-mod-desc">{m.summary[lang]}</div>
            </div>
            <span className="rv-mod-count">
              {m.lessons} {lessonWord}
            </span>
          </div>
        ))}
      </section>

      <section className="rv-sec">
        <div className="rv-eyebrow">{courseCopy.how.label[lang]}</div>
        <h2 className="rv-h2 rv-h2-tight">{courseCopy.how.title[lang]}</h2>
        <div className="rv-how">
          {courseCopy.how.steps.map((s) => (
            <div key={s.no} className="rv-card">
              <div className="rv-card-no">{s.no}</div>
              <div className="rv-card-title">{s.title[lang]}</div>
              <div className="rv-card-body">{s.body[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" className="rv-sec rv-sec-wide">
        <div className="rv-gallery-head">
          <div className="rv-eyebrow">{courseCopy.gallery.label[lang]}</div>
          <h2 className="rv-h2">{courseCopy.gallery.title[lang]}</h2>
          <p className="rv-gallery-sub">{courseCopy.gallery.sub[lang]}</p>
        </div>
        <div className="rv-gallery">
          {data.gallery.map((g) => (
            <div key={g.id} className="rv-shot">
              <Image
                src={g.image}
                alt={g.alt[lang]}
                fill
                sizes="(max-width: 900px) 50vw, 350px"
              />
            </div>
          ))}
        </div>
      </section>

      <section id="who" className="rv-sec rv-two">
        <div>
          <div className="rv-eyebrow">{courseCopy.who.forLabel[lang]}</div>
          <div className="rv-list">
            {courseCopy.who.forList[lang].map((f) => (
              <div key={f} className="rv-li">
                <span aria-hidden="true">—</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="rv-eyebrow rv-eyebrow-mute">{courseCopy.who.notForLabel[lang]}</div>
          <div className="rv-list rv-list-mute">
            {courseCopy.who.notForList[lang].map((f) => (
              <div key={f} className="rv-li">
                <span aria-hidden="true">—</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* An empty changelog is a legitimate state for a new course. */}
      {data.changelog.length > 0 && (
        <section className="rv-sec">
          <div className="rv-log-head">
            <div>
              <div className="rv-eyebrow">{courseCopy.changelog.label[lang]}</div>
              <h2 className="rv-h2">{courseCopy.changelog.title[lang]}</h2>
            </div>
            <span className="rv-log-note">{courseCopy.changelog.note[lang]}</span>
          </div>
          <div className="rv-log-list">
            {data.changelog.map((c) => (
              <div key={c.id} className="rv-log">
                <time className="rv-log-date" dateTime={c.date}>
                  {monthYear(c.date, lang)}
                </time>
                <div className="rv-log-title">{c.title[lang]}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="buy" className="rv-sec">
        <div className="rv-buy">
          <div className="rv-buy-label">{courseCopy.buy.label[lang]}</div>
          <div className="rv-price">{data.price[lang]}</div>
          <p className="rv-buy-sub">{courseCopy.buy.sub[lang]}</p>
          {cta.external ? (
            <a className="rv-buy-cta" href={cta.href} target="_blank" rel="noreferrer">
              {data.ctaLabel[lang]}
            </a>
          ) : (
            <a className="rv-buy-cta" href={cta.href}>
              {data.ctaLabel[lang]}
            </a>
          )}
          {!cta.external && <p className="rv-buy-note">{courseCopy.buy.mailtoNote[lang]}</p>}
          <div className="rv-perks">
            {courseCopy.buy.perks[lang].map((p) => (
              <span key={p}>{fillCounts(p, data)}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="rv-sec rv-teacher">
        <Image
          className="rv-teacher-photo"
          src="/dogan.png"
          alt={courseCopy.instructor.photoAlt[lang]}
          width={600}
          height={600}
          sizes="(max-width: 900px) 100vw, 320px"
        />
        <div>
          <div className="rv-eyebrow">{courseCopy.instructor.label[lang]}</div>
          <h2 className="rv-teacher-name">{courseCopy.instructor.name}</h2>
          <p className="rv-teacher-bio">{courseCopy.instructor.bio[lang]}</p>
          <Link href={`/${lang}`} className="rv-teacher-link">
            {courseCopy.instructor.link[lang]}
          </Link>
        </div>
      </section>

      <section id="faq" className="rv-sec rv-sec-narrow rv-sec-last">
        <div className="rv-eyebrow">{courseCopy.faqLabel[lang]}</div>
        <div className="rv-faq-list">
          {courseCopy.faqs.map((f) => (
            <div key={f.id} className="rv-faq">
              <div className="rv-faq-q">{f.q[lang]}</div>
              <div className="rv-faq-a">{f.a[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="rv-foot">
        <span className="rv-foot-brand">{courseCopy.brand}</span>
        <div className="rv-foot-links">
          <Link href={`/${lang}`}>{courseCopy.footer.backLink[lang]}</Link>
          <a href={`mailto:${site.links.email}`}>{site.links.email}</a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
