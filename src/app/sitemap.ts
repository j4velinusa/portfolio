import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/i18n";
import { projects } from "@/content/projects";
import { getPosts } from "@/lib/posts";

const PAGES = ["", "/work", "/stack", "/about", "/cv", "/blog", "/courses"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...PAGES,
    ...projects.map((p) => `/work/${p.slug}`),
    ...getPosts().map((p) => `/blog/${p.slug}`),
  ];

  // One entry per locale, each declaring the full alternates set. Google reads
  // hreflang from the sitemap as well as from <link> tags.
  return paths.flatMap((path) =>
    (["en", "tr"] as const).map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      lastModified: new Date("2026-07-26"),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
      alternates: {
        languages: {
          en: `${SITE_URL}/en${path}`,
          tr: `${SITE_URL}/tr${path}`,
        },
      },
    })),
  );
}
