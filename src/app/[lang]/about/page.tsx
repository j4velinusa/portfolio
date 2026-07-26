import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";
import { Contact } from "@/components/Contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const title = lang === "en" ? "About — Doğan Aykaç" : "Hakkımda — Doğan Aykaç";
  return {
    title,
    description: site.about.intro[lang],
    alternates: metaAlternates(lang, "/about"),
    openGraph: { title, description: site.about.intro[lang] },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const a = site.about;

  return (
    <>
      <RevealProvider />
      <Nav lang={lang} />

      <header className="section" style={{ padding: "96px 24px 0" }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="about-hero">
            <div className="about-photo reveal">
              <Image
                src="/dogan.png"
                alt={site.name}
                width={600}
                height={600}
                priority
                sizes="(max-width: 900px) 100vw, 320px"
              />
            </div>
            <div>
              <h1 className="about-h1 reveal">{a.heading[lang]}</h1>
              <p className="about-p reveal">{a.intro[lang]}</p>
              <p className="about-p dim reveal">{a.intro2[lang]}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="section" style={{ padding: "72px 24px 0" }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="lab section-lab">{a.howLabel[lang]}</div>
          <div className="feat-grid feat-3">
            {a.how.map((h, i) => (
              <div key={h.title.en} className="feat reveal" data-d={i * 70}>
                <div className="t" style={{ fontSize: 18 }}>
                  {h.title[lang]}
                </div>
                <div className="b">{h.body[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: "72px 24px 0" }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="lab section-lab">{a.timelineLabel[lang]}</div>
          <div className="tl reveal">
            {a.timeline.map((row) => (
              <div key={row.y + row.title.en} className="tl-row">
                <span className="tl-y">{row.y}</span>
                <span className="tl-t">{row.title[lang]}</span>
                <span className="tl-n">{row.note[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: "72px 24px 20px" }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="about-cols">
            <div className="feat reveal">
              <div className="lab" style={{ marginBottom: 12 }}>
                {a.lookingLabel[lang]}
              </div>
              <p className="b" style={{ fontSize: 15 }}>
                {a.looking[lang]}
              </p>
            </div>
            <div className="feat reveal" data-d="80">
              <div className="lab" style={{ marginBottom: 12 }}>
                {a.detailsLabel[lang]}
              </div>
              <dl className="details">
                {a.details.map((d) => (
                  <div key={d.k.en} className="d-row">
                    <dt>{d.k[lang]}</dt>
                    <dd style={"highlight" in d && d.highlight ? { color: "var(--green)" } : undefined}>
                      {d.v[lang]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <Contact lang={lang} />
    </>
  );
}
