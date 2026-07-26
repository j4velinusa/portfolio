import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, metaAlternates, type Lang } from "@/lib/i18n";
import { site } from "@/content/site";
import { blog } from "@/content/blog";
import { getPosts, formatDate } from "@/lib/posts";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const title = `${blog.title[lang]} — ${site.name}`;
  return {
    title,
    description: blog.intro[lang],
    alternates: metaAlternates(lang, "/blog"),
    openGraph: { title, description: blog.intro[lang], images: ["/og/home.jpg"] },
  };
}

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const posts = getPosts();

  return (
    <>
      <RevealProvider />
      <Nav lang={lang} />

      <div className="blog-wrap">
        <header>
          <h1 className="blog-h1">{blog.title[lang]}</h1>
          <p className="blog-intro">{blog.intro[lang]}</p>
        </header>

        <div className="post-list">
          {posts.map((p) => (
            <article key={p.slug} className="post-row reveal">
              <div className="post-meta">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
                <span className="post-cat">{p.category}</span>
                <span>
                  {p.readMinutes} {blog.readSuffix[lang]}
                </span>
              </div>
              <h2 className="post-title">
                <Link href={`/${lang}/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="post-excerpt">{p.excerpt}</p>
              <Link href={`/${lang}/blog/${p.slug}`} className="post-more">
                {blog.read[lang]} ›
              </Link>
            </article>
          ))}

          {posts.length === 0 && <p className="post-excerpt">{blog.empty[lang]}</p>}
        </div>

        <div className="blog-foot">
          <span>
            {blog.subscribe[lang]}{" "}
            <a href={`mailto:${site.links.email}`}>{blog.writeMe[lang]}</a>.
          </span>
        </div>
      </div>

      <footer className="proj-foot">
        <Link href={`/${lang}`} style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ {site.work.back[lang]}
        </Link>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>© 2026 {site.name}</span>
      </footer>
    </>
  );
}
