import type { Bi } from "@/lib/i18n";

export const blog = {
  title: { en: "Notes.", tr: "Gündem." } as Bi,
  intro: {
    en: "I follow what happens in the industry and write about it.",
    tr: "Sektörde olan biteni takip ediyorum ve üzerine yazıyorum.",
  } as Bi,
  read: { en: "Read the post", tr: "Yazıyı oku" } as Bi,
  readSuffix: { en: "min read", tr: "dk okuma" } as Bi,
  empty: {
    en: "No posts yet — the first one is on its way.",
    tr: "Henüz yazı yok — ilki yolda.",
  } as Bi,
  subscribe: {
    en: "To hear when a new post goes up,",
    tr: "Yeni yazı çıktığında haber almak için",
  } as Bi,
  writeMe: { en: "write to me", tr: "bana yaz" } as Bi,
  backToBlog: { en: "All posts", tr: "Tüm yazılar" } as Bi,
  /** Shown on the English side, because the posts themselves are Turkish. */
  turkishNote: {
    en: "This post is in Turkish.",
    tr: "",
  } as Bi,
};
