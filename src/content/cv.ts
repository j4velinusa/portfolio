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
    tr: "Tekirdağ · İstanbul, Türkiye — remote'a hazır",
  } as Bi,

  summary: {
    en: "Twelve years building software, three of them professionally — backend and platform architecture for YC-backed companies in autonomy, fintech and HR, alongside products I design and build end to end. Comfortable owning the whole stack: interface, design system, API, database, payments and infrastructure.",
    tr: "On iki yıldır yazılım geliştiriyorum, üçü profesyonel — otonomi, fintech ve İK alanındaki YC destekli şirketler için backend ve platform mimarisi, yanında uçtan uca tasarlayıp geliştirdiğim ürünler. Tüm stack'i sahiplenmekte rahatım: arayüz, design system, API, veritabanı, ödeme ve altyapı.",
  } as Bi,

  experienceLabel: { en: "EXPERIENCE", tr: "DENEYİM" } as Bi,
  productsLabel: {
    en: "SELECTED PRODUCTS — DESIGNED AND BUILT END TO END",
    tr: "SEÇİLMİŞ ÜRÜNLER — UÇTAN UCA TASARLANDI VE GELİŞTİRİLDİ",
  } as Bi,
  skillsLabel: { en: "SKILLS & PRACTICE", tr: "YETKİNLİKLER & PRATİK" } as Bi,

  jobs: [
    {
      company: "Cruise",
      role: {
        en: "Architecture Developer — autonomous vehicles",
        tr: "Mimari Geliştirici — otonom araçlar",
      },
      dates: "2025 – 2026 · 9 mo",
      note: {
        en: "Architecture work on self-driving vehicle systems: service boundaries, data flow between autonomy components, and the reliability constraints that come with software nobody can restart mid-drive.",
        tr: "Sürücüsüz araç sistemlerinde mimari çalışma: servis sınırları, otonomi bileşenleri arasındaki veri akışı ve sürüş ortasında kimsenin yeniden başlatamayacağı bir yazılımın getirdiği güvenilirlik kısıtları.",
      },
    },
    {
      company: "Rippling",
      role: {
        en: "Backend / API Architecture Engineer",
        tr: "Backend / API Mimarisi Mühendisi",
      },
      dates: "2024 – 2025 · 1 yr 4 mo",
      note: {
        en: "API and service architecture on a workforce platform where HR, IT and payroll share one employee record — schema design, contract-first endpoints, and keeping integrations consistent as the surface grew.",
        tr: "İK, IT ve bordronun tek bir çalışan kaydını paylaştığı bir workforce platformunda API ve servis mimarisi — şema tasarımı, sözleşme-öncelikli endpoint'ler ve yüzey büyürken entegrasyonları tutarlı tutmak.",
      },
    },
    {
      company: "Podium",
      role: { en: "Full-stack Software Engineer", tr: "Full-stack Yazılım Mühendisi" },
      dates: "2024 · 8 mo",
      note: {
        en: "Product engineering across the customer-messaging platform — front-end features through to the services and data behind them.",
        tr: "Müşteri mesajlaşma platformunda ürün mühendisliği — frontend özelliklerinden arkasındaki servis ve veriye kadar.",
      },
    },
    {
      company: "Bear Flag Robotics",
      role: {
        en: "Autonomous Systems Architecture · remote",
        tr: "Otonom Sistemler Mimarisi · remote",
      },
      dates: "2023 – 2024 · 1 yr 1 mo",
      note: {
        en: "Architecture for autonomous agricultural machinery: telemetry pipelines, operator-facing tooling, and systems that have to stay predictable in a field with no network.",
        tr: "Otonom tarım makineleri için mimari: telemetri hatları, operatöre dönük araçlar ve şebekesiz bir tarlada öngörülebilir kalmak zorunda olan sistemler.",
      },
    },
    {
      company: "TheProEco",
      role: { en: "Full-stack Developer", tr: "Full-stack Geliştirici" },
      dates: "2022 – 2023",
      note: {
        en: "End-to-end product development — web and mobile clients, APIs, databases and deployment.",
        tr: "Uçtan uca ürün geliştirme — web ve mobil istemciler, API'ler, veritabanları ve deployment.",
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
    xaron: { en: "Co-founder · closed beta · xaron.co", tr: "Kurucu ortak · kapalı beta · xaron.co" },
    sperare: { en: "Private beta · sperare.app", tr: "Özel beta · sperare.app" },
    teck: { en: "In production · 3 stores · arelmoda.net", tr: "Yayında · 3 mağaza · arelmoda.net" },
  } as Record<string, Bi>,

  productSummaries: {
    dravion: {
      en: "A Manager Agent plans each request and spawns workers in isolated Docker sandboxes that write, test and commit code on their own. Terminal execution never touches the host; user keys are sealed with AES-256-GCM, jobs are HMAC-signed, and every agent turn writes a deterministic replayable record behind a release-blocking eval gate.",
      tr: "Manager Agent her isteği planlar ve izole Docker sandbox'larında kendi başına kod yazan, test eden ve commit'leyen worker'lar başlatır. Terminal çalıştırması host'a hiç dokunmaz; kullanıcı anahtarları AES-256-GCM ile mühürlenir, işler HMAC ile imzalanır ve her ajan turu, sürümü bloklayabilen bir eval kapısının arkasında deterministik ve yeniden oynatılabilir bir kayıt yazar.",
    },
    xaron: {
      en: "Full-Rust product: Axum services across fifteen crates with a Leptos WebAssembly client. End-to-end encryption on OpenMLS (RFC 9420) for groups with constant member churn, and WebTransport over QUIC as the only realtime transport — single-use tickets, certificate pinning, no WebSocket fallback.",
      tr: "Tamamen Rust bir ürün: on beş crate boyunca Axum servisleri ve Leptos WebAssembly istemcisi. Sürekli üye değişimi olan gruplar için OpenMLS (RFC 9420) üzerinde uçtan uca şifreleme ve tek gerçek-zamanlı taşıma olarak QUIC üzerinden WebTransport — tek kullanımlık bilet, sertifika pinning, WebSocket geri dönüşü yok.",
    },
    sperare: {
      en: "Money moves through an idempotent fund → milestone → release state machine with replay-safe webhooks. Passports and bank statements sit behind Postgres row-level security, with trust fields and payment writes locked to the service role.",
      tr: "Para, replay-güvenli webhook'larla çalışan idempotent fon → aşama → serbest bırakma durum makinesinden geçer. Pasaportlar ve banka ekstreleri Postgres satır seviyesi güvenliğin arkasında durur; güven alanları ve ödeme yazmaları servis rolüne kilitlidir.",
    },
    teck: {
      en: "Mobile barcode app, online store and admin panel on one inventory: a scan on the shop floor updates e-commerce stock in the same moment. Variant matrix, per-channel profit and loss after discounts, and printable date-range reporting.",
      tr: "Tek envanter üzerinde mobil barkod uygulaması, online mağaza ve yönetim paneli: mağazadaki bir okutma aynı anda e-ticaret stoğunu güncelliyor. Varyant matrisi, iskonto sonrası kanal bazlı kâr/zarar ve yazdırılabilir tarih aralıklı raporlama.",
    },
  } as Record<string, Bi>,

  skills: [
    {
      label: { en: "Languages", tr: "Diller" },
      value: { en: "Rust · TypeScript · JavaScript · SQL", tr: "Rust · TypeScript · JavaScript · SQL" },
    },
    {
      label: { en: "Frontend", tr: "Frontend" },
      value: {
        en: "React · Next.js 15 · React Native · Expo · Leptos (WASM)",
        tr: "React · Next.js 15 · React Native · Expo · Leptos (WASM)",
      },
    },
    {
      label: { en: "Backend & infra", tr: "Backend & altyapı" },
      value: {
        en: "Node.js · Express · Axum · REST · BullMQ · WebTransport/QUIC · Docker · AWS · Google Cloud",
        tr: "Node.js · Express · Axum · REST · BullMQ · WebTransport/QUIC · Docker · AWS · Google Cloud",
      },
    },
    {
      label: { en: "Data", tr: "Veri" },
      value: {
        en: "PostgreSQL (RLS, pgvector) · Supabase · ScyllaDB · Firebase · Oracle · Drizzle · sqlx",
        tr: "PostgreSQL (RLS, pgvector) · Supabase · ScyllaDB · Firebase · Oracle · Drizzle · sqlx",
      },
    },
    {
      label: { en: "Payments & security", tr: "Ödeme & güvenlik" },
      value: {
        en: "Stripe Connect escrow & payouts · OpenMLS (RFC 9420) · KYC · GDPR / KVKK",
        tr: "Stripe Connect escrow & ödemeler · OpenMLS (RFC 9420) · KYC · GDPR / KVKK",
      },
    },
    {
      label: { en: "Practice", tr: "Pratik" },
      value: {
        en: "Strict typing, no any or unwrap() in production · STRIDE threat modelling · one CI gate (lint-deny, unit + integration + E2E, dependency audit) · OpenTelemetry tracing · design systems and tokens",
        tr: "Katı tipleme, production'da any veya unwrap() yok · STRIDE tehdit modelleme · tek CI kapısı (lint-deny, unit + entegrasyon + E2E, bağımlılık denetimi) · OpenTelemetry tracing · design system ve token'lar",
      },
    },
  ] satisfies SkillRow[],

  footer: {
    en: "Turkish native · English professional — remote-ready, open to relocation",
    tr: "Türkçe anadil · İngilizce profesyonel — remote'a hazır, taşınmaya açık",
  } as Bi,
  caseStudies: {
    en: "Full case studies at",
    tr: "Tüm vaka çalışmaları:",
  } as Bi,
  print: { en: "Print / Save as PDF", tr: "Yazdır / PDF kaydet" } as Bi,
};
