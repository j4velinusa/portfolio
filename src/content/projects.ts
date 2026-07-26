import type { Bi } from "@/lib/i18n";

/** w/h are the file's real pixel dimensions — never guessed. They fix the
 *  reserved aspect ratio and let us refuse to upscale a small source. */
export type Shot = { src: string; caption: Bi; w: number; h: number };
export type Feature = { title: Bi; body: Bi };
export type Stat = { value: string; label: Bi };

/** Palette for a project's own case-study page. Each product has its own brand. */
export type Theme = {
  bg: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  /** Display headings in Fraunces rather than the sans stack. */
  serif?: boolean;
};

export type Project = {
  slug: string;
  name: string;
  /** Accent used on the dark home/work pages. */
  accent: string;
  gradient: string;
  theme: Theme;
  category: Bi;
  tagline: Bi;
  blurb: Bi;
  /** Short proof points, shown on the Work page. */
  bullets: Bi<string[]>;
  stats?: Stat[];
  tech: string[];
  liveUrl?: string;
  features: Feature[];
  gallery: Shot[];
  mockup?: "dravion" | "teck" | "xaron" | "sperare";
};

export const projects: Project[] = [
  {
    slug: "dravion",
    name: "DRAVION",
    accent: "#d97757",
    gradient: "linear-gradient(90deg,#e08b6a,#d97757 50%,#c96442)",
    theme: {
      bg: "#f6f3ec",
      surface: "#fbf9f4",
      card: "#fdfcf8",
      text: "#1f1b15",
      muted: "#6b6153",
      line: "rgba(31,27,21,.12)",
      accent: "#c96442",
      serif: true,
    },
    category: { en: "AI Code Platform", tr: "Otonom Kod Platformu" },
    tagline: {
      en: "From rough idea to deploy-ready code.",
      tr: "Ham fikirden yayına hazır koda.",
    },
    blurb: {
      en: "A supervised autonomous engineering cockpit. You describe the work; a Manager Agent plans it and a fleet of workers ships it.",
      tr: "Denetimli, otonom bir mühendislik masası. Ne istediğini anlatıyorsun; Manager Agent planlıyor, worker filosu yazıp teslim ediyor.",
    },
    bullets: {
      en: [
        "Manager Agent asks the missing questions, then plans and delegates",
        "Workers run in isolated Docker sandboxes: files, terminal, commits",
        "Idea → questions → roadmap → workers → diff → deploy-ready",
      ],
      tr: [
        "Manager Agent eksikleri sorar, planı çıkarır, işi dağıtır",
        "Worker'lar izole Docker sandbox'ında çalışır: dosya, terminal, commit",
        "Fikir → sorular → yol haritası → worker'lar → diff → yayına hazır kod",
      ],
    },
    tech: ["Next.js 15", "TypeScript", "PostgreSQL + pgvector", "Drizzle", "BullMQ + Redis", "Docker", "OpenTelemetry"],
    mockup: "dravion",
    features: [
      {
        title: { en: "One conversation.", tr: "Tek konuşma." },
        body: {
          en: "You talk to a single Manager Agent. It asks what's missing, breaks the request down, delegates, and reports back.",
          tr: "Tek bir Manager Agent ile konuşuyorsun. Eksiği sorar, işi parçalar, dağıtır ve sana rapor eder. Worker'ları sen yönetmiyorsun.",
        },
      },
      {
        title: { en: "Isolated sandboxes.", tr: "İzole sandbox'lar." },
        body: {
          en: "Every worker runs in its own Docker container — reading and writing files, running terminal commands, committing code.",
          tr: "Her worker kendi Docker konteynerinde çalışır: dosya okur yazar, terminal komutu çalıştırır, oturum dalına commit atar.",
        },
      },
      {
        title: { en: "Supervised, not blind.", tr: "Denetimli, kör değil." },
        body: {
          en: "Agents plan, write, test and commit on their own — but the roadmap and the diff are yours to review. Not an AI-assisted editor.",
          tr: "Ajanlar planı da kodu da testi de kendi yapar; ama riskli her adımda diff'i önüne koyup onayını bekler. AI destekli editör değil.",
        },
      },
    ],
    gallery: [
      {
        src: "/projects/dravion/cockpit.png",
        w: 2620,
        h: 620,
        caption: {
          en: "The fleet, live — workers running while a diff waits for your call.",
          tr: "Filo iş başında — worker'lar çalışırken bir diff senin onayını bekliyor.",
        },
      },
      {
        src: "/projects/dravion/patterns.png",
        w: 1283,
        h: 850,
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
    accent: "oklch(0.68 0.16 274)",
    gradient: "linear-gradient(90deg,oklch(0.78 0.13 274),oklch(0.68 0.16 274) 50%,oklch(0.58 0.18 274))",
    theme: {
      bg: "oklch(0.16 0.012 250)",
      surface: "oklch(0.215 0.012 250)",
      card: "oklch(0.235 0.012 250)",
      text: "oklch(0.96 0.004 250)",
      muted: "oklch(0.65 0.012 250)",
      line: "oklch(1 0 0 / .10)",
      accent: "oklch(0.68 0.16 274)",
    },
    category: { en: "Community Platform", tr: "Topluluk Platformu" },
    tagline: { en: "Your community. Actually yours.", tr: "Senin topluluğun. Gerçekten senin." },
    blurb: {
      en: "A privacy-first home for gaming communities and creators — no ads, no data mining.",
      tr: "Oyun toplulukları ve içerik üreticileri için gizliliği önce koyan bir ev. Reklam yok, veri madenciliği yok.",
    },
    bullets: {
      en: [
        "End-to-end encrypted DMs — not even we can read them",
        "Free text, voice & video channels, plus screen sharing",
        "Paid tiers with real-time earnings, flat 1% commission",
      ],
      tr: [
        "Uçtan uca şifreli DM — biz bile okuyamıyoruz",
        "Ücretsiz metin, ses ve video kanalları, ekran paylaşımı dahil",
        "Ücretli üyelik katmanları, anlık kazanç takibi, %1 sabit komisyon",
      ],
    },
    stats: [
      { value: "E2E", label: { en: "encrypted DMs", tr: "şifreli mesajlar" } },
      { value: "1%", label: { en: "flat commission", tr: "sabit komisyon" } },
      { value: "0", label: { en: "ads, forever", tr: "reklam, hiç" } },
    ],
    tech: ["Rust", "Axum", "Leptos/WASM", "OpenMLS (RFC 9420)", "WebTransport/QUIC", "ScyllaDB", "LiveKit"],
    liveUrl: "https://xaron.co",
    mockup: "xaron",
    features: [
      {
        title: { en: "End-to-end encrypted.", tr: "Uçtan uca şifreli." },
        body: {
          en: "Direct messages no one else can read — not even us. Privacy is the default, not a setting.",
          tr: "Kimsenin okuyamadığı özel mesajlar; biz de dahil. Gizlilik bir ayar değil, varsayılan.",
        },
      },
      {
        title: { en: "Voice & video communities.", tr: "Ses & video toplulukları." },
        body: {
          en: "Free text, voice and video channels with screen sharing. No ads, no data mining, ever.",
          tr: "Metin, ses ve video kanalları, üstüne ekran paylaşımı — ücretsiz planda. Ne reklam ne veri madenciliği.",
        },
      },
      {
        title: { en: "Creators keep it.", tr: "Kazanç creator'da kalır." },
        body: {
          en: "Paid subscription tiers and a real-time view of earnings — at a flat 1% platform commission.",
          tr: "Ücretli üyelik katmanları ve anlık kazanç ekranı. Platform payı sabit %1; gizli kesinti yok.",
        },
      },
    ],
    gallery: [
      {
        src: "/projects/xaron/e2e.png",
        w: 2620,
        h: 1020,
        caption: {
          en: "Encrypted by default, free to run, monetizable at 1%.",
          tr: "Varsayılan şifreli, ücretsiz kurulur, %1 ile gelir getirir.",
        },
      },
      {
        src: "/projects/xaron/pricing.png",
        w: 2620,
        h: 1020,
        caption: {
          en: "Free forever, Premium for the rest.",
          tr: "Sonsuza dek ücretsiz; gerisi için Premium.",
        },
      },
      {
        src: "/projects/xaron/community.png",
        w: 1300,
        h: 810,
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
    accent: "#5FCBAA",
    gradient: "linear-gradient(90deg,#5FCBAA,#137A63 55%,#0E5A48)",
    theme: {
      bg: "#e7e4dd",
      surface: "#f1efe9",
      card: "#faf9f6",
      text: "#5c5749",
      muted: "#8e897d",
      line: "rgba(92,87,73,.16)",
      accent: "#137A63",
      serif: true,
    },
    category: { en: "Marketplace", tr: "Pazar Yeri" },
    tagline: {
      en: "Finding a consultant shouldn't feel like a gamble.",
      tr: "Danışman bulmak kumar gibi olmamalı.",
    },
    blurb: {
      en: "A marketplace for expats and migration offices — verified consultants, money held in escrow, and every document in one encrypted vault.",
      tr: "Yurt dışına gidenlerle göçmenlik ofislerini buluşturan pazar yeri: kimliği doğrulanmış danışmanlar, iş bitene kadar emanette duran para ve tüm belgeler tek kasada.",
    },
    bullets: {
      en: [
        "Identity-verified consultants with real credentials and reviews",
        "Escrow releases money milestone by milestone, never up front",
        "Client app and consultant CRM are one system",
      ],
      tr: [
        "Kimliği doğrulanmış, belgesi ve yorumu gerçek danışmanlar",
        "Para aşama aşama serbest kalır; peşin ödeme yok",
        "Danışan uygulaması ve danışman CRM'i aynı sistem",
      ],
    },
    tech: ["React Native", "Expo SDK 56", "Supabase (Postgres, RLS)", "Stripe Connect", "KYC"],
    mockup: "sperare",
    features: [
      {
        title: { en: "Verified consultants.", tr: "Doğrulanmış danışmanlar." },
        body: {
          en: "Every consultant is identity-verified with real credentials. Clients discover, compare and choose with confidence.",
          tr: "Her danışmanın kimliği listeye girmeden önce doğrulanıyor. Danışan rahatça araştırıyor, karşılaştırıyor, seçiyor.",
        },
      },
      {
        title: { en: "Escrow payments.", tr: "Escrow ödemeler." },
        body: {
          en: "Money is held safely and released against milestones — Stripe Connect escrow, never paid up front.",
          tr: "Para emanet hesabında duruyor ve aşama tamamlandıkça serbest kalıyor. Stripe Connect escrow; ne peşin ne boşluğa.",
        },
      },
      {
        title: { en: "One encrypted vault.", tr: "Tek şifreli kasa." },
        body: {
          en: "Documents, timeline and status in one place — multi-language, for clients and consultants alike.",
          tr: "Belgeler, süreç ve durum tek yerde. Danışman yalnızca dosyanın gerektirdiğini görüyor.",
        },
      },
    ],
    gallery: [
      {
        src: "/projects/sperare/mockups.png",
        w: 2620,
        h: 760,
        caption: {
          en: "Discover, escrow and the document vault — the three things that build trust.",
          tr: "Keşfet, escrow ve belge kasası — güveni kuran üç şey.",
        },
      },
      {
        src: "/projects/sperare/landing.png",
        w: 1250,
        h: 820,
        caption: { en: "Landing — safe, guided immigration.", tr: "Landing — güvenli, rehberli göçmenlik." },
      },
      {
        src: "/projects/sperare/02-case-detay.png",
        w: 924,
        h: 540,
        caption: { en: "Case detail — escrow & payment timeline.", tr: "Case detay — escrow & ödeme çizelgesi." },
      },
      {
        src: "/projects/sperare/release-modal.png",
        w: 924,
        h: 540,
        caption: { en: "Escrow release — funds move on milestones.", tr: "Escrow serbest bırakma — para aşamalarda ilerler." },
      },
      {
        src: "/projects/sperare/app-dosyalar.png",
        w: 924,
        h: 540,
        caption: { en: "Document vault — everything in one place.", tr: "Belge kasası — her şey tek yerde." },
      },
    ],
  },
  {
    slug: "teck",
    name: "TECK",
    accent: "#C2653F",
    gradient: "linear-gradient(90deg,#d98a63,#C2653F 50%,#a8502e)",
    theme: {
      bg: "#f6f3ec",
      surface: "#fdfcf8",
      card: "#ffffff",
      text: "#3b342b",
      muted: "#6b6153",
      line: "rgba(59,52,43,.14)",
      accent: "#C2653F",
      serif: true,
    },
    category: { en: "Retail Automation", tr: "Perakende Otomasyonu" },
    tagline: { en: "Scan. Sync. Sell.", tr: "Scan. Sync. Sell." },
    blurb: {
      en: "A barcode stock app for fashion retail, an online storefront, and an admin panel — designed and built end to end. One scan updates the shop floor and the web store together.",
      tr: "Moda perakendesi için barkodlu stok uygulaması, online mağaza ve yönetim paneli — baştan sona tasarlanıp geliştirildi. Tek okutma, mağazayla web mağazasını birlikte güncelliyor.",
    },
    bullets: {
      en: [
        "Scan from mobile — shop floor and web store sync instantly",
        "Size × colour matrix, campaigns, and profit/loss per channel",
        "Mobile app, online storefront and admin panel — end to end",
      ],
      tr: [
        "Mobilden okut; mağaza ve web mağazası aynı anda güncellenir",
        "Beden × renk matrisi, kampanyalar, kanal kanal kâr/zarar",
        "Mobil uygulama, online mağaza ve yönetim paneli — baştan sona",
      ],
    },
    tech: ["React Native", "Expo", "Node.js", "PostgreSQL"],
    mockup: "teck",
    features: [
      {
        title: { en: "Barcode selling.", tr: "Barkod ile satış." },
        body: {
          en: "Scan, pick the variant, and stock drops instantly — in the shop and online together.",
          tr: "Okut, varyantı seç, stok anında düşsün. Mağaza ve online birlikte.",
        },
      },
      {
        title: { en: "Size × colour matrix.", tr: "Beden × renk matrisi." },
        body: {
          en: "Every size and colour on one screen; what's critical or sold out shows up immediately.",
          tr: "Bütün bedenler ve renkler tek ekranda; kritiğe düşen ve tükenen hemen göze çarpıyor.",
        },
      },
      {
        title: { en: "Profit / loss analysis.", tr: "Kâr / zarar analizi." },
        body: {
          en: "Cost-to-sale spread, margin, and profit by channel — the real number after discounts.",
          tr: "Geliş–satış farkı, marj ve kanal bazlı kâr. İskonto sonrası net rakam.",
        },
      },
      {
        title: { en: "Store ↔ online sync.", tr: "Mağaza ↔ online senkron." },
        body: {
          en: "One stock, two channels. The moment something sells, the e-commerce stock updates too.",
          tr: "Tek stok, iki kanal. Satış olduğu an e-ticaret stoğu da düşüyor.",
        },
      },
      {
        title: { en: "Campaigns & discounts.", tr: "Kampanya & indirim." },
        body: {
          en: "Per-product online discounts; the old price is struck through and the new one shines.",
          tr: "Ürüne özel online indirim; vitrinde eski fiyat çizilir, yenisi öne çıkar.",
        },
      },
      {
        title: { en: "Date-range reports.", tr: "Tarih aralıklı rapor." },
        body: {
          en: "Net profit, revenue, returns, discounts and product performance — printable paperwork.",
          tr: "Net kâr, ciro, iade, indirim ve ürün performansı; yazdırmaya hazır rapor.",
        },
      },
    ],
    gallery: [
      { src: "/projects/teck/01-kapak.png", w: 720, h: 540, caption: { en: "AREL MODA — the case study cover.", tr: "AREL MODA — vaka çalışması kapağı." } },
      { src: "/projects/teck/02-mobil.png", w: 720, h: 540, caption: { en: "Mobile — stock and selling in one hand.", tr: "Mobil — tek elde stok ve satış." } },
      { src: "/projects/teck/03-web-panel.png", w: 720, h: 540, caption: { en: "Web admin — full control on the desktop.", tr: "Web panel — masaüstünde tam kontrol." } },
      { src: "/projects/teck/05-teslimat.png", w: 720, h: 540, caption: { en: "Delivered end to end.", tr: "Uçtan uca teslim edildi." } },
    ],
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
