import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";
import { Contact } from "@/components/Contact";
import { PersonJsonLd } from "@/components/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { alternates: metaAlternates(lang) };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const featured = projects.find((p) => p.slug === "xaron")!;
  const dravion = projects.find((p) => p.slug === "dravion")!;

  return (
    <>
      <PersonJsonLd lang={lang} />
      <RevealProvider />
      <Nav lang={lang} />

      <header className="hero" id="top">
        <span className="pill">
          <span className="dot" />
          {site.hero.available[lang]}
        </span>
        <h1 className="grad-text">{site.hero.title}</h1>
        <p className="sub">{site.hero.subtitle[lang]}</p>
      </header>

      <section className="section">
        <div className="bento">
          <div className="tile photo reveal">
            <Image
              src="/dogan.png"
              alt={site.name}
              width={600}
              height={600}
              priority
              sizes="(max-width: 560px) 100vw, 260px"
            />
          </div>

          <div className="tile wide reveal" data-d="60">
            <div className="big">{site.bento.years[lang]}</div>
            <div className="small">{site.bento.yearsSub[lang]}</div>
          </div>

          <Link
            href={`/${lang}/work/${dravion.slug}`}
            className="tile reveal"
            data-d="120"
            style={{ background: "linear-gradient(135deg,#e08b6a,#c2542c)", color: "#fff" }}
          >
            <div style={{ fontSize: 21, fontWeight: 700 }}>{dravion.name}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{dravion.category[lang]} ›</div>
          </Link>

          <div className="tile tags reveal" data-d="90">
            {site.bento.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>

          <Link href={`/${lang}/work/${featured.slug}`} className="tile wide reveal" data-d="150">
            <div
              className="glow"
              style={{
                background: "radial-gradient(ellipse at 100% 100%,oklch(0.68 0.16 274 / .32),transparent 60%)",
              }}
            />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: featured.accent, letterSpacing: ".06em" }}>
                {lang === "en" ? "FEATURED" : "ÖNE ÇIKAN"} · {featured.name}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 5 }}>{featured.tagline[lang]} ›</div>
              <div className="small">{featured.bullets[lang][0]}</div>
            </div>
          </Link>

          <a href="#contact" className="tile wide light reveal" data-d="180">
            <div style={{ fontSize: 18, fontWeight: 700 }}>{site.bento.talk[lang]}</div>
            <div className="small">{site.links.email}</div>
          </a>

          <a href={site.links.github} target="_blank" rel="noreferrer" className="tile reveal" data-d="210">
            <div style={{ fontSize: 16, fontWeight: 700 }}>GitHub ›</div>
            <div className="small">@j4velinusa</div>
          </a>

          <div className="tile reveal" data-d="240">
            <div style={{ fontSize: 16, fontWeight: 700 }}>{site.bento.location[lang]}</div>
            <div className="small">{site.bento.locationSub[lang]}</div>
          </div>
        </div>
      </section>

      {/* work */}
      <section id="work" className="band" style={{ marginTop: 90 }}>
        <div className="container">
          <h2 className="h2 reveal">{site.work.title[lang]}</h2>
          <p className="h2sub reveal">
            {site.work.sub[lang]}{" "}
            <Link href={`/${lang}/work`} style={{ color: "var(--text)", fontWeight: 500 }}>
              {site.work.seeAll[lang]} ›
            </Link>
          </p>
          <div className="work-list">
            {projects.map((p, i) => (
              <Link key={p.slug} href={`/${lang}/work/${p.slug}`} className="work-card reveal">
                <div
                  className="glow"
                  style={{
                    background: `radial-gradient(ellipse at ${i % 2 ? "15%" : "85%"} ${i < 2 ? "10%" : "90%"}, color-mix(in oklab, ${p.accent} 18%, transparent), transparent 55%)`,
                  }}
                />
                <div className="work-eyebrow" style={{ color: p.accent }}>
                  {p.name} · {p.category[lang].toUpperCase()}
                </div>
                <div className="work-title">{p.tagline[lang]}</div>
                <p className="work-blurb">{p.blurb[lang]}</p>
                <div className="work-meta">
                  {p.tech.slice(0, 3).map((t, k) => (
                    <span key={t}>
                      {k > 0 && <span style={{ marginRight: 10, color: "var(--faint)" }}>·</span>}
                      {t}
                    </span>
                  ))}
                  {p.liveUrl && <span className="badge-live">{site.work.live[lang]}</span>}
                  <span className="go" style={{ color: p.accent }}>
                    {site.work.learn[lang]} ›
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* stack */}
      <section id="stack" className="pad">
        <div className="container">
          <h2 className="h2 reveal">{site.stack.title[lang]}</h2>
          <p className="h2sub reveal">
            {site.stack.sub[lang]}{" "}
            <Link href={`/${lang}/stack`} style={{ color: "var(--text)", fontWeight: 500 }}>
              {site.work.seeAll[lang]} ›
            </Link>
          </p>
        </div>
        <div className="section">
          <div className="stack-grid">
            {site.stack.groups.map((g, i) => (
              <div key={g.label.en} className="stack-col reveal" data-d={i * 60}>
                <div className="lab">{g.label[lang]}</div>
                {g.items.map((it) => (
                  <div key={it} className="it">
                    {it}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* about */}
      <section id="about" className="band">
        <div className="container">
          <div className="about">
            <h2 className="h2 reveal">{site.about.title[lang]}</h2>
            <p className="reveal">{site.about.intro[lang]}</p>
            <p className="reveal" style={{ marginTop: 22 }}>
              <Link href={`/${lang}/about`} style={{ color: "var(--blue)", fontSize: 16 }}>
                {lang === "en" ? "More about me" : "Hakkımda daha fazlası"} ›
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Contact lang={lang} />
    </>
  );
}
