import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const title = lang === "en" ? "Stack — Doğan Aykaç" : "Teknoloji — Doğan Aykaç";
  const description =
    lang === "en"
      ? "The tools I build with every day, the full arsenal, and what each product actually runs on."
      : "Her gün kullandığım araçlar, tüm cephanelik ve her ürünün gerçekte neyle çalıştığı.";
  return {
    title,
    description,
    alternates: metaAlternates(lang, "/stack"),
    openGraph: { title, description, images: ["/og/stack.jpg"] },
  };
}

export default async function StackPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = site.stack;

  return (
    <>
      <RevealProvider />
      <Nav lang={lang} />

      <header className="pad" style={{ paddingBottom: 20, textAlign: "center" }}>
        <div className="container">
          <h1 className="h2">{t.title[lang]}</h1>
          <p className="h2sub">{t.sub[lang]}</p>
        </div>
      </header>

      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="lab section-lab">{t.dailyLabel[lang]}</div>
          <div className="daily-grid">
            {t.daily.map((d, i) => (
              <div key={d.name} className="daily reveal" data-d={i * 50}>
                <div className="n">{d.name}</div>
                <div className="note">{d.note[lang]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="lab section-lab">{t.arsenalLabel[lang]}</div>
          <div className="stack-grid">
            {t.groups.map((g, i) => (
              <div key={g.label.en} className="stack-col reveal" data-d={i * 50}>
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

      <section className="section" style={{ paddingBottom: 90 }}>
        <div className="container" style={{ padding: 0 }}>
          <div className="lab section-lab">{t.wildLabel[lang]}</div>
          <div className="wild reveal">
            {t.wild.map((w) => {
              const p = projects.find((x) => x.slug === w.slug)!;
              return (
                <Link key={w.slug} href={`/${lang}/work/${w.slug}`} className="wild-row">
                  <span className="wild-name">
                    <span className="dot-sm" style={{ background: p.accent }} />
                    {p.name}
                  </span>
                  <span className="wild-tech">{w.tech}</span>
                  <span className="wild-go" style={{ color: p.accent }}>
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="proj-foot">
        <Link href={`/${lang}`} style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ {site.work.back[lang]}
        </Link>
        <Link href={`/${lang}/work`} style={{ fontSize: 15, fontWeight: 500 }}>
          {site.work.seeWork[lang]} ›
        </Link>
      </footer>
    </>
  );
}
