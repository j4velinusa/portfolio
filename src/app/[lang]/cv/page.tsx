import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { cv } from "@/content/cv";
import { projects } from "@/content/projects";
import { PrintButton } from "@/components/PrintButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const title = lang === "en" ? "CV — Doğan Aykaç" : "CV — Doğan Aykaç";
  return {
    title,
    description: cv.summary[lang],
    alternates: metaAlternates(lang, "/cv"),
    openGraph: { title, description: cv.summary[lang], images: ["/og/cv.jpg"] },
  };
}

export default async function CVPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  return (
    <div className="cv-page">
      <div className="cv-bar">
        <Link href={`/${lang}`} style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ {site.name}
        </Link>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Link href={`/${lang === "en" ? "tr" : "en"}/cv`} hrefLang={lang === "en" ? "tr" : "en"} className="cv-lang">
            {lang === "en" ? "TR" : "EN"}
          </Link>
          <PrintButton label={cv.print[lang]} />
        </div>
      </div>

      <article className="cv-sheet">
        <header className="cv-head">
          <div>
            <h1>{site.name}</h1>
            <p className="cv-role">{cv.role[lang]}</p>
          </div>
          <div className="cv-contact">
            <a href={`mailto:${site.links.email}`}>{site.links.email}</a>
            <a href="https://doganaykac.com">doganaykac.com</a>
            <a href={site.links.github}>github.com/j4velinusa</a>
            <a href={site.links.linkedin}>linkedin.com/in/dogan-aykac</a>
            <span>{cv.location[lang]}</span>
          </div>
        </header>

        <p className="cv-summary">{cv.summary[lang]}</p>

        <section>
          <h2 className="cv-lab">{cv.experienceLabel[lang]}</h2>
          {cv.jobs.map((j) => (
            <div key={j.company} className="cv-job">
              <div className="cv-job-head">
                <span>
                  <strong>{j.company}</strong> <span className="cv-job-role">{j.role[lang]}</span>
                </span>
                <span className="cv-dates">{j.dates}</span>
              </div>
              <p className="cv-note">{j.note[lang]}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="cv-lab">{cv.productsLabel[lang]}</h2>
          {projects.map((p) => (
            <div key={p.slug} className="cv-job">
              <div className="cv-job-head">
                <span>
                  <strong>{p.name}</strong>{" "}
                  <span className="cv-job-role">— {p.category[lang]}</span>
                </span>
                <span className="cv-dates">{cv.productMeta[p.slug]?.[lang]}</span>
              </div>
              <p className="cv-note">{cv.productSummaries[p.slug]?.[lang] ?? p.blurb[lang]}</p>
              <p className="cv-stack">{cv.productStacks[p.slug]}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="cv-lab">{cv.skillsLabel[lang]}</h2>
          <dl className="cv-skills">
            {cv.skills.map((s) => (
              <div key={s.label.en} className="cv-skill-row">
                <dt>{s.label[lang]}</dt>
                <dd>{s.value[lang]}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="cv-foot">
          <span>{cv.footer[lang]}</span>
          <span>
            {cv.caseStudies[lang]} <a href="https://doganaykac.com">doganaykac.com</a>
          </span>
        </footer>
      </article>
    </div>
  );
}
