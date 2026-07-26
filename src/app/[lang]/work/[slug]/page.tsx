import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, LANGS, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { projects, getProject } from "@/content/projects";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";
import { Mockup } from "@/components/mockups";
import { ProjectJsonLd } from "@/components/JsonLd";
import { projectMeta, deepDive } from "@/content/deepdive";

// Loaded only by this route, so the dark chrome pages never fetch it.
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export function generateStaticParams() {
  return LANGS.flatMap((lang) => projects.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = getProject(slug);
  if (!p || !isLang(lang)) return {};

  const title = `${p.name} — ${p.tagline[lang]} · ${site.name}`;
  return {
    title,
    description: p.blurb[lang],
    alternates: metaAlternates(lang, `/work/${slug}`),
    openGraph: { title, description: p.blurb[lang], type: "article", images: [`/og/${slug}.jpg`] },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  if (!isLang(rawLang)) notFound();
  const lang: Lang = rawLang;

  const p = getProject(slug);
  if (!p) notFound();

  const idx = projects.findIndex((x) => x.slug === slug);
  const next = projects[(idx + 1) % projects.length];
  const th = p.theme;

  // Each product brings its own palette; the tokens are swapped on this wrapper
  // so every descendant picks the project's brand up automatically.
  const themeVars = {
    "--bg": th.bg,
    "--bg2": th.surface,
    "--surface": th.surface,
    "--surface2": th.card,
    "--text": th.text,
    "--muted": th.muted,
    "--dim": th.muted,
    "--faint": th.muted,
    "--line": th.line,
    "--line2": th.line,
  } as React.CSSProperties;

  return (
    <div
      className={`proj-theme ${fraunces.variable}${th.serif ? " serif" : ""}`}
      style={themeVars}
      data-project={p.slug}
    >
      <ProjectJsonLd slug={p.slug} lang={lang} />
      <RevealProvider />
      <Nav lang={lang} variant="project" />

      <header className="proj-hero">
        <div className="proj-eyebrow" style={{ color: th.accent }}>
          {p.name} · {p.category[lang].toUpperCase()}
        </div>
        <h1 className="proj-h1">
          {p.tagline[lang]}
        </h1>
        <p className="lead">{p.blurb[lang]}</p>
        {p.liveUrl && (
          <div className="proj-actions">
            <a
              className="btn"
              href={p.liveUrl}
              target="_blank"
              rel="noreferrer"
              style={{ background: th.accent, color: "#fff", fontWeight: 600 }}
            >
              {site.work.visit[lang]} ›
            </a>
            <span className="badge-live" style={{ alignSelf: "center" }}>
              {site.work.live[lang]} · {p.liveUrl.replace("https://", "")}
            </span>
          </div>
        )}
      </header>

      {projectMeta[p.slug] && (
        <section className="section" style={{ paddingBottom: 8 }}>
          <dl className="proj-meta">
            {projectMeta[p.slug].map((row) => (
              <div key={row.k.en}>
                <dt>{row.k[lang]}</dt>
                <dd>{row.v[lang]}</dd>
              </div>
            ))}
            {p.liveUrl && (
              <div>
                <dt>{lang === "en" ? "Live" : "Canlı"}</dt>
                <dd>
                  <a href={p.liveUrl} target="_blank" rel="noreferrer" style={{ color: th.accent }}>
                    {p.liveUrl.replace("https://", "")} ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="section" style={{ paddingBottom: 32 }}>
        <Mockup slug={p.slug} lang={lang} />
      </section>

      {p.gallery.length > 0 && (
        <section className="section" style={{ padding: "32px 24px 16px" }}>
          <div className="gallery">
            {p.gallery.map((s, i) => (
              <figure
                key={s.src}
                className="shot reveal"
                data-d={i * 50}
                // Never display a screenshot wider than the file actually is:
                // upscaling a UI capture is what makes it look mushy.
                style={{ maxWidth: `min(100%, ${s.w}px)` }}
              >
                <Image
                  src={s.src}
                  alt={s.caption[lang]}
                  width={s.w}
                  height={s.h}
                  sizes={`(max-width: 1140px) 100vw, ${Math.min(s.w, 1080)}px`}
                  quality={90}
                  style={{ width: "100%", height: "auto" }}
                  loading={i === 0 ? "eager" : "lazy"}
                  priority={i === 0}
                />
                <figcaption className="cap">{s.caption[lang]}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="section" style={{ padding: "56px 24px 88px" }}>
        <div className={`feat-grid ${p.features.length > 4 ? "feat-3" : p.features.length === 4 ? "feat-2" : "feat-3"}`}>
          {p.features.map((f, i) => (
            <div key={f.title.en} className="feat reveal" data-d={i * 60}>
              <div className="t">{f.title[lang]}</div>
              <div className="b">{f.body[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      {(deepDive[p.slug] ?? []).map((sec) => (
        <section key={sec.label.en} className="section deep" style={{ paddingBottom: 72 }}>
          <div className="container" style={{ padding: 0 }}>
            <div className="section-lab">{sec.label[lang]}</div>
            {sec.quote && (
              <p className="deep-quote reveal" style={{ borderColor: th.accent }}>
                {sec.quote[lang]}
              </p>
            )}
            {sec.columns && (
              <div className="deep-cols">
                {sec.columns.map((c) => (
                  <div key={c.title.en} className="feat reveal">
                    <div className="t" style={{ fontSize: 18 }}>
                      {c.title[lang]}
                    </div>
                    <ul className="bullets" style={{ marginTop: 14 }}>
                      {c.points[lang].map((pt) => (
                        <li key={pt}>
                          <span style={{ color: th.accent }}>—</span> {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {sec.items.length > 0 && (
              <div className={`feat-grid ${sec.items.length === 2 ? "feat-2" : "feat-3"}`}>
                {sec.items.map((it, i) => (
                  <div key={it.title.en} className="feat reveal" data-d={i * 60}>
                    <div className="t" style={{ fontSize: 18 }}>
                      {it.title[lang]}
                    </div>
                    <div className="b">{it.body[lang]}</div>
                    {it.tags && (
                      <div className="deep-tags">
                        {it.tags.map((t) => (
                          <code key={t}>{t}</code>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {sec.chips && (
              <div className="tech-row reveal" style={{ marginTop: 26 }}>
                {sec.chips.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      <section className="section" style={{ paddingBottom: 88 }}>
        <div className="tech-row reveal">
          {p.tech.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      </section>

      <footer className="proj-foot">
        <Link href={`/${lang}/work`} style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ {site.nav.work[lang]}
        </Link>
        <Link
          href={`/${lang}/work/${next.slug}`}
          style={{ fontSize: 15, fontWeight: 500, color: th.accent }}
        >
          {site.work.next[lang]}: {next.name} ›
        </Link>
      </footer>
    </div>
  );
}
