import type { Bi } from "@/lib/i18n";

export type Job = {
  company: string;
  role: Bi;
  dates: string;
  note: Bi;
};

export type SkillRow = { label: Bi; value: Bi };

export const cv = {
  title: { en: "CV", tr: "CV" } as Bi,
  role: {
    en: "Full-stack Engineer & Product Designer",
    tr: "Full-stack Geliştirici & Ürün Tasarımcısı",
  } as Bi,
  location: {
    en: "Tekirdağ · İstanbul, Türkiye — remote-ready",
    tr: "Tekirdağ · İstanbul, Türkiye — remote çalışırım",
  } as Bi,

  summary: {
    en: "Twelve years writing code, six of them in the industry — from an internship in agricultural robotics to autonomous-vehicle platforms, and now four products I design and build end to end. Comfortable owning the whole stack: interface, design system, API, database, payments and infrastructure.",
    tr: "On iki yıldır kod yazıyorum, altı yılı sektörde: tarım robotiğinde bir stajla başladı, otonom araç platformlarına uzandı, şimdi de baştan sona kendi tasarlayıp geliştirdiğim dört ürün var. Arayüzden veritabanına, ödemeden altyapıya kadar tüm stack bende.",
  } as Bi,

  experienceLabel: { en: "EXPERIENCE", tr: "DENEYİM" } as Bi,
  productsLabel: {
    en: "SELECTED PRODUCTS — DESIGNED AND BUILT END TO END",
    tr: "SEÇİLMİŞ ÜRÜNLER — BAŞTAN SONA TASARLADIM VE GELİŞTİRDİM",
  } as Bi,
  skillsLabel: { en: "CORE STACK", tr: "TEMEL STACK" } as Bi,

  jobs: [
    {
      company: "Independent",
      role: {
        en: "Full-stack Engineer & Product Designer",
        tr: "Full-stack Geliştirici & Ürün Tasarımcısı",
      },
      dates: "2024 – present",
      note: {
        en: "Client work alongside four products of my own, each designed and built end to end — the case studies below. Co-founded Xaron in the same period.",
        tr: "Müşteri işlerinin yanında baştan sona kendi tasarlayıp geliştirdiğim dört ürün — aşağıdaki vaka çalışmaları. Aynı dönemde Xaron'un kurucu ortağı oldum.",
      },
    },
    {
      company: "Cruise (GM)",
      role: {
        en: "Autonomous vehicles — training programme",
        tr: "Otonom araçlar — eğitim programı",
      },
      dates: "2024 · 3 mo",
      note: {
        en: "Three-month programme on the self-driving platform after it moved under General Motors: autonomy services, data flow between components, and the reliability constraints of software nobody can restart mid-drive.",
        tr: "Platform General Motors'a geçtikten sonra sürücüsüz araç tarafında üç aylık program: otonomi servisleri, bileşenler arası veri akışı ve yol ortasında kimsenin yeniden başlatamayacağı bir yazılımın güvenilirlik kısıtları.",
      },
    },
    {
      company: "TheProEco",
      role: { en: "Full-stack Developer, intern", tr: "Full-stack Geliştirici, stajyer" },
      dates: "2022 – 2023",
      note: {
        en: "Product development across web and mobile clients, APIs, databases and deployment.",
        tr: "Web ve mobil istemciler, API'ler, veritabanı ve deployment boyunca ürün geliştirme.",
      },
    },
    {
      company: "Bear Flag Robotics",
      role: {
        en: "Intern → Software Engineer, autonomous systems · remote",
        tr: "Stajyer → Yazılım Mühendisi, otonom sistemler · remote",
      },
      dates: "2020 – 2022 · 2 yrs 6 mo",
      note: {
        en: "Started as an intern and grew into engineering ownership on autonomous agricultural machinery — telemetry pipelines, operator-facing tooling, and systems that stay predictable in a field with no network.",
        tr: "Stajyer olarak başladım, otonom tarım makinelerinde mühendislik sorumluluğuna kadar geldim: telemetri hatları, operatörün kullandığı araçlar ve şebeke çekmeyen bir tarlada bile öngörülebilir kalan sistemler.",
      },
    },
  ] satisfies Job[],

  /** Compact one-line stack summaries for the CV (deeper than the case-study chips). */
  productStacks: {
    dravion: "Next.js 15 · TypeScript · PostgreSQL + pgvector · Drizzle · BullMQ + Redis · Docker · OpenTelemetry",
    xaron: "Rust · Axum · Leptos/WASM · OpenMLS · WebTransport · PostgreSQL · ScyllaDB · LiveKit · Stripe Connect",
    sperare: "React Native · Expo SDK 56 · Supabase (Postgres, RLS, Realtime, Storage) · Stripe Connect",
    teck: "React Native · Expo · Node.js · PostgreSQL · web admin panel",
  } as Record<string, string>,

  productMeta: {
    dravion: { en: "Private beta · dravion.co", tr: "Özel beta · dravion.co" },
    xaron: { en: "Co-founder · open beta · xaron.co", tr: "Kurucu ortak · açık beta · xaron.co" },
    sperare: { en: "Open beta · sperare.app", tr: "Açık beta · sperare.app" },
    teck: { en: "In production · 3 stores · arelmoda.net", tr: "Yayında · 3 mağaza · arelmoda.net" },
  } as Record<string, Bi>,

  productSummaries: {
    dravion: {
      en: "A Manager Agent plans each request and spawns workers in isolated Docker sandboxes that write, test and commit code on their own. Terminal execution never touches the host; user keys are sealed with AES-256-GCM, jobs are HMAC-signed, and every agent turn writes a deterministic replayable record behind a release-blocking eval gate.",
      tr: "Manager Agent her isteği planlıyor; izole Docker sandbox'larında kendi başına kod yazan, test eden ve commit atan worker'lar başlatıyor. Terminal komutları host'a hiç değmiyor. Kullanıcı anahtarları AES-256-GCM ile mühürlü, işler HMAC imzalı ve her ajan turu yeniden oynatılabilir bir kayıt bırakıyor — sürümü bloklayabilen bir eval kapısının arkasında.",
    },
    xaron: {
      en: "Full-Rust product: Axum services across fifteen crates with a Leptos WebAssembly client. End-to-end encryption on OpenMLS (RFC 9420) for groups with constant member churn, and WebTransport over QUIC as the only realtime transport — single-use tickets, certificate pinning, no WebSocket fallback.",
      tr: "Baştan sona Rust: on beş crate'e yayılmış Axum servisleri ve Leptos ile WebAssembly'ye derlenen istemci. Üyesi sürekli değişen gruplar için OpenMLS (RFC 9420) üzerinde uçtan uca şifreleme. Tek gerçek zamanlı taşıma QUIC üzerinden WebTransport: tek kullanımlık bilet, sertifika pinning, WebSocket'e düşme yok.",
    },
    sperare: {
      en: "Money moves through an idempotent fund → milestone → release state machine with replay-safe webhooks. Passports and bank statements sit behind Postgres row-level security, with trust fields and payment writes locked to the service role.",
      tr: "Para, idempotent bir fonlama → aşama → serbest bırakma durum makinesinden geçiyor; webhook'lar tekrar gelse bile güvenli. Pasaport ve banka ekstreleri Postgres satır seviyesi güvenliğin arkasında; güven alanlarına ve ödeme yazmalarına yalnızca servis rolü dokunabiliyor.",
    },
    teck: {
      en: "Mobile barcode app, online store and admin panel over a single inventory. A counter sale and a web checkout race for the same garment, so the count is authoritative in one place and the losing request fails cleanly instead of overselling. Every size × colour pair is its own countable unit with its own barcode and price history, rolled back up for per-channel profit and loss after campaign discounts.",
      tr: "Tek envanter üstünde mobil barkod uygulaması, online mağaza ve yönetim paneli. Kasadaki satışla web'deki sipariş aynı ürün için yarışıyor; sayım tek yerde tutulduğu için kaybeden istek fazla satış yapmak yerine düzgünce hata veriyor. Her beden × renk çifti kendi barkodu ve fiyat geçmişiyle ayrı bir sayım birimi; hepsi kampanya iskontosu sonrası kanal bazlı kâr/zarara toplanıyor.",
    },
  } as Record<string, Bi>,

  skills: [
    {
      label: { en: "Languages", tr: "Diller" },
      value: { en: "Rust · TypeScript", tr: "Rust · TypeScript" },
    },
    {
      label: { en: "Product", tr: "Ürün" },
      value: { en: "React Native · Node.js · PostgreSQL", tr: "React Native · Node.js · PostgreSQL" },
    },
    {
      label: { en: "Practice", tr: "Çalışma biçimi" },
      value: {
        en: "Strict typing, no any or unwrap() in production · STRIDE threat modelling · one CI gate (lint-deny, unit + integration + E2E, dependency audit) · OpenTelemetry tracing · design systems and tokens",
        tr: "Katı tipleme; production'da any ya da unwrap() yok · STRIDE tehdit modelleme · tek CI kapısı (lint-deny, birim + entegrasyon + E2E, bağımlılık denetimi) · OpenTelemetry tracing · design system ve token'lar",
      },
    },
  ] satisfies SkillRow[],

  educationLabel: { en: "EDUCATION", tr: "EĞİTİM" } as Bi,
  education: [
    {
      school: "Uzunköprü Anadolu Lisesi",
      detail: {
        en: "Foreign Language track — graduated",
        tr: "Yabancı Dil alanı — mezun",
      } as Bi,
    },
  ],

  footer: {
    en: "Turkish native · English professional — remote-ready, open to relocation",
    tr: "Türkçe anadil · İngilizce profesyonel — remote çalışırım, taşınmaya da açığım",
  } as Bi,
  caseStudies: {
    en: "Full case studies at",
    tr: "Vaka çalışmalarının tamamı:",
  } as Bi,
  print: { en: "Print / Save as PDF", tr: "Yazdır / PDF olarak kaydet" } as Bi,
};
