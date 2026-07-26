import type { Bi } from "@/lib/i18n";

/** Facts block at the top of a case study. */
export type ProjectMeta = { k: Bi; v: Bi }[];

export type DeepItem = { title: Bi; body: Bi; tags?: string[] };

export type DeepSection = {
  label: Bi;
  quote?: Bi;
  items: DeepItem[];
  chips?: string[];
  /** Two-column list layout instead of cards. */
  columns?: { title: Bi; points: Bi<string[]> }[];
};

export const projectMeta: Record<string, ProjectMeta> = {
  dravion: [
    { k: { en: "Role", tr: "Rol" }, v: { en: "Solo full-stack engineer & product designer", tr: "Tek başına full-stack geliştirici & ürün tasarımcısı" } },
    { k: { en: "Duration", tr: "Süre" }, v: { en: "9 months", tr: "9 ay" } },
    { k: { en: "Status", tr: "Durum" }, v: { en: "Private beta", tr: "Özel beta" } },
    { k: { en: "Scope", tr: "Kapsam" }, v: { en: "Product design · backend · infrastructure", tr: "Ürün tasarımı · backend · altyapı" } },
  ],
  xaron: [
    { k: { en: "Role", tr: "Rol" }, v: { en: "Co-founder", tr: "Kurucu ortak" } },
    { k: { en: "Scope", tr: "Kapsam" }, v: { en: "Product · platform · crypto", tr: "Ürün · platform · kriptografi" } },
    { k: { en: "Status", tr: "Durum" }, v: { en: "Closed beta", tr: "Kapalı beta" } },
    { k: { en: "Team", tr: "Ekip" }, v: { en: "Founding team", tr: "Kurucu ekip" } },
  ],
  sperare: [
    { k: { en: "Role", tr: "Rol" }, v: { en: "Solo full-stack engineer & product designer", tr: "Tek başına full-stack geliştirici & ürün tasarımcısı" } },
    { k: { en: "Duration", tr: "Süre" }, v: { en: "9 months", tr: "9 ay" } },
    { k: { en: "Status", tr: "Durum" }, v: { en: "Private beta", tr: "Özel beta" } },
    { k: { en: "Scope", tr: "Kapsam" }, v: { en: "Product design · backend · infrastructure", tr: "Ürün tasarımı · backend · altyapı" } },
  ],
  teck: [
    { k: { en: "Role", tr: "Rol" }, v: { en: "Solo — design, mobile, web, panel", tr: "Tek başına — tasarım, mobil, web, panel" } },
    { k: { en: "Client", tr: "Müşteri" }, v: { en: "AREL MODA", tr: "AREL MODA" } },
    { k: { en: "Status", tr: "Durum" }, v: { en: "In production · 3 stores", tr: "Yayında · 3 mağaza" } },
    { k: { en: "Scope", tr: "Kapsam" }, v: { en: "Mobile app · storefront · admin panel", tr: "Mobil uygulama · online mağaza · yönetim paneli" } },
  ],
};

