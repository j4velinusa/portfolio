"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";

export default function Home() {
  const { lang } = useLang();
  const featured = projects.find((p) => p.slug === "xaron")!;
  const dravion = projects.find((p) => p.slug === "dravion")!;

  return (
    <>
      <RevealProvider />
      <Nav />

      <header className="hero" id="top">
        <span className="pill">
          <span className="dot" />
          {site.hero.available[lang]}
        </span>
        <h1 className="grad-text">{site.hero.title}</h1>
        <p className="sub">{site.hero.subtitle[lang]}</p>
      </header>

      {/* bento */}
      <section className="section">
        <div className="bento">
          <div className="tile photo reveal">
            <Image src="/dogan.png" alt={site.name} width={520} height={700} priority />
          </div>

          <div className="tile wide reveal" data-d="60">
            <div className="big">{site.bento.years[lang]}</div>
            <div className="small">{site.bento.yearsSub[lang]}</div>
          </div>

          <Link
            href={`/work/${dravion.slug}`}
            className="tile reveal"
            data-d="120"
            style={{ background: "linear-gradient(135deg,#ffb340,#ff6b00)", color: "#fff" }}
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

          <Link href={`/work/${featured.slug}`} className="tile wide reveal" data-d="150">
            <div
              className="glow"
              style={{ background: "radial-gradient(ellipse at 100% 100%,rgba(169,114,255,.3),transparent 60%)" }}
            />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: featured.accent, letterSpacing: ".06em" }}>
                {lang === "en" ? "FEATURED" : "ÖNE ÇIKAN"} · {featured.name}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 5 }}>{featured.tagline[lang]} ›</div>
              <div className="small">
                {lang === "en"
                  ? "E2E encrypted. No ads. 1% flat commission."
                  : "Uçtan uca şifreli. Reklam yok. %1 sabit komisyon."}
              </div>
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
          <p className="h2sub reveal">{site.work.sub[lang]}</p>
          <div className="work-list">
            {projects.map((p, i) => (
              <Link key={p.slug} href={`/work/${p.slug}`} className="work-card reveal">
                <div
                  className="glow"
                  style={{
                    background: `radial-gradient(ellipse at ${i % 2 ? "15%" : "85%"} ${i < 2 ? "10%" : "90%"}, ${p.accent}26, transparent 55%)`,
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
          <p className="h2sub reveal">{site.stack.sub[lang]}</p>
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
            <p className="reveal">{site.about.body[lang]}</p>
            <div className="timeline reveal">
              {site.about.timeline.map((t) => (
                <div key={t.y} className="col">
                  <div className="y">{t.y}</div>
                  <div className="d">{t.label[lang]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* contact */}
      <footer id="contact" className="contact">
        <h2 className="grad-text reveal">{site.contact.title[lang]}</h2>
        <p className="sub reveal">{site.contact.sub[lang]}</p>
        <div className="cbtns reveal">
          <a className="btn solid" href={`mailto:${site.links.email}`}>
            {site.links.email}
          </a>
          <a className="btn ghost" href={site.links.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="btn ghost" href={site.links.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
        <div className="copyright">© 2026 {site.name}</div>
      </footer>
    </>
  );
}
