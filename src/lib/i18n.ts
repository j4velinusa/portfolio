export const LANGS = ["en", "tr"] as const;

export type Lang = (typeof LANGS)[number];

/** A value that exists in both languages. */
export type Bi<T = string> = { en: T; tr: T };

export const DEFAULT_LANG: Lang = "en";

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

export const otherLang = (l: Lang): Lang => (l === "en" ? "tr" : "en");

export const SITE_URL = "https://doganaykac.com";

/** Absolute URL for a locale + path, e.g. hrefFor("tr", "/work") -> ".../tr/work" */
export const hrefFor = (lang: Lang, path = "") => `/${lang}${path}`;

/**
 * hreflang map for the Metadata API. Every locale points at its own URL and each
 * references the others — Google requires the annotations to be reciprocal.
 */
export function alternatesFor(path = "") {
  return {
    canonical: `${SITE_URL}/${DEFAULT_LANG}${path}`,
    languages: {
      en: `${SITE_URL}/en${path}`,
      tr: `${SITE_URL}/tr${path}`,
      "x-default": `${SITE_URL}/en${path}`,
    },
  };
}

/** Same as alternatesFor, but canonical points at the locale actually being rendered. */
export function metaAlternates(lang: Lang, path = "") {
  return { ...alternatesFor(path), canonical: `${SITE_URL}/${lang}${path}` };
}
