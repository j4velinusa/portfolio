# SEO + Performans Planı

Kaynak: 13 boyutlu araştırma (8 SEO + 5 performans), resmi dokümanlar üzerinden, 26 iddia
çürütme turundan geçirildi (18'i "abartılı" çıkıp düzeltildi). Ölçümler bu repoda gerçek
`next build` çıktısı ve dosya boyutlarından alındı. Tarih: 2026-07-26.

---

## 1. Nerede duruyoruz

| Ölçüm | Değer | Not |
|---|---|---|
| Route sayısı | 5 statik (`/`, 4× `/work/*`) | hepsi prerender ✓ |
| Toplam client JS | ~685 KB (`.next/static`) | en büyük chunk 221 KB |
| `public/` ağırlığı | 5.3 MB → **1 MB** | 4 MB kullanılmayan avatar silindi |
| En büyük görsel | `dogan.png` 381 KB / 800×800 | hero fotoğrafı |
| `use client` | `page.tsx`, `view.tsx`, `Nav`, `Reveal`, `i18n` | **sayfa kökünde** |
| Sayfaya özel metadata | sadece `/work/[slug]` | anasayfada **yok** |
| sitemap / robots / JSON-LD / OG | **hiçbiri yok** | — |
| font subset | `["latin"]` | Türkçe glifler preload edilmiyor |

**Özet:** Site şu an **yalnızca İngilizce** indekslenebilir. Türkçe içerik Google için
mevcut değil. Tek en büyük mimari sorun: **dil URL'de değil** — `src/lib/i18n.tsx`
localStorage + React state kullanıyor, dolayısıyla Türkçe sürümün adresi yok.

---

## 2. Mimari karar: iki dilli URL yapısı

**Karar: locale alt dizini + `[lang]` segmenti.** `/en/...` ve `/tr/...`, kök `/` → `/en`.

Google'ın kendi tavsiyesi bu: *"We recommend using separate locale URL configurations and
annotating them with `rel="alternate" hreflang"`*. Sebep, Googlebot'un neden başka türlü
göremediği: **Accept-Language başlığı göndermez**, ağırlıkla ABD IP'lerinden gezer ve
render servisi **stateless** — *"Local Storage and Session Storage are cleared across page
loads"*. Yani çerez/localStorage ile dil seçimi crawler için hiç çalışmaz.

### Hedef dosya ağacı

```
src/app/
  [lang]/
    layout.tsx          ← KÖK layout burada; <html lang={lang}>
    page.tsx            ← anasayfa (Server Component)
    work/page.tsx       ← yeni tasarımdaki Work sayfası
    about/page.tsx
    stack/page.tsx
    work/[slug]/page.tsx
  robots.ts
  sitemap.ts
next.config.ts          ← redirects(): '/' → '/en'
```

`app/layout.tsx` kaldırılır; kök layout `app/[lang]/layout.tsx` olur (App Router'da
`<html>`/`<body>` kök layout'ta olmak zorunda, `lang`'ı da ancak böyle locale'e
bağlayabiliyoruz).

**Kök yönlendirme `next.config.ts` `redirects()` ile yapılır** — middleware/proxy'ye gerek
yok. Önemli: yönlendirme **sabit** olmalı (her zaman `/en`), Accept-Language veya IP'ye
göre DEĞİL. Google net: *"Avoid automatically redirecting users from one language version
of a site to a different language version"* ve *"Don't use IP analysis to adapt your
content."*

### Dil değiştirici

`src/components/Nav.tsx` içindeki EN/TR düğmesi **gerçek `<a href>` linkine** dönüşür:
`/en/work` ↔ `/tr/work`. Şu anki `onClick`+state yaklaşımı crawler için görünmez —
*"Google can only crawl your link if it's an `<a>` HTML element with an href attribute."*

`localStorage` tamamen atılmaz ama rolü değişir: artık **içeriği belirlemez**, sadece
kullanıcının son tercihini hatırlayıp kök `/`'a gelindiğinde tercih edilen locale'e
yönlendirmek için *client-side* kullanılabilir (opsiyonel, P2).

### hreflang

Her sayfada `generateMetadata` ile:

```ts
alternates: {
  canonical: `https://doganaykac.com/${lang}${path}`,
  languages: {
    en: `https://doganaykac.com/en${path}`,
    tr: `https://doganaykac.com/tr${path}`,
    'x-default': `https://doganaykac.com/en${path}`,
  },
}
```

Kurallar: hreflang **karşılıklı** olmalı (her sürüm diğerini işaret eder), canonical
**kendi locale'ini** göstermeli (hepsini İngilizceye yönlendirmek yaygın ve ölümcül bir
hata), ve robots direktifleri **tüm locale'lerde aynı** olmalı.

### Göç maliyeti — dürüst tahmin

Orta. Mevcut içerik katmanı (`src/content/site.ts`, `projects.ts`) `{en, tr}` çiftleri
olarak zaten hazır, o yüzden **metinler yeniden yazılmayacak**. Yapılacak iş: dosyaları
`[lang]/` altına taşımak, `useLang()` yerine `params.lang` kullanmak, `Nav`'ı link tabanlı
yapmak ve sayfaları Server Component'e çevirmek. Yeni tasarım zaten Work/About/Stack
sayfalarını ekliyor — ikisini **aynı geçişte** yapmak mantıklı, iki kez elden geçirmeyelim.

---

## 3. P0 — indekslenmeyi engelleyen / Türkçeyi öldüren

1. **Locale'i URL'e taşı** (yukarıdaki ağaç). Bu tek başına Türkçenin indekslenmesini açar.
2. **Sayfa kökünden `use client`'ı kaldır.** `src/app/page.tsx:1` ve
   `src/app/work/[slug]/view.tsx:1` şu an client. Doğru bölünme:

   ```tsx
   // src/app/[lang]/page.tsx  — Server Component, "use client" YOK
   export async function generateMetadata({ params }) { /* hreflang + canonical */ }

   export default async function Home({ params }) {
     const { lang } = await params;
     return <>
       <Nav lang={lang} />          {/* client: sadece dil linkleri + menü */}
       <Hero lang={lang} />         {/* server: düz HTML */}
       <Reveal />                   {/* client: yalnız animasyon kancası */}
     </>;
   }
   ```

   > **Düzeltme (çürütme turundan):** `"use client"` içeriği sunucu HTML'inden
   > *silmez* — client component'ler de prerender edilir, metinler HTML'de vardır (curl ile
   > doğruladım). Gerçek zararı ikisi: (a) o dosyadan `metadata`/`generateMetadata`
   > **export edilemez** — ve bu sessizce değil, **build hatası** olarak patlar; (b) dosya
   > ve tüm import ettikleri client bundle'ına girer, JS büyür.

3. **Dil değiştiriciyi `<a href>` yap** (bkz. §2).
4. **`<html lang>`'i locale'e bağla** — `[lang]/layout.tsx` içinde. Bu sadece SEO değil:
   `text-transform: uppercase` Türkçede `lang="tr"` olmadan **yanlış harf** üretir (i → I
   yerine İ).
5. **Her sayfaya kendi title/description'ı** — anasayfanın şu an hiç yok, layout'tan
   miras alıyor.

---

## 4. P1 — trafik ve görünüm kaybı

| # | İş | Dosya |
|---|---|---|
| 1 | `sitemap.ts` — 8 sayfa × 2 locale, her girdide `alternates.languages` | `src/app/sitemap.ts` |
| 2 | `robots.ts` — `allow: /`, sitemap adresi | `src/app/robots.ts` |
| 3 | JSON-LD: `Person` + `ProfilePage` (anasayfa), proje sayfalarında `CreativeWork` | `[lang]/layout.tsx` / sayfa içi `<script type="application/ld+json">` |
| 4 | OG/Twitter görselleri — `opengraph-image.tsx` dosya konvansiyonu | `src/app/[lang]/opengraph-image.tsx` |
| 5 | **font: `subsets: ["latin", "latin-ext"]`** | `[lang]/layout.tsx` |
| 6 | `images.formats = ['image/avif','image/webp']` | `next.config.ts` |

**Font detayı (ölçtüm):** Türkçenin ihtiyaç duyduğu 5 glif — **ğ Ğ ş Ş İ** — Google
Fonts'un `latin` subset'inde yok, `latin-ext`'te. Ama Next 16'da `subsets` yalnızca
**hangi dosyanın preload edileceğini** belirler; üretilen CSS'te 5 `@font-face` bloğu ve
`unicode-range`'ler zaten var (doğruladım). Yani Türkçe harfler Arial'a **düşmüyor** —
sadece `latin-ext` dosyası geç keşfedilip **sonradan takla atıyor**. `latin-ext` eklemek bu
göz kırpmasını bitirir.

Ayrıca `adjustFontFallback` **default `true` kalsın** (metrik-eşli fallback CLS'i keser) ve
body/başlıklarda **açık `line-height`** verilsin: Safari `size-adjust` destekliyor ama
`ascent-override`/`descent-override` desteklemiyor, yarım eşleşme kayma bırakıyor.

---

## 5. Performans planı

### 5a. Açılış hızı

- 8 route'un **tamamı Server Component + request-time veri yok** → hepsi statik prerender.
  `next build` çıktısında doğrula.
- **`use client` yalnız yaprakta.** Yukarıdaki tersine-çevirme deseni: sayfa server kalır,
  etkileşim aşağıya iner.
- Hero görselinde `priority` (lazy **değil**); alt kısımdaki ekran görüntülerinde lazy.
- Hero'yu CSS `background-image` ile boyamayın — LCP keşfini geciktirir.
- Bütçe: **LCP ≤ 2.5s**, TTFB ≤ 0.8s. LCP içinde TTFB payı ~%40.

### 5b. Animasyonlar

**Reveal-on-scroll:** CSS `animation-timeline: view()`. Compositor'da çalışır, main thread
meşgulken bile akar. Destek: Chrome/Edge 115+, Safari 26+, **Firefox stable'da kapalı** →
küresel ~%83.7. Bu yüzden **progressive enhancement zorunlu**:

```css
/* içerik varsayılan olarak GÖRÜNÜR (zaten böyle kurduk — js-ready deseni) */
@supports (animation-timeline: view()) {
  .reveal { animation: reveal linear both; animation-timeline: view(); }
}
```

> Not: Safari 26.0–26.3 bu animasyonları **main thread'de** çalıştırdı; compositor'a ancak
> **26.4 (24 Mart 2026)** ile taşındı. Yani "her yerde bedava" değil.

**Parallax:** `animation-timeline: scroll(root block)`, sadece `transform`. Scroll event
listener (rAF ile bile) kullanma.

**Keyframe'lerde yalnızca `opacity` ve `transform`.** Scroll timeline pahalı bir property'yi
ucuzlatmaz — `width`, `top`, `filter`, `backdrop-filter` scrub edilmez.

**Tasarımdaki pahalı üç şey — karar:**

| Öğe | Karar | Gerekçe |
|---|---|---|
| Sticky nav `backdrop-filter: blur(20px)` | **Kal, ama animasyonlanmasın** | Statik blur kabul edilebilir; scroll'da başka property değiştirmeyin. Düşük cihazda jank görülürse 12px'e indir veya `rgba` düz zemine geç. |
| Hero fotoda `filter: grayscale(1)` | **Kaldır — görseli önceden gri yap** | Runtime filtre her boyamada bedel; dosyada gri kaydetmek bedava. |
| Gradyan başlık (`background-clip:text`) | **Kal** | Statik, animasyonlanmıyor, bedeli yok. |

`prefers-reduced-motion: reduce` zorunlu — hâlihazırda `globals.css`'te var, korunacak.

### 5c. Sayfa geçişleri

- **Same-document View Transitions** bu site için doğru mekanizma. Durum: **Baseline
  "newly available" (Ekim 2025)**, ~%88.5 küresel (Chrome 111+, Safari 18+, Firefox 144+).
- **Cross-document (`@view-transition { navigation: auto }`) KULLANMA** — `<Link>` gerçek
  doküman navigasyonu yapmadığı için hiç ateşlenmez. Bu yaygın bir yanılgı.
- React'ın `<ViewTransition>` bileşeni **stable React 19'da yok** (canary/experimental).
  Next 16'da `experimental.viewTransition: true` var ama **hâlâ experimental**.
- **Öneri:** İlk aşamada geçiş efekti şart değil — 8 sayfa tamamen statik, `<Link>`
  prefetch'i ile navigasyon zaten anında. **`loading.tsx` EKLEMEYİN** (statik route'a
  gereksiz, tersine yavaş hissettirir). View Transitions'ı **cila aşamasında**, deneysel
  bayrağın farkında olarak ekleyelim.
- Eklerken: sticky nav'ı geçişin dışında tut (`view-transition-name: site-header` +
  `::view-transition-group(site-header){animation:none}`), yoksa nav her geçişte titrer.

### 5d. Medya diyeti

| Asset | Şimdi | Hedef |
|---|---|---|
| Xaron avatarları (yeni tasarımda kullanılıyor) | 1024×1024, 518–812 KB ×6 | **96×96 WebP/AVIF, <10 KB** — 40px'de gösteriliyor |
| `dogan.png` | 800×800, 381 KB | ~600px, gri, WebP → hedef <80 KB |
| AREL ekranları | 720×540, 80–132 KB | ✓ uygun, dokunma |
| Sperare ekranları | 924×540, 18–35 KB | ✓ uygun |

`next/image` + `formats: ['image/avif','image/webp']` çoğunu otomatik çözer; yine de
kaynak dosyayı gösterim boyutuna indirmek şart (optimizer 1024px'i 40px'e indirse bile
kaynağı sen taşıyorsun).

**Video:** Yeni tasarımda `<video>` etiketleri var (Home 2, Work 1, Xaron 1) ama
**zip'te video dosyası yok** — kaynaklar boş/placeholder. Video eklenirse: `poster` şart,
`preload="none"`, `autoplay muted loop playsinline`, ve viewport'a girene kadar
yükletilmemeli. Video **LCP elemanı olabilir** (poster veya ilk kare).

### 5e. Hosting

**Vercel + varsayılan output** (`output: 'export'` **değil**).

> **Düzeltme (çürütme turundan):** "static export daha hızlı" bir mit — tamamen prerender
> edilmiş HTML her iki modda **aynı**. Fark hızda değil, **kaybettiğin yeteneklerde**:
> `output: 'export'` ile `next/image` optimizer, `redirects()`, `headers()` ve middleware
> gider. Bizim planımız bunların üçünü kullanıyor (kök yönlendirme + görsel optimizasyonu),
> o yüzden export uygun değil.

Hashlenmiş `/_next/static/` için Next zaten immutable cache header'ı basıyor — elle kural
yazma. Vercel önünde **Cloudflare orange-cloud açma** (çift proxy, zarar veriyor).

---

## 6. Bütçe ve ölçüm

| Metrik | Hedef |
|---|---|
| LCP (p75) | ≤ 2.5 s |
| INP (p75) | ≤ 200 ms |
| CLS (p75) | ≤ 0.1 |
| TTFB | ≤ 0.8 s |
| Toplam client JS | ≤ 200 KB / route |
| En büyük görsel | ≤ 150 KB |
| Sayfa ağırlığı | ≤ 1 MB |

Ölçüm komutları:

```bash
cd ~/Documents/portfolio && npm run build          # route başına JS
npx next start -p 3020                              # prod sunucu
curl -s -o /dev/null -w "ttfb=%{time_starttransfer} total=%{time_total} size=%{size_download}\n" http://localhost:3020/en
du -sh public && find public -size +150k            # asset denetimi
```

Alan verisi (CrUX) ancak gerçek trafikle gelir; yeni domainde başta yalnız lab verisi olur.

---

## 7. Deploy ve indeksleme kontrol listesi

1. `doganaykac.com`'u Vercel'e bağla, HTTPS doğrula.
2. Search Console'da **Domain property** aç, **DNS TXT** ile doğrula (tüm alt alan
   adlarını ve protokolleri kapsar).
3. `sitemap.xml`'i Search Console'dan gönder. **Sitemap ping endpoint'i 2023'te kaldırıldı**
   — eski blogların önerdiği `google.com/ping?sitemap=` artık yok.
4. URL Inspection ile `/en` ve `/tr`'yi tek tek "Request indexing" yap (günlük kotalı).
5. Preview (`*.vercel.app`) URL'lerini doğrulama/sitemap için kullanma; canonical
   production host üzerinden çalış.
6. `X-Robots-Tag: noindex` header'ı ve `<meta robots noindex>` kalıntısı olmadığını
   production yanıtında doğrula.
7. **Gerçekçi beklenti:** sıfır backlink'li yeni bir domainde indeksleme günler–haftalar
   sürer. GitHub profilinden ve LinkedIn'den link vermek keşfi hızlandırır.

---

## 8. Boşa kürek çekmeyin — çürütülen iddialar

| İddia | Gerçek |
|---|---|
| "Tek URL'de iki dil = kesin indekslenmez" | **Abartılı.** Google bunu *belgelenmiş keşif riski* olarak tanımlıyor, garanti başarısızlık olarak değil ("might not find"). Ama **bizim durumumuzda pratik sonuç aynı**: Türkçenin hiç URL'i yok, dolayısıyla indekslenemez. |
| "`use client` içeriği HTML'den siler" | **Yanlış.** Client component'ler de prerender edilir; metin HTML'de. Zarar: metadata export edilemez + JS büyür. |
| "Client sayfada metadata sessizce kaybolur" | **Abartılı.** Sessiz değil, **build hatası** verir. |
| "static export daha hızlıdır" | **Mit.** Prerender HTML aynı; export sadece yetenek kaybettirir. |
| "`subsets:['latin']` Türkçe harfleri bozar" | **Abartılı.** Glifler CSS'te var, Arial'a düşmüyor; sadece preload edilmiyor → geç takla. |
| "Sitemap'i Google'a ping'le" | **Kaldırıldı** (2023). Search Console'dan gönder. |
| "Mobil uyumluluk ayrı bir iş" | Mobile-first indeksleme **5 Temmuz 2024'te %100 tamamlandı** — mobil render *tek* referans. |
| "Scroll-driven animasyonlar her yerde compositor'da" | Safari'de **26.4'e (Mart 2026)** kadar main thread'deydi. |

---

## 9. Kaynaklar

Karar veren birincil kaynaklar: `developers.google.com/search/docs` (Search Essentials,
crawling/indexing, JavaScript SEO, international/localized versions, structured data),
`nextjs.org/docs` (App Router: Metadata API, `generateMetadata`, sitemap/robots, next/font,
static export sınırları, `experimental.viewTransition`), `web.dev` (Core Web Vitals, LCP
optimizasyonu), `developer.mozilla.org` + `caniuse.com` (View Transitions ve
scroll-driven animations destek verisi, Temmuz 2026), `webkit.org` (Safari 26.4 sürüm notu).
