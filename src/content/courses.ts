import type { Loc } from "@/lib/i18n";

/**
 * Fixed prose for the Riviera Aesthetic course page (/[lang]/courses).
 *
 * Everything here is compiled into the bundle and only changes with a commit.
 * Anything the owner edits from the admin panel — price, CTA label, payment
 * link, images, modules, changelog — lives in content/course.json and is read
 * at build time by src/lib/course.ts. Nothing is duplicated across the two:
 * where a sentence needs a number the owner controls, it is written as a
 * template with a marker (see tocMeta / perks below), the way blog.ts writes
 * its outro.
 *
 * Loc, not Bi: more languages are coming, and Loc turns a missing translation
 * into a type error instead of a silently English page.
 */

/** A figure in the stats band. `value` is monolingual — a number is a number. */
export type CourseStat = { value: string; label: Loc };

/** A card in the "how it works" grid. `no` is the printed ordinal, not an index. */
export type CourseStep = { no: string; title: Loc; body: Loc };

/** One always-open question. Both sides render; there is no accordion. */
export type CourseFaq = { id: string; q: Loc; a: Loc };

export type CourseMeta = { title: Loc; description: Loc };

export type CourseNavCopy = {
  gallery: Loc;
  curriculum: Loc;
  who: Loc;
  faq: Loc;
  /** The label shows the language you would switch TO, so it is deliberately
   *  inverted: reading Turkish, the button says EN. */
  langLabel: Loc;
};

export type CourseHeroCopy = {
  eyebrow: Loc;
  line1: Loc;
  line2: Loc;
  sub: Loc;
  /** The secondary link only scrolls to #curriculum. The primary CTA label is
   *  owner-editable and comes from content/course.json (ctaLabel). */
  ctaSecondary: Loc;
};

export type CourseThesisCopy = { title: Loc; p1: Loc; p2: Loc; pullQuote: Loc };

export type CourseCurriculumCopy = {
  label: Loc;
  /** Markers: {modules} and {lessons}. Fill them from content/course.json —
   *  modules.length and the sum of modules[].lessons — so an owner edit can
   *  never leave this line contradicting the list right underneath it. */
  meta: Loc;
};

export type CourseHowCopy = { label: Loc; title: Loc; steps: CourseStep[] };

export type CourseGalleryCopy = { label: Loc; title: Loc; sub: Loc };

export type CourseWhoCopy = {
  forLabel: Loc;
  forList: Loc<string[]>;
  notForLabel: Loc;
  notForList: Loc<string[]>;
};

export type CourseChangelogCopy = { label: Loc; title: Loc; note: Loc };

export type CourseBuyCopy = {
  label: Loc;
  sub: Loc;
  /** perks[0] carries the {modules}/{lessons} markers, same contract as
   *  curriculum.meta. The other two are plain sentences. */
  perks: Loc<string[]>;
  /** Shown under the CTA when content/course.json has no paymentLink, so the
   *  button falls back to mailto. */
  mailtoNote: Loc;
};

export type CourseInstructorCopy = {
  label: Loc;
  /** Not translated — it is a person's name. */
  name: string;
  bio: Loc;
  link: Loc;
  photoAlt: Loc;
};

export type CourseFooterCopy = {
  /** Back to the portfolio, i.e. /[lang]. The email address is not repeated
   *  here — take it from site.links.email. */
  backLink: Loc;
};

export type CourseCopy = {
  /** The course brand. "Riviera Aesthetic" is the course; "Doğan Aykaç" is the
   *  person, and only appears in the instructor block and the back links. */
  brand: string;
  meta: CourseMeta;
  nav: CourseNavCopy;
  hero: CourseHeroCopy;
  stats: CourseStat[];
  thesis: CourseThesisCopy;
  curriculum: CourseCurriculumCopy;
  how: CourseHowCopy;
  gallery: CourseGalleryCopy;
  who: CourseWhoCopy;
  changelog: CourseChangelogCopy;
  buy: CourseBuyCopy;
  instructor: CourseInstructorCopy;
  faqLabel: Loc;
  faqs: CourseFaq[];
  footer: CourseFooterCopy;
};

