import type { Bi } from "@/lib/i18n";

export const site = {
  name: "Doğan Aykaç",
  nav: {
    work: { en: "Work", tr: "İşler" } as Bi,
    stack: { en: "Stack", tr: "Teknoloji" } as Bi,
    about: { en: "About", tr: "Hakkımda" } as Bi,
    contact: { en: "Contact", tr: "İletişim" } as Bi,
  },
  hero: {
    available: { en: "Available for work", tr: "İşe açığım" } as Bi,
    title: "Code. Ship. Repeat.",
    subtitle: {
      en: "Doğan Aykaç — full-stack developer. Twelve years of building: agent platforms, encrypted communities, safe marketplaces, retail automation.",
      tr: "Doğan Aykaç — full-stack geliştirici. On iki yıldır inşa ediyorum: ajan platformları, şifreli topluluklar, güvenli pazar yerleri, perakende otomasyonu.",
    } as Bi,
  },
  bento: {
    years: { en: "12 years", tr: "12 yıl" } as Bi,
    yearsSub: {
      en: "of building software — since I was 11",
      tr: "yazılım geliştiriyorum — 11 yaşımdan beri",
    } as Bi,
    talk: { en: "Let's talk.", tr: "Konuşalım." } as Bi,
    location: { en: "İstanbul, TR", tr: "İstanbul, TR" } as Bi,
    locationSub: { en: "UTC+3 · remote-ready", tr: "UTC+3 · remote'a hazır" } as Bi,
    tags: ["TypeScript", "React Native", "Next.js", "Node.js", "Docker", "PostgreSQL"],
  },
  work: {
    title: { en: "The work.", tr: "İşler." } as Bi,
    sub: {
      en: "Every project is a product. Each one gets its own page.",
      tr: "Her proje bir ürün. Her birinin kendi sayfası var.",
    } as Bi,
    learn: { en: "Learn more", tr: "İncele" } as Bi,
    live: { en: "Live", tr: "Canlı" } as Bi,
    visit: { en: "Visit site", tr: "Siteye git" } as Bi,
    back: { en: "Back home", tr: "Ana sayfa" } as Bi,
    next: { en: "Next project", tr: "Sonraki proje" } as Bi,
  },
  stack: {
    title: { en: "The stack.", tr: "Teknoloji." } as Bi,
    sub: {
      en: "The tools I reach for — production-grade, every one.",
      tr: "Kullandığım araçlar — hepsi production seviyesi.",
    } as Bi,
    groups: [
      { label: { en: "LANGUAGES", tr: "DİLLER" } as Bi, items: ["TypeScript", "JavaScript", "SQL"] },
      { label: { en: "FRONTEND", tr: "FRONTEND" } as Bi, items: ["React", "Next.js", "React Native", "Expo"] },
      { label: { en: "BACKEND", tr: "BACKEND" } as Bi, items: ["Node.js", "Express.js", "REST API", "Docker"] },
      { label: { en: "DATA", tr: "VERİ" } as Bi, items: ["PostgreSQL", "Supabase", "Firebase", "Oracle DB"] },
      { label: { en: "CLOUD & TOOLS", tr: "BULUT & ARAÇLAR" } as Bi, items: ["AWS", "Google Cloud", "Git", "GitHub"] },
    ],
  },
  about: {
    title: { en: "About.", tr: "Hakkımda." } as Bi,
    body: {
      en: "I'm 23, from Türkiye. I started at 11, teaching myself on webmaster forums, and never stopped. Twelve years later I build hard things — autonomous agent systems, end-to-end encryption, payment-safe marketplaces — and I ship them.",
      tr: "23 yaşındayım, Türkiye'denim. 11 yaşımda webmaster forumlarında kendi kendime öğrenerek başladım ve hiç durmadım. On iki yıl sonra zor şeyler inşa ediyorum — otonom ajan sistemleri, uçtan uca şifreleme, ödeme-güvenli pazar yerleri — ve hepsini yayına alıyorum.",
    } as Bi,
    timeline: [
      { y: "2014", label: { en: "Started at 11 — webmaster forums", tr: "11 yaşında başladım — webmaster forumları" } as Bi },
      { y: "2020", label: { en: "First freelance project", tr: "İlk freelance proje" } as Bi },
      { y: "2023", label: { en: "Went professional", tr: "Profesyonelleştim" } as Bi },
      { y: "2026", label: { en: "Open to full-time roles", tr: "Full-time rollere açık" } as Bi },
    ],
  },
  contact: {
    title: { en: "Let's talk.", tr: "Konuşalım." } as Bi,
    sub: {
      en: "Looking for someone who ships? Say hi.",
      tr: "Yayına alan birini mi arıyorsun? Merhaba de.",
    } as Bi,
  },
  links: {
    email: "merhaba@doganaykac.com",
    github: "https://github.com/j4velinusa",
    linkedin: "https://www.linkedin.com/in/dogan-aykac-8a418937a/",
  },
};
