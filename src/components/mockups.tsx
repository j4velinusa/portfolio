import type { Lang } from "@/lib/i18n";
import { projects } from "@/content/projects";

/**
 * Product mockups, rendered on the server as plain markup. No client JS, no
 * images — so they cost nothing on the LCP path and stay crisp at any density.
 */

export function DravionTerminal({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  return (
    <div className={`terminal${compact ? " compact" : ""}`}>
      {!compact && (
        <div className="dots">
          <span style={{ background: "#ff5f57" }} />
          <span style={{ background: "#febc2e" }} />
          <span style={{ background: "#28c840" }} />
        </div>
      )}
      <div className="u">you</div>
      <div className="msg">
        {compact
          ? lang === "en"
            ? "Ship rate limiting + tests."
            : "Rate limiting + testleri yayına al."
          : lang === "en"
            ? "Add rate limiting to the API and write tests."
            : "API'ye rate limiting ekle ve testlerini yaz."}
      </div>
      <div className="role" style={{ color: "#d97757" }}>
        manager-agent
      </div>
      <div className="out">
        {lang === "en" ? "Spawning 2 workers…" : "2 worker başlatılıyor…"}
      </div>
      <div className="role" style={{ color: "#e08b6a" }}>
        worker-1
        {!compact && <span style={{ color: "var(--faint)" }}> · docker:sandbox-8f2a</span>}
      </div>
      <div className="out">✓ committed a41c9e</div>
      {!compact && (
        <>
          <div className="role" style={{ color: "#e08b6a" }}>
            worker-2 <span style={{ color: "var(--faint)" }}>· docker:sandbox-c31b</span>
          </div>
          <div className="out">✓ wrote rateLimit.test.ts &nbsp;✓ all green &nbsp;✓ committed 7d02f3</div>
        </>
      )}
    </div>
  );
}

export function XaronStats({ lang }: { lang: Lang }) {
  const stats = projects.find((p) => p.slug === "xaron")!.stats!;
  return (
    <div className="stat-grid">
      {stats.map((s, i) => (
        <div key={s.value} className={`stat${i === 0 ? " lead" : ""}`}>
          <div className="v" style={{ color: "oklch(0.72 0.15 274)" }}>
            {s.value}
          </div>
          <div className="l">{s.label[lang]}</div>
        </div>
      ))}
    </div>
  );
}

export function SperareChecklist({ lang }: { lang: Lang }) {
  const steps: [string, string, boolean][] = [
    ["Consultant matched", "Danışman eşleşti", true],
    ["Payment secured", "Ödeme escrow'da", true],
    ["Visa in review", "Vize incelemede", false],
  ];
  return (
    <div className="checklist">
      {steps.map(([en, tr, done]) => (
        <div key={en} className="row">
          <span className={`tick${done ? " on" : ""}`} aria-hidden="true">
            {done ? "✓" : ""}
          </span>
          <span className={done ? "" : "pending"}>{lang === "en" ? en : tr}</span>
        </div>
      ))}
    </div>
  );
}

export function TeckBarcode({ lang }: { lang: Lang }) {
  const bars = [3, 6, 2, 5, 3, 7, 2, 4, 6, 3, 5, 2];
  return (
    <div className="barcode-card">
      <div className="barcode" aria-hidden="true">
        {bars.map((w, i) => (
          <span key={i} style={{ width: w }} />
        ))}
      </div>
      <div className="code">8690123456789</div>
      <div className="ok">
        {lang === "en" ? "✓ stock −1 · synced everywhere" : "✓ stok −1 · her yerde senkron"}
      </div>
    </div>
  );
}

export function Mockup({ slug, lang, compact }: { slug: string; lang: Lang; compact?: boolean }) {
  switch (slug) {
    case "dravion":
      return <DravionTerminal lang={lang} compact={compact} />;
    case "xaron":
      return <XaronStats lang={lang} />;
    case "sperare":
      return <SperareChecklist lang={lang} />;
    case "teck":
      return <TeckBarcode lang={lang} />;
    default:
      return null;
  }
}