export const courseCopy: CourseCopy = {
  brand: "Riviera Aesthetic",

  meta: {
    title: {
      en: "Riviera Aesthetic — art direction with AI",
      tr: "Riviera Aesthetic — yapay zekâ ile sanat yönetmenliği",
    },
    description: {
      en: "A course on using AI as a tool for magazine, campaign and interface work. 28 lessons, new ones every month.",
      tr: "Dergi, kampanya ve arayüz işleri için yapay zekâyı bir araç gibi kullanmayı öğreten kurs. 28 ders, her ay yenisi.",
    },
  },

  nav: {
    gallery: { en: "Gallery", tr: "Galeri" },
    curriculum: { en: "Curriculum", tr: "Müfredat" },
    who: { en: "Who it's for", tr: "Kime göre" },
    faq: { en: "FAQ", tr: "SSS" },
    langLabel: { en: "TR", tr: "EN" },
  },

  hero: {
    eyebrow: { en: "Art direction with AI", tr: "Yapay zekâ ile sanat yönetmenliği" },
    line1: { en: "None of this", tr: "Bunların hiçbiri" },
    line2: { en: "is a template.", tr: "şablon değil." },
    sub: {
      en: "Everyone has the same tools now. The difference is reading a reference, choosing a palette, and building a publication end to end.",
      tr: "Aynı araçlar herkeste var. Fark, referansı okuyabilmek, paleti seçebilmek ve bir yayını baştan sona kurabilmekte.",
    },
    ctaSecondary: { en: "See the curriculum ↓", tr: "Müfredatı gör ↓" },
  },

  // The first two figures are also derivable from content/course.json. Prefer
  // the derived numbers when rendering; these are the seed values.
  stats: [
    { value: "28", label: { en: "lessons", tr: "ders" } },
    { value: "4", label: { en: "modules", tr: "modül" } },
    { value: "12", label: { en: "page publication", tr: "sayfa yayın projesi" } },
    { value: "∞", label: { en: "unlimited access", tr: "sınırsız erişim" } },
  ],

  thesis: {
    title: {
      en: "Most AI output looks the same. The reason isn't the model — it's the missing direction.",
      tr: "Çoğu yapay zekâ çıktısı birbirine benziyor. Sebebi model değil, yön eksikliği.",
    },
    p1: {
      en: 'The tooling problem is solved. Everyone reaches the same models through the same interfaces, and most of what comes out is interchangeable. Because the question is always the same: "make me something beautiful."',
      tr: 'Araç tarafı çözüldü. Bugün herkes aynı modellere, aynı arayüzlere erişiyor — ve ortaya çıkan işlerin büyük kısmı birbirinin aynısı. Çünkü sorulan soru hep aynı: "bana güzel bir görsel yap."',
    },
    p2: {
      en: "An art director doesn't ask that. They read the reference, choose the palette, describe the light, build the composition, and place the result inside a publication. This course trains that muscle — the part that survives the next tool.",
      tr: "Bir sanat yönetmeni öyle sormuyor. Referansı okuyor, paleti seçiyor, ışığı tarif ediyor, kompozisyonu kuruyor, ve çıktıyı bir yayının içine oturtuyor. Bu kurs o kası çalıştırıyor — araç değişse de kalan kısmı.",
    },
    pullQuote: {
      en: "Writing prompts isn't the skill. Knowing what to ask for is.",
      tr: "Prompt yazmak beceri değil. Ne isteyeceğini bilmek beceri.",
    },
  },

  curriculum: {
    label: { en: "Contents", tr: "İçindekiler" },
    meta: {
      en: "{modules} modules · {lessons} lessons · new ones every month",
      tr: "{modules} modül · {lessons} ders · her ay yenisi ekleniyor",
    },
  },

  how: {
    label: { en: "How it works", tr: "Nasıl işliyor" },
    title: {
      en: "You don't just watch. Every lesson ends with something you made.",
      tr: "Video izleyip bitirmiyorsun. Her ders bir çıktıyla kapanıyor.",
    },
    steps: [
      {
        no: "01",
        title: { en: "Video, at your pace", tr: "Kendi hızında video" },
        body: {
          en: "Lessons run 12–18 minutes. Any time, in any order.",
          tr: "Ortalama 12–18 dakikalık dersler. İstediğin zaman, istediğin sırayla.",
        },
      },
      {
        no: "02",
        title: { en: "Every lesson is a brief", tr: "Her ders bir brief" },
        body: {
          en: "You finish with an output in hand — not a watched video.",
          tr: "Ders bittiğinde elinde bir çıktı oluyor — izlenmiş bir video değil.",
        },
      },
      {
        no: "03",
        title: { en: "Files included", tr: "Dosyalar dahil" },
        body: {
          en: "Reference sets, grid templates and briefs, all downloadable.",
          tr: "Referans setleri, ızgara şablonları ve briefler indirilebilir.",
        },
      },
      {
        no: "04",
        title: { en: "Access while subscribed", tr: "Abonelikle erişim" },
        body: {
          en: "The whole archive stays open. A new chapter lands every month.",
          tr: "Abone olduğun sürece bütün arşiv açık. Her ay yeni bölüm ekleniyor.",
        },
      },
    ],
  },

  // HONESTY NOTE — the comp labels this section "Kursta üretilen işler" /
  // "Work made in the course". The images shipping today are inspiration
  // references, not course output, so the section is named for what it
  // actually shows. Restore the comp's original label (and a sub line about
  // the work being made with AI) once real course output replaces the
  // placeholders in content/course.json.
  gallery: {
    label: { en: "Gallery", tr: "Galeri" },
    title: { en: "Reference and inspiration", tr: "Referans ve ilham" },
    sub: {
      en: "The references we take apart in the lessons. Course output replaces them here as it is finished.",
      tr: "Derslerde parçalarına ayırdığımız referanslar. Kurs çıktıları hazır oldukça burayı onlar dolduracak.",
    },
  },

  who: {
    forLabel: { en: "Who it's for", tr: "Kime göre" },
    forList: {
      en: [
        "Designers adding AI to their workflow",
        "Marketers who want to make their own visuals",
        "Founders without an agency budget",
        "Content creators looking for a consistent visual language",
        "Engineers whose design side lags behind",
        "Complete beginners — no prerequisites",
      ],
      tr: [
        "Yapay zekâyı iş akışına katmak isteyen tasarımcılar",
        "Kendi görselini üretmek isteyen pazarlamacılar",
        "Ajans bütçesi olmayan girişimciler",
        "Tutarlı bir görsel dil arayan içerik üreticileri",
        "Tasarım tarafı zayıf kalan yazılımcılar",
        "Sıfırdan başlayanlar — ön koşul yok",
      ],
    },
    notForLabel: { en: "Who it's not for", tr: "Kime göre değil" },
    notForList: {
      en: [
        "Anyone looking for one-click templates",
        "Anyone who just wants a prompt list",
        "Anyone unwilling to spend time on taste",
      ],
      tr: [
        "Tek tıkla hazır şablon arayanlar",
        "Sadece prompt listesi isteyenler",
        "Estetiğe zaman ayırmak istemeyenler",
      ],
    },
  },

  changelog: {
    label: { en: "The archive grows", tr: "Arşiv büyüyor" },
    title: { en: "Added this month", tr: "Bu ay eklenenler" },
    note: {
      en: "New chapter monthly · price stays the same",
      tr: "Her ay yeni bölüm · fiyat değişmiyor",
    },
  },

  buy: {
    label: { en: "Monthly · unlimited access", tr: "Aylık abonelik · sınırsız erişim" },
    sub: {
      en: "Unlimited access to every lesson while you're subscribed. New content lands every month at the same price. Cancel anytime.",
      tr: "Ay boyunca her derse sınırsız eriş. Her ay yeni içerik ekleniyor — fiyat değişmiyor. İstediğin zaman iptal et.",
    },
    perks: {
      en: ["{lessons} lessons · {modules} modules", "New lessons monthly", "No commitment · no refunds"],
      tr: ["{lessons} ders · {modules} modül", "Her ay yeni dersler", "Taahhüt yok · iade yok"],
    },
    mailtoNote: {
      en: "Write to me and I'll send the payment details.",
      tr: "Yaz, ödeme bilgilerini göndereyim.",
    },
  },

  instructor: {
    label: { en: "Instructor", tr: "Eğitmen" },
    name: "Doğan Aykaç",
    bio: {
      // The comp said "six years", which is the framing the live site moved
      // off. site.ts is canonical: twelve writing code, six of them in the
      // industry. A visitor arriving from the home page reads both numbers
      // within one click, so they have to agree.
      en: "Twelve years writing code, six of them in the industry — agent platforms, encrypted messaging, payment infrastructure. This course is how I direct the visual side of that work with AI: as a tool, with the direction staying human.",
      tr: "On iki yıldır kod yazıyorum, altı yılı sektörde — ajan platformları, şifreli iletişim, ödeme altyapısı. Bu kurs, o ürünlerin görsel tarafını kurarken yapay zekâyı nasıl kullandığımın anlatımı: bir araç olarak, yön hep insanda kalarak.",
    },
    link: { en: "See the portfolio →", tr: "Portfolyoyu gör →" },
    photoAlt: { en: "Doğan Aykaç", tr: "Doğan Aykaç" },
  },

  faqLabel: { en: "Frequently asked", tr: "Sık sorulanlar" },

  // The cancellation and commercial-use answers are the terms of the offer.
  // Edit them like contract text, not like copy.
  faqs: [
    {
      id: "tools",
      q: { en: "Which tools do we use?", tr: "Hangi araçları kullanıyoruz?" },
      a: {
        en: "The course is tool-agnostic. Lessons are built on visual decisions, so the method holds whichever model you use. I show my own tools, but the course doesn't depend on them.",
        tr: "Araç bağımsız anlatıyorum. Dersler görsel karar üzerine kurulu; hangi modeli kullanırsan kullan, aynı yöntem çalışıyor. Kullandığım araçlar derslerde gösteriliyor ama ders onlara bağlı değil.",
      },
    },
    {
      id: "no-design-background",
      q: {
        en: "I have no design background — is that ok?",
        tr: "Tasarım geçmişim yok, olur mu?",
      },
      a: {
        en: "Yes. Module 01 exists for exactly that: composition, palette and light from zero. It's the module engineers and marketers get the most out of.",
        tr: "Olur. Modül 01 tam da bunun için var — kompozisyon, palet ve ışığı sıfırdan kuruyoruz. Yazılımcıların ve pazarlamacıların en çok fayda gördüğü modül orası.",
      },
    },
    {
      id: "subscription",
      q: { en: "How does the subscription work?", tr: "Aylık abonelik nasıl işliyor?" },
      a: {
        en: "₺1,000 a month. While subscribed you get unlimited access to every lesson, and new content is added each month. Cancel any month — no commitment.",
        tr: "Ayda ₺1.000. Abone olduğun sürece bütün derslere sınırsız erişimin var ve her ay yeni içerik ekleniyor. İstediğin ay iptal edebilirsin; taahhüt yok.",
      },
    },
    {
      id: "how-long",
      q: { en: "How long does it take?", tr: "Ne kadar sürede bitiyor?" },
      a: {
        en: "At your own pace. The current curriculum takes about four weeks — but the archive grows monthly, which is why most people stay subscribed.",
        tr: "Kendi hızında. Mevcut müfredat ortalama dört haftada bitiyor — ama arşiv her ay büyüdüğü için çoğu kişi abone kalmayı tercih ediyor.",
      },
    },
    {
      id: "commercial-use",
      q: {
        en: "Can I use the output commercially?",
        tr: "Çıktıları ticari olarak kullanabilir miyim?",
      },
      a: {
        en: "The work you make is yours. Your model's license terms apply; I cover what to watch for with each one in a dedicated lesson.",
        tr: "Kursta ürettiğin işler senin. Kullandığın modelin lisans koşulları geçerli; hangi modelde neye dikkat etmen gerektiğini derslerde ayrıca anlatıyorum.",
      },
    },
    {
      id: "cancel",
      q: { en: "What happens if I cancel?", tr: "İptal edersem ne oluyor?" },
      a: {
        en: "Access runs to the end of your billing period, then stops. Digital content isn't refundable — which is also why there's no commitment: try a month, don't renew if it isn't for you.",
        tr: "Dönem sonuna kadar erişimin devam ediyor, sonra kapanıyor. Dijital içerik olduğu için iade yok — bu yüzden taahhüt de yok: bir ay dene, devam etmek istemezsen yenileme.",
      },
    },
  ],

  footer: {
    backLink: { en: "← Doğan Aykaç", tr: "← Doğan Aykaç" },
  },
};
