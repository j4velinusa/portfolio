import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { SITE_URL, type Lang } from "@/lib/i18n";

/**
 * JSON.stringify escapes quotes but not `<`, so a value containing
 * `</script>` would close the tag and everything after it becomes markup.
 * Only the site owner can write these fields, but escaping costs nothing.
 */
export const jsonLdSafe = (data: unknown) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

/**
 * Person + ProfilePage. Both are types Google actually understands for an
 * individual; neither is a "rich result" you can screenshot, but they are the
 * documented way to state entity facts (name, job title, sameAs links).
 * Everything marked up here is also visible on the page — required by policy.
 */
export function PersonJsonLd({ lang }: { lang: Lang }) {
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: site.name,
    jobTitle: site.role[lang],
    description: site.hero.subtitle[lang],
    url: `${SITE_URL}/${lang}`,
    image: `${SITE_URL}/dogan.png`,
    email: `mailto:${site.links.email}`,
    address: { "@type": "PostalAddress", addressLocality: "İstanbul", addressCountry: "TR" },
    knowsLanguage: ["tr", "en"],
    sameAs: [site.links.github, site.links.linkedin],
    knowsAbout: site.stack.groups.flatMap((g) => g.items),
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/${lang}#profilepage`,
        url: `${SITE_URL}/${lang}`,
        name: `${site.name} — ${site.role[lang]}`,
        inLanguage: lang,
        mainEntity: { "@id": `${SITE_URL}/#person` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      person,
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: site.name,
        inLanguage: lang,
        publisher: { "@id": `${SITE_URL}/#person` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdSafe(graph) }}
    />
  );
}

/**
 * Course. Deliberately narrower than what Google will accept: a CourseInstance
 * needs a real schedule or workload to be eligible for the rich result, and we
 * do not have honest values for either — "new lessons every month" is not a
 * schedule. Claiming one to win a rich result would be structured-data spam,
 * so the instance is omitted and the plain Course is emitted instead.
 *
 * `price` is the numeric monthly figure, kept separate from the display string
 * in content/course.json ("₺1.000 / ay"): schema.org wants a number, and
 * parsing a localised, owner-editable string to get one would break the first
 * time someone typed a thousands separator differently.
 */
export function CourseJsonLd({
  lang,
  name,
  description,
  price,
  modules,
}: {
  lang: Lang;
  name: string;
  description: string;
  price: number | null;
  modules: { name: string; description: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    inLanguage: lang,
    url: `${SITE_URL}/${lang}/courses`,
    provider: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: site.name },
    ...(modules.length
      ? {
          syllabusSections: modules.map((m) => ({
            "@type": "Syllabus",
            name: m.name,
            description: m.description,
          })),
        }
      : {}),
    ...(price !== null
      ? {
          offers: {
            "@type": "Offer",
            category: "Subscription",
            price,
            priceCurrency: "TRY",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/${lang}/courses`,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdSafe(data) }}
    />
  );
}

export function ProjectJsonLd({ slug, lang }: { slug: string; lang: Lang }) {
  const p = projects.find((x) => x.slug === slug);
  if (!p) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.name,
    headline: p.tagline[lang],
    description: p.blurb[lang],
    inLanguage: lang,
    url: `${SITE_URL}/${lang}/work/${p.slug}`,
    ...(p.liveUrl ? { sameAs: p.liveUrl } : {}),
    creator: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: site.name },
    keywords: p.tech.join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdSafe(data) }}
    />
  );
}