export const deepDive: Record<string, DeepSection[]> = {
  dravion: [
    {
      label: { en: "THE HARD PART", tr: "ZOR OLAN KISIM" },
      items: [
        {
          title: { en: "Sandbox isolation.", tr: "Sandbox izolasyonu." },
          body: {
            en: "Terminal commands never run on the host — every worker gets a Docker sandbox with a node-pty shell and no path to another worker's filesystem. Drawing that boundary tightly enough to trust, and loosely enough to be useful, was the hardest problem in the build.",
            tr: "Terminal komutları host'ta hiç çalışmıyor: her worker kendi Docker sandbox'ında, node-pty kabuğuyla ve başka bir worker'ın dosya sistemine hiçbir yol bulamayacak şekilde koşuyor. O sınırı güvenecek kadar sıkı, işe yarayacak kadar gevşek çizmek bu işin en zor kısmıydı.",
          },
          tags: ["node-pty", "Docker"],
        },
        {
          title: { en: "Secret handling.", tr: "Anahtar yönetimi." },
          body: {
            en: "Users bring their own model keys, so the blast radius of a mistake is somebody else's account. Keys are sealed with AES-256-GCM behind a rotatable master key, orchestrator jobs are HMAC-signed, and every read or write is row-scoped to its owner.",
            tr: "Kullanıcılar kendi model anahtarlarını getiriyor; yani bir hatanın bedelini başkasının hesabı ödüyor. Anahtarlar döndürülebilir bir ana anahtarın arkasında AES-256-GCM ile mühürlü, orkestratör işleri HMAC imzalı ve her okuma yazma sahibinin satırıyla sınırlı.",
          },
          tags: ["AES-256-GCM", "HMAC"],
        },
        {
          title: { en: "Orchestration.", tr: "Orkestrasyon." },
          body: {
            en: "Agents are stateless; the truth lives in the queue and the database. Most of the engineering is not the model call — it is what happens when step four fails and steps five and six already assumed it passed.",
            tr: "Ajanlar durumsuz; doğru bilgi kuyrukta ve veritabanında duruyor. İşin mühendislik kısmı model çağrısı değil: dördüncü adım patladığında, beşinci ve altıncı adım onun geçtiğini varsaymışken ne olacağı.",
          },
          tags: ["BullMQ", "Redis"],
        },
      ],
    },
    {
      label: { en: "MEASURABLE AUTONOMY", tr: "ÖLÇÜLEBİLİR OTONOMİ" },
      quote: {
        en: "Autonomy you can't measure is a demo. Autonomy you can measure is a product.",
        tr: "Ölçemediğin otonomi bir demodur. Ölçebildiğin otonomi bir üründür.",
      },
      items: [
        {
          title: { en: "Deterministic replay", tr: "Deterministik yeniden oynatma" },
          body: {
            en: "Every agent turn writes a reproducible record, so a run can be replayed instead of retold.",
            tr: "Her ajan turu yeniden üretilebilir bir kayıt bırakıyor; böylece bir koşu anlatılmak yerine yeniden oynatılıyor.",
          },
        },
        {
          title: { en: "Versioned failure taxonomy", tr: "Sürümlenmiş hata sınıflandırması" },
          body: {
            en: 'Failures carry a category tag, which turns "it broke" into a rate you can watch move.',
            tr: '"Bozuldu" demek yerine her hata bir kategori etiketi taşıyor; böylece izlenebilir bir orana dönüşüyor.',
          },
        },
        {
          title: { en: "Continuous eval gate", tr: "Sürekli eval kapısı" },
          body: {
            en: "Releases pass an automated evaluation before shipping — replay success rate is a release blocker, not a slide.",
            tr: "Sürümler yayına çıkmadan otomatik değerlendirmeden geçiyor: yeniden oynatma başarı oranı bir sunum slaytı değil, sürümü bloklayan bir eşik.",
          },
        },
      ],
      chips: [
        "STRIDE threat model",
        "Append-only audit hash chain",
        "AES-256-GCM at rest",
        "OpenTelemetry tracing",
        "Zod-validated boundaries",
        "Vitest · Playwright · axe-core",
        "TypeScript strict — no any",
      ],
    },
  ],

  xaron: [
    {
      label: { en: "UNDER THE HOOD", tr: "KAPUTUN ALTINDA" },
      items: [
        {
          title: { en: "Encryption — OpenMLS, RFC 9420", tr: "Şifreleme — OpenMLS, RFC 9420" },
          body: {
            en: "Group messaging runs on OpenMLS, the Rust implementation of the IETF Messaging Layer Security standard — not a hand-rolled scheme. Members join and leave constantly in a gaming community, which is exactly the case MLS is built for: forward secrecy and post-compromise security that survive a churning roster.",
            tr: "Grup mesajlaşması, IETF'in Messaging Layer Security standardının Rust uygulaması olan OpenMLS üzerinde çalışıyor; kendi uydurduğumuz bir şema değil. Bir oyun topluluğunda üyeler sürekli girip çıkar — MLS tam bu senaryo için tasarlandı: kadro değişse bile ayakta kalan forward secrecy ve ihlal sonrası güvenlik.",
          },
          tags: ["OpenMLS", "RFC 9420"],
        },
        {
          title: { en: "Transport — WebTransport over QUIC", tr: "Taşıma — QUIC üzerinden WebTransport" },
          body: {
            en: "WebTransport is the only realtime transport — there is no WebSocket fallback, and production refuses to boot without a valid transport certificate. Because the API deliberately sends no cookies, sessions authenticate with a single-use ticket that lives thirty seconds, and clients pin the endpoint's leaf certificate hash.",
            tr: "Tek gerçek zamanlı taşıma WebTransport: WebSocket'e düşme yok ve geçerli bir taşıma sertifikası olmadan production hiç açılmıyor. API bilinçli olarak çerez göndermediği için oturumlar otuz saniye ömürlü, tek kullanımlık biletle doğrulanıyor; istemci de uç noktanın sertifika özetini pinliyor.",
          },
          tags: ["WebTransport", "QUIC"],
        },
        {
          title: { en: "A full Rust stack", tr: "Baştan sona Rust" },
          body: {
            en: "Axum on the server, Leptos compiled to WebAssembly on the client — one language end to end, fifteen workspace crates split by concern. PostgreSQL holds the relational core, ScyllaDB the message firehose, Dragonfly the cache, Meilisearch the index, LiveKit the voice and video rooms.",
            tr: "Sunucuda Axum, istemcide WebAssembly'ye derlenen Leptos — uçtan uca tek dil, sorumluluklarına göre ayrılmış on beş crate. İlişkisel çekirdek PostgreSQL'de, mesaj seli ScyllaDB'de, önbellek Dragonfly'da, arama indeksi Meilisearch'te, ses ve görüntü odaları LiveKit'te.",
          },
        },
      ],
      chips: [
        "xaron-auth",
        "xaron-crypto",
        "xaron-realtime",
        "xaron-media",
        "xaron-search",
        "xaron-security",
        "xaron-db",
        "+ 8 more",
      ],
    },
    {
      label: { en: "HOW THE BAR IS HELD", tr: "ÇITA NASIL KORUNUYOR" },
      items: [
        {
          title: { en: "No panics in production", tr: "Production'da panic yok" },
          body: {
            en: "No unwrap() or expect() outside tests. Errors are values, all the way up.",
            tr: "Testlerin dışında unwrap() ya da expect() kullanılmıyor. Hatalar en tepeye kadar birer değer olarak taşınıyor.",
          },
        },
        {
          title: { en: "Rate limit or no merge", tr: "Rate limit yoksa merge yok" },
          body: {
            en: "Every new endpoint ships with a tiered rate limit. A missing one is a review blocker, not a follow-up ticket.",
            tr: "Her yeni endpoint kademeli bir rate limit ile geliyor. Eksikse review'da takılıyor; sonraya bırakılan bir görev olmuyor.",
          },
        },
        {
          title: { en: "One gate, run on every PR", tr: "Tek kapı, her PR'da" },
          body: {
            en: "fmt, clippy with warnings denied, workspace tests, a WASM build, integration suites and a dependency audit — the same gate locally and in CI.",
            tr: "fmt, uyarıları hata sayan clippy, workspace testleri, WASM build'i, entegrasyon paketleri ve bağımlılık denetimi — yerelde de CI'da da aynı kapı.",
          },
        },
      ],
      chips: ["Playwright E2E", "Load tests — REST + voice", "cargo audit in CI", "Prometheus + Grafana"],
    },
  ],

  sperare: [
    {
      label: { en: "TWO SIDES, ONE SYSTEM", tr: "İKİ TARAF, TEK SİSTEM" },
      items: [],
      columns: [
        {
          title: { en: "For the client", tr: "Danışan için" },
          points: {
            en: [
              "Guided intake maps your case before you pay anyone",
              "Compare verified consultants by country and visa type",
              "Track every milestone, document and appointment in-app",
            ],
            tr: [
              "Rehberli başvuru, kimseye ödeme yapmadan dosyanı çıkarıyor",
              "Doğrulanmış danışmanları ülkeye ve vize tipine göre karşılaştır",
              "Her aşamayı, belgeyi ve randevuyu uygulamadan takip et",
            ],
          },
        },
        {
          title: { en: "For the consultant", tr: "Danışman için" },
          points: {
            en: [
              "A real CRM: pipeline, cases, calendar, team roles",
              "Escrow removes the awkward money conversation",
              "Verified badge turns trust into distribution",
            ],
            tr: [
              "Gerçek bir CRM: pipeline, dosyalar, takvim, ekip rolleri",
              "Escrow o tuhaf para konuşmasını ortadan kaldırıyor",
              "Doğrulanmış rozeti güveni müşteriye dönüştürüyor",
            ],
          },
        },
      ],
    },
    {
      label: { en: "THE HARD PART", tr: "ZOR OLAN KISIM" },
      quote: {
        en: "Immigration data is passports, bank statements and biometrics. Trust is the product, not a feature.",
        tr: "Göçmenlik verisi demek pasaport, banka ekstresi ve biyometri demek. Burada güven bir özellik değil, ürünün kendisi.",
      },
      items: [
        {
          title: { en: "Money that must not half-move.", tr: "Yarım kalmaması gereken para." },
          body: {
            en: "Escrow is the whole product promise, so the state machine is the whole engineering problem. Every transition has to be idempotent and every webhook replay-safe — a transfer that half-completes is worse than one that fails outright. Disputes can freeze the flow at any point without stranding either side.",
            tr: "Ürünün verdiği sözün tamamı escrow, dolayısıyla mühendislik probleminin tamamı da o durum makinesi. Her geçiş idempotent, her webhook tekrar gelse bile güvenli olmak zorunda: yarım kalan bir transfer, hiç olmayan transferden kötüdür. İtirazlar akışı herhangi bir noktada donduruyor ama iki tarafı da ortada bırakmıyor.",
          },
          tags: ["fund → milestone → release", "dispute hold"],
        },
        {
          title: { en: "Row-level security, in practice", tr: "Satır seviyesi güvenlik, pratikte" },
          body: {
            en: "A client can't reach another client's documents or chat; a consultant can't see a case they don't belong to. Enforced in Postgres, not in the app layer — and trust fields stay unwritable from the client entirely.",
            tr: "Bir danışan başka bir danışanın belgelerine ya da sohbetine uzanamıyor; bir danışman kendi dosyası olmayanı göremiyor. Bu kural uygulama katmanında değil Postgres'te uygulanıyor; güven alanları ise istemciden hiç yazılamıyor.",
          },
          tags: ["Postgres RLS", "service-role writes"],
        },
        {
          title: { en: "Erasure that actually erases", tr: "Gerçekten silen silme" },
          body: {
            en: "Tenant isolation, row-level access and crypto-shredding for erasure — designed for KVKK and GDPR from the schema up, not bolted on before launch.",
            tr: "Kiracı izolasyonu, satır seviyesi erişim ve silme için kripto-parçalama. KVKK ve GDPR şemadan itibaren düşünüldü; lansmandan hemen önce üstüne yapıştırılmadı.",
          },
          tags: ["KVKK", "GDPR"],
        },
      ],
    },
  ],

  teck: [
    {
      label: { en: "THE HARD PART", tr: "ZOR OLAN KISIM" },
      items: [
        {
          title: { en: "One stock, two channels.", tr: "Tek stok, iki kanal." },
          body: {
            en: "The shop floor and the web store share one inventory, so a scan at the counter and a checkout online race for the same item. Writes are serialised per variant, which is what keeps the store from selling something it no longer has.",
            tr: "Mağaza ile web mağazası aynı envanteri paylaşıyor; yani kasadaki bir okutma ile online bir sipariş aynı ürün için yarışıyor. Yazmalar varyant bazında sıraya sokuluyor — mağazanın elinde olmayan bir şeyi satmasını engelleyen şey bu.",
          },
        },
        {
          title: { en: "Built for the counter.", tr: "Tezgah için tasarlandı." },
          body: {
            en: "Fast enough for a queue: scan, pick the variant, sell, done. No dedicated terminal, no retraining — the staff already know how to use a phone.",
            tr: "Sıraya yetecek hız: okut, varyantı seç, sat, bitti. Ayrı bir terminal yok, yeniden eğitim yok — personel telefonu nasıl kullanacağını zaten biliyor.",
          },
        },
        {
          title: { en: "Numbers the owner trusts.", tr: "Patronun güvendiği rakam." },
          body: {
            en: "Profit is reported after discounts, returns and per-channel costs — the number you can act on, not the one that looks best. Date-range reports print as the paperwork an accountant expects.",
            tr: "Kâr; iskonto, iade ve kanal maliyetleri düşüldükten sonra raporlanıyor. Yani en güzel görünen rakam değil, aksiyon alınabilecek rakam. Tarih aralıklı raporlar da muhasebecinin beklediği evrak olarak çıkıyor.",
          },
        },
      ],
    },
  ],
};
