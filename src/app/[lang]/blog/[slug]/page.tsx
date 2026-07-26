import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, SITE_URL, LANGS, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { blog } from "@/content/blog";
import { getPost, getPosts, formatDate, renderMarkdown } from "@/lib/posts";
import { Nav } from "@/components/Nav";
import { jsonLdSafe } from "@/components/JsonLd";
import { RevealProvider } from "@/components/Reveal";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => getPosts().map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = getPost(slug);
  if (!p || !isLang(lang)) return {};

  return {
    title: `${p.title} — ${site.name}`,
    description: p.excerpt,
    alternates: metaAlternates(lang, `/blog/${slug}`),
    openGraph: {
      title: p.title,
      description: p.excerpt,
      type: "article",
      publishedTime: p.date,
      authors: [site.name],
      images: ["/og/home.jpg"],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: rawLang, slug } = await params;
  if (!isLang(rawLang)) notFound();
  const lang: Lang = rawLang;

  const p = getPost(slug);
  if (!p) notFound();

  const html = renderMarkdown(p.body);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt,
    datePublished: p.date,
    dateModified: p.date,
    inLanguage: "tr",
    articleSection: p.category,
    url: `${SITE_URL}/${lang}/blog/${p.slug}`,
    author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: site.name },
    mainEntityOfPage: `${SITE_URL}/${lang}/blog/${p.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(jsonLd) }} />
      <RevealProvider />
      <Nav lang={lang} variant="project" />

      <article className="blog-wrap post">
        <header>
          <div className="post-meta">
            <time dateTime={p.date}>{formatDate(p.date)}</time>
            <span className="post-cat">{p.category}</span>
            <span>
              {p.readMinutes} {blog.readSuffix[lang]}
            </span>
          </div>
          <h1 className="post-h1">{p.title}</h1>
          <p className="post-lead">{p.excerpt}</p>
          {lang === "en" && <p className="post-langnote">{blog.turkishNote.en}</p>}
        </header>

        {/* Body is markdown rendered by our own escape-then-transform pass, so it
            cannot contain raw HTML. */}
        <div className="prose" lang="tr" dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      <footer className="proj-foot">
        <Link href={`/${lang}/blog`} style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ {blog.backToBlog[lang]}
        </Link>
        <a href={`mailto:${site.links.email}`} style={{ fontSize: 15, fontWeight: 500 }}>
          {site.contact.title[lang]} ›
        </a>
      </footer>
    </>
  );
}
