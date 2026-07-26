import type { Bi } from "@/lib/i18n";

export type Shot = { src: string; caption: Bi };
export type Feature = { title: Bi; body: Bi };

export type Project = {
  slug: string;
  name: string;
  accent: string;
  gradient: string;
  category: Bi;
  tagline: Bi;
  blurb: Bi;
  tech: string[];
  liveUrl?: string;
  features: Feature[];
  gallery: Shot[];
  mockup?: "dravion" | "teck";
};

export const projects: Project[] = [
  {
    slug: "dravion",
    name: "DRAVION",
    accent: "#ff9500",
    gradient: "linear-gradient(90deg,#ffb340,#ff9500 50%,#ff6b00)",
    category: { en: "AI Code Platform", tr: "Otonom Kod Platformu" },
    tagline: { en: "An autonomous software team.", tr: "Otonom bir yazılım ekibi." },
    blurb: {
      en: "A Manager Agent plans your request, then spawns worker agents in isolated Docker sandboxes. They write, test, and commit code — on their own.",
      tr: "Bir Manager Agent isteğini planlar, sonra izole Docker sandbox'larında worker ajanları başlatır. Kodu kendileri yazar, test eder ve commit'ler.",
    },
    tech: ["Multi-agent", "Docker sandboxes", "Next.js", "Node.js", "PostgreSQL", "TypeScript"],
    mockup: "dravion",
    features: [
      {
        title: { en: "One conversation.", tr: "Tek konuşma." },
        body: {
          en: "Users talk to a single Manager Agent. It breaks the request down, delegates, and reports back.",
          tr: "Kullanıcılar tek bir Manager Agent ile konuşur. İsteği parçalara ayırır, delege eder ve geri raporlar.",
        },
      },
      {
        title: { en: "Isolated sandboxes.", tr: "İzole sandbox'lar." },
        body: {
          en: "Every worker runs in its own Docker container — reading and writing files, running terminal commands, committing code.",
          tr: "Her worker kendi Docker konteynerinde çalışır — dosya okur/yazar, terminal komutu çalıştırır, kod commit'ler.",
        },
      },
      {
        title: { en: "Fully autonomous.", tr: "Tamamen otonom." },
        body: {
          en: "Agents plan, write, test, and commit on their own. This is not an AI-assisted editor — no human in the loop required.",
          tr: "Ajanlar planlar, yazar, test eder ve commit'ler — kendi başlarına. Bu bir AI-editör değil; döngüde insan gerekmez.",
        },
      },
    ],
    gallery: [
      {
        src: "/projects/dravion/patterns.png",
        caption: {
          en: "Design system — honest failures, quiet loading.",
          tr: "Design system — dürüst hatalar, sessiz yüklenme.",
        },
      },
    ],
  },
  {
    slug: "xaron",
    name: "XARON",
    accent: "#a972ff",
    gradient: "linear-gradient(90deg,#c9a3ff,#a972ff 50%,#8b4dff)",
    category: { en: "Community Platform", tr: "Topluluk Platformu" },
    tagline: {
      en: "Privacy-first home for gaming communities.",
      tr: "Oyun toplulukları için gizlilik-öncelikli bir ev.",
    },
    blurb: {
      en: "End-to-end encrypted DMs. Free text, voice, and video communities. Creator monetization at a flat 1% — no ads, no data mining.",
      tr: "Uçtan uca şifreli DM'ler. Ücretsiz metin, ses ve video toplulukları. %1 sabit komisyonla creator gelirlendirmesi — reklam yok, veri madenciliği yok.",
    },
    tech: ["End-to-end encryption", "Real-time voice & video", "Creator payments", "React"],
    liveUrl: "https://xaron.co",
    features: [
      {
        title: { en: "End-to-end encrypted.", tr: "Uçtan uca şifreli." },
        body: {
          en: "Direct messages no one else can read — not even us. Privacy is the default, not a setting.",
          tr: "Kimsenin okuyamadığı direkt mesajlar — biz bile. Gizlilik varsayılan, ayar değil.",
        },
      },
      {
        title: { en: "Voice & video communities.", tr: "Ses & video toplulukları." },
        body: {
          en: "Free text, voice, and video channels with screen sharing. No ads, no data mining, ever.",
          tr: "Ücretsiz metin, ses ve video kanalları + ekran paylaşımı. Ne reklam, ne veri madenciliği.",
        },
      },
      {
        title: { en: "Built-in monetization.", tr: "Yerleşik gelirlendirme." },
        body: {
          en: "Paid subscription tiers and a real-time view of earnings — at a flat 1% platform commission.",
          tr: "Ücretli abonelik katmanları ve gerçek-zamanlı kazanç görünümü — %1 sabit platform komisyonuyla.",
        },
      },
    ],
    gallery: [
      {
        src: "/projects/xaron/community.png",
        caption: {
          en: "Community — text, voice & video channels, in light and dark.",
          tr: "Topluluk — metin, ses & video kanalları, açık ve koyu temada.",
        },
      },
    ],
  },
  {
    slug: "sperare",
    name: "Sperare",
    accent: "#30d158",
    gradient: "linear-gradient(90deg,#5ee387,#30d158 50%,#1faf47)",
    category: { en: "Marketplace", tr: "Pazar Yeri" },
    tagline: { en: "Visas, without the fear.", tr: "Vize, korku olmadan." },
    blurb: {
      en: "Expats find vetted migration consultants, pay safely through escrow, and track their visa process end to end.",
      tr: "Yurt dışına gidenler doğrulanmış göçmenlik danışmanları bulur, escrow ile güvenle öder ve vize sürecini uçtan uca takip eder.",
    },
    tech: ["React Native", "Supabase", "Postgres & RLS", "Stripe Connect", "KYC"],
    features: [
      {
        title: { en: "Vetted consultants.", tr: "Doğrulanmış danışmanlar." },
        body: {
          en: "Every consultant is identity-verified. Clients discover, compare, and choose with confidence.",
          tr: "Her danışman kimlik doğrulamalı. Danışanlar güvenle keşfeder, karşılaştırır ve seçer.",
        },
      },
      {
        title: { en: "Escrow payments.", tr: "Escrow ödemeler." },
        body: {
          en: "Money is held safely and released against milestones — Stripe Connect escrow, no surprises.",
          tr: "Para güvenle tutulur ve aşamalara göre serbest bırakılır — Stripe Connect escrow, sürpriz yok.",
        },
      },
      {
        title: { en: "End-to-end tracking.", tr: "Uçtan uca takip." },
        body: {
          en: "Documents, timeline, and status in one place — multi-language, for clients and consultants alike.",
          tr: "Belgeler, süreç ve durum tek yerde — çok dilli, danışan ve danışman için.",
        },
      },
    ],
    gallery: [
      { src: "/projects/sperare/landing.png", caption: { en: "Landing — safe, guided immigration.", tr: "Landing — güvenli, rehberli göçmenlik." } },
      { src: "/projects/sperare/02-case-detay.png", caption: { en: "Case detail — escrow & payment timeline.", tr: "Case detay — escrow & ödeme çizelgesi." } },
      { src: "/projects/sperare/release-modal.png", caption: { en: "Escrow release — funds move on milestones.", tr: "Escrow serbest bırakma — para aşamalarda ilerler." } },
      { src: "/projects/sperare/sahsi-migration.png", caption: { en: "Consultant workspace — clients and invites.", tr: "Danışman paneli — danışanlar ve davetler." } },
      { src: "/projects/sperare/app-dosyalar.png", caption: { en: "Document vault — everything in one place.", tr: "Belge kasası — her şey tek yerde." } },
      { src: "/projects/sperare/01-mob-danisan-1.png", caption: { en: "Mobile — fraud protection built in.", tr: "Mobil — yerleşik dolandırıcılık koruması." } },
    ],
  },
  {
    slug: "teck",
    name: "TECK",
    accent: "#2997ff",
    gradient: "linear-gradient(90deg,#6bb5ff,#2997ff 50%,#1d4ff2)",
    category: { en: "Retail Automation", tr: "Perakende Otomasyonu" },
    tagline: { en: "Scan. Sync. Sell.", tr: "Scan. Sync. Sell." },
    blurb: {
      en: "Scan a barcode on your phone and stock updates everywhere — in-store and online. Manage every store from one app, on mobile or PC.",
      tr: "Telefonundan bir barkod tara, stok her yerde güncellensin — mağazada ve online. Her mağazanı tek uygulamadan yönet, mobil ya da PC.",
    },
    tech: ["React Native", "Expo", "Node.js", "PostgreSQL"],
    mockup: "teck",
    features: [
      {
        title: { en: "One scan, everywhere.", tr: "Tek tarama, her yerde." },
        body: {
          en: "Scan a barcode from the mobile app — physical and online stock update instantly, together.",
          tr: "Mobil uygulamadan barkod tara — fiziksel ve online stok anında, birlikte güncellenir.",
        },
      },
      {
        title: { en: "Full stock control.", tr: "Tam stok kontrolü." },
        body: {
          en: "Add, remove, count, and manage inventory — including over-the-counter sales, right from the app.",
          tr: "Ekle, çıkar, say ve stok yönet — tezgah üstü satışlar dahil, doğrudan uygulamadan.",
        },
      },
      {
        title: { en: "Every store, one app.", tr: "Her mağaza, tek app." },
        body: {
          en: "Run multiple stores from a single dashboard — on your phone or your PC.",
          tr: "Birden çok mağazayı tek panelden yönet — telefonda ya da PC'de.",
        },
      },
      {
        title: { en: "Built for the counter.", tr: "Tezgah için tasarlandı." },
        body: {
          en: "Fast enough for a queue: scan, sell, done. No terminal, no retraining.",
          tr: "Sıraya yetecek hız: tara, sat, bitti. Terminal yok, yeniden eğitim yok.",
        },
      },
    ],
    gallery: [],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
