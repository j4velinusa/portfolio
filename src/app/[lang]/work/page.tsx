import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";
import { Mockup } from "@/components/mockups";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const title = lang === "en" ? "Work — Doğan Aykaç" : "İşler — Doğan Aykaç";
  return {
    title,
    description: site.work.pageSub[lang],
    alternates: metaAlternates(lang, "/work"),
    openGraph: { title, description: site.work.pageSub[lang] },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  return (
    <>
      <RevealProvider />
      <Nav lang={lang} />

      <header className="pad" style={{ paddingBottom: 0, textAlign: "center" }}>
        <div className="container">
          <h1 className="h2">{site.work.title[lang]}</h1>
          <p className="h2sub" style={{ marginBottom: 26 }}>
            {site.work.pageSub[lang]}
          </p>
          <div className="legend">
            {projects.map((p) => (
              <span key={p.slug}>
                <span className="dot-sm" style={{ background: p.accent }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="section" style={{ padding: "48px 24px 90px" }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="work-list">
            {projects.map((p, i) => (
              <article key={p.slug} className={`work-row reveal${i % 2 ? " flip" : ""}`}>
                <div
                  className="glow"
                  style={{
                    background: `radial-gradient(ellipse at ${i % 2 ? "10%" : "90%"} 15%, color-mix(in oklab, ${p.accent} 20%, transparent), transparent 60%)`,
                  }}
                />
                <div className="work-row-text">
                  <div className="work-eyebrow" style={{ color: p.accent }}>
                    <span className="num">0{i + 1}</span> {p.name} · {p.category[lang].toUpperCase()}
                  </div>
                  <h2 className="work-title">{p.tagline[lang]}</h2>
                  <p className="work-blurb">{p.blurb[lang]}</p>
                  <ul className="bullets">
                    {p.bullets[lang].map((b) => (
                      <li key={b}>
                        <span style={{ color: p.accent }}>—</span> {b}
                      </li>
                    ))}
                  </ul>
                  <div className="row-actions">
                    <Link
                      href={`/${lang}/work/${p.slug}`}
                      className="btn pill-cta"
                      style={{ background: p.accent, color: p.slug === "xaron" ? "#fff" : "#1a1208" }}
                    >
                      {site.work.view[lang]} {p.name} ›
                    </Link>
                    {p.liveUrl && <span className="badge-live">{site.work.live[lang]}</span>}
                  </div>
                </div>
                <div className="work-row-visual">
                  <Mockup slug={p.slug} lang={lang} compact />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="proj-foot">
        <Link href={`/${lang}`} style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ {site.work.back[lang]}
        </Link>
        <a href={`/${lang}#contact`} style={{ fontSize: 15, fontWeight: 500 }}>
          {site.contact.title[lang]} ›
        </a>
      </footer>
    </>
  );
}
