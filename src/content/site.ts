import type { Bi } from "@/lib/i18n";

export const site = {
  name: "Doğan Aykaç",
  role: { en: "Full-Stack Developer", tr: "Full-Stack Geliştirici" } as Bi,

  nav: {
    work: { en: "Work", tr: "İşler" } as Bi,
    stack: { en: "Stack", tr: "Teknoloji" } as Bi,
    about: { en: "About", tr: "Hakkımda" } as Bi,
    contact: { en: "Contact", tr: "İletişim" } as Bi,
    cv: { en: "CV", tr: "CV" } as Bi,
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
    tags: ["Rust", "TypeScript", "Next.js", "React Native", "Docker", "PostgreSQL"],
  },

  work: {
    title: { en: "The work.", tr: "İşler." } as Bi,
    sub: {
      en: "Every project is a product. Each one gets its own page.",
      tr: "Her proje bir ürün. Her birinin kendi sayfası var.",
    } as Bi,
    pageSub: {
      en: "Four products, built end-to-end — designed, coded, shipped.",
      tr: "Dört ürün, uçtan uca — tasarlandı, kodlandı, yayına alındı.",
    } as Bi,
    seeAll: { en: "See all", tr: "Tümünü gör" } as Bi,
    learn: { en: "Learn more", tr: "İncele" } as Bi,
    view: { en: "View", tr: "Görüntüle" } as Bi,
    live: { en: "Live", tr: "Canlı" } as Bi,
    visit: { en: "Visit site", tr: "Siteye git" } as Bi,
    back: { en: "Back home", tr: "Ana sayfa" } as Bi,
    next: { en: "Next project", tr: "Sonraki proje" } as Bi,
    seeWork: { en: "See the work", tr: "İşlere bak" } as Bi,
  },

  stack: {
    title: { en: "The stack.", tr: "Teknoloji." } as Bi,
    sub: {
      en: "One standard: production-grade.",
      tr: "Tek standart: production seviyesi.",
    } as Bi,
    dailyLabel: { en: "DAILY DRIVERS", tr: "HER GÜN KULLANDIKLARIM" } as Bi,
    arsenalLabel: { en: "FULL ARSENAL", tr: "TÜM ARAÇLAR" } as Bi,
    wildLabel: { en: "IN THE WILD", tr: "SAHADA" } as Bi,

    daily: [
      {
        name: "Rust",
        note: {
          en: "Systems-level performance where it counts — Xaron is fifteen crates of it.",
          tr: "Gerektiği yerde sistem seviyesi performans — Xaron'un tamamı, on beş crate.",
        } as Bi,
      },
      {
        name: "TypeScript",
        note: { en: "The default for everything else.", tr: "Geri kalan her şeyin varsayılanı." } as Bi,
      },
      {
        name: "Next.js",
        note: { en: "Production web apps, front to back.", tr: "Uçtan uca production web uygulamaları." } as Bi,
      },
      {
        name: "React Native",
        note: { en: "Mobile that ships to both stores — with Expo.", tr: "İki mağazaya da çıkan mobil — Expo ile." } as Bi,
      },
      {
        name: "Node.js",
        note: { en: "APIs, services, realtime backends.", tr: "API'ler, servisler, realtime backend'ler." } as Bi,
      },
      {
        name: "PostgreSQL",
        note: { en: "The source of truth.", tr: "Tek doğruluk kaynağı." } as Bi,
      },
      {
        name: "Docker",
        note: { en: "Isolated sandboxes and reproducible builds.", tr: "İzole sandbox'lar ve tekrarlanabilir build'ler." } as Bi,
      },
    ],

    groups: [
      { label: { en: "LANGUAGES", tr: "DİLLER" } as Bi, items: ["Rust", "TypeScript", "JavaScript", "SQL"] },
      { label: { en: "FRONTEND", tr: "FRONTEND" } as Bi, items: ["React", "Next.js 15", "React Native", "Expo", "Leptos (WASM)"] },
      { label: { en: "BACKEND & INFRA", tr: "BACKEND & ALTYAPI" } as Bi, items: ["Node.js", "Axum", "BullMQ", "WebTransport/QUIC", "Docker"] },
      { label: { en: "DATA", tr: "VERİ" } as Bi, items: ["PostgreSQL (RLS, pgvector)", "Supabase", "ScyllaDB", "Drizzle", "sqlx"] },
      { label: { en: "PAYMENTS & SECURITY", tr: "ÖDEME & GÜVENLİK" } as Bi, items: ["Stripe Connect", "OpenMLS (RFC 9420)", "KYC", "GDPR / KVKK"] },
    ],

    wild: [
      { slug: "dravion", tech: "Next.js 15 · PostgreSQL + pgvector · BullMQ + Redis · Docker · OpenTelemetry" },
      { slug: "xaron", tech: "Rust · Axum · Leptos/WASM · OpenMLS · WebTransport · ScyllaDB" },
      { slug: "sperare", tech: "React Native · Expo SDK 56 · Supabase (RLS) · Stripe Connect" },
      { slug: "teck", tech: "React Native · Expo · Node.js · PostgreSQL" },
    ],
  },

  about: {
    title: { en: "About.", tr: "Hakkımda." } as Bi,
    heading: {
      en: "I build hard things, and I ship them.",
      tr: "Zor şeyler inşa ediyorum ve yayına alıyorum.",
    } as Bi,
    intro: {
      en: "I'm Doğan Aykaç — 23, from Türkiye. I started at 11, teaching myself on webmaster forums, and never stopped. Twelve years in, my work has moved from client sites to systems that are genuinely difficult: autonomous agent fleets, end-to-end encryption, escrow payments, retail automation.",
      tr: "Ben Doğan Aykaç — 23 yaşında, Türkiye'den. 11 yaşımda webmaster forumlarında kendi kendime öğrenerek başladım ve hiç durmadım. On iki yıl içinde işim müşteri sitelerinden gerçekten zor sistemlere taşındı: otonom ajan filoları, uçtan uca şifreleme, escrow ödemeler, perakende otomasyonu.",
    } as Bi,
    intro2: {
      en: "I design and build both sides. Every product on this site — the interface, the design system, the backend, the database — came from one person. That's not a boast; it's why I care about systems that hold up without a team to babysit them.",
      tr: "İki tarafı da tasarlayıp geliştiriyorum. Bu sitedeki her ürün — arayüz, design system, backend, veritabanı — tek kişiden çıktı. Bu bir övünme değil; başında bir ekip beklemeden ayakta kalan sistemleri bu yüzden önemsiyorum.",
    } as Bi,

    howLabel: { en: "HOW I WORK", tr: "NASIL ÇALIŞIYORUM" } as Bi,
    how: [
      {
        title: { en: "Design first, always.", tr: "Önce tasarım, her zaman." } as Bi,
        body: {
          en: "Every project starts with a design system — tokens, type scale, rules about what colour is allowed to mean. Then the code follows it.",
          tr: "Her proje bir design system ile başlar — token'lar, tipografi ölçeği, hangi rengin ne anlama gelebileceğinin kuralları. Kod sonra onu takip eder.",
        } as Bi,
      },
      {
        title: { en: "End to end, on purpose.", tr: "Uçtan uca, bilinçli olarak." } as Bi,
        body: {
          en: "Mobile, web, API, database, payments, deployment. Owning the whole stack means the seams get designed instead of discovered.",
          tr: "Mobil, web, API, veritabanı, ödeme, deployment. Tüm stack'in sende olması, ek yerlerinin sonradan keşfedilmek yerine tasarlanması demek.",
        } as Bi,
      },
      {
        title: { en: "Trust is a feature.", tr: "Güven bir özelliktir." } as Bi,
        body: {
          en: "Encrypted DMs, escrow, passport data, row-level isolation. When the product handles something people can't afford to lose, security is the design.",
          tr: "Şifreli mesajlar, escrow, pasaport verisi, satır seviyesi izolasyon. Ürün insanların kaybetmeyi göze alamayacağı bir şeyi taşıyorsa, güvenlik tasarımın kendisidir.",
        } as Bi,
      },
    ],

    timelineLabel: { en: "TIMELINE", tr: "ZAMAN ÇİZELGESİ" } as Bi,
    timeline: [
      {
        y: "2014",
        title: { en: "Started at 11", tr: "11 yaşında başladım" } as Bi,
        note: {
          en: "Webmaster forums — HTML, hosting, and a lot of breaking things.",
          tr: "Webmaster forumları — HTML, hosting ve bol bol bir şeyleri bozmak.",
        } as Bi,
      },
      {
        y: "2020",
        title: { en: "First freelance project", tr: "İlk freelance proje" } as Bi,
        note: {
          en: "At 17 — client sites, small tools, learning by shipping.",
          tr: "17 yaşında — müşteri siteleri, küçük araçlar, yayına alarak öğrenmek.",
        } as Bi,
      },
      {
        y: "2023",
        title: { en: "Went professional", tr: "Profesyonelleştim" } as Bi,
        note: {
          en: "Full product work: mobile apps, APIs, databases, real users.",
          tr: "Tam ürün işi: mobil uygulamalar, API'ler, veritabanları, gerçek kullanıcılar.",
        } as Bi,
      },
      {
        y: "2025",
        title: { en: "TECK · retail automation", tr: "TECK · perakende otomasyonu" } as Bi,
        note: {
          en: "Barcode stock app, online storefront and admin panel, end to end.",
          tr: "Barkodlu stok uygulaması, online mağaza ve yönetim paneli, uçtan uca.",
        } as Bi,
      },
      {
        y: "2026",
        title: { en: "DRAVION · Xaron · Sperare", tr: "DRAVION · Xaron · Sperare" } as Bi,
        note: {
          en: "Autonomous agent platform, encrypted community platform, escrow marketplace.",
          tr: "Otonom ajan platformu, şifreli topluluk platformu, escrow pazar yeri.",
        } as Bi,
      },
      {
        y: "—",
        title: { en: "Open to full-time roles", tr: "Full-time rollere açık" } as Bi,
        note: {
          en: "Looking for a team where craft and shipping both matter.",
          tr: "Zanaatin ve yayına almanın birlikte önemsendiği bir ekip arıyorum.",
        } as Bi,
      },
    ],

    lookingLabel: { en: "WHAT I'M LOOKING FOR", tr: "NE ARIYORUM" } as Bi,
    looking: {
      en: "A full-time team building something technically real — agents, infrastructure, fintech, developer tools. Somewhere the bar for craft is high and shipping still matters.",
      tr: "Teknik olarak gerçek bir şey inşa eden, full-time bir ekip — ajanlar, altyapı, fintech, geliştirici araçları. Zanaat çıtasının yüksek olduğu ve yayına almanın hâlâ önemsendiği bir yer.",
    } as Bi,

    detailsLabel: { en: "DETAILS", tr: "DETAYLAR" } as Bi,
    details: [
      {
        k: { en: "Based in", tr: "Konum" } as Bi,
        v: { en: "İstanbul, Türkiye · UTC+3", tr: "İstanbul, Türkiye · UTC+3" } as Bi,
      },
      {
        k: { en: "Languages", tr: "Diller" } as Bi,
        v: { en: "Türkçe · English", tr: "Türkçe · İngilizce" } as Bi,
      },
      {
        k: { en: "Remote", tr: "Remote" } as Bi,
        v: {
          en: "Yes — remote-ready, open to relocation",
          tr: "Evet — remote'a hazır, taşınmaya açık",
        } as Bi,
      },
      {
        k: { en: "Status", tr: "Durum" } as Bi,
        v: { en: "Open to full-time roles", tr: "Full-time rollere açık" } as Bi,
        highlight: true,
      },
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
