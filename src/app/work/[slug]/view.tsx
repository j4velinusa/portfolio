"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/i18n";
import { site } from "@/content/site";
import type { Project } from "@/content/projects";
import { Nav } from "@/components/Nav";
import { RevealProvider } from "@/components/Reveal";

function DravionTerminal() {
  const { lang } = useLang();
  return (
    <div className="terminal reveal">
      <div className="dots">
        <span style={{ background: "#ff5f57" }} />
        <span style={{ background: "#febc2e" }} />
        <span style={{ background: "#28c840" }} />
      </div>
      <div className="u">you</div>
      <div className="msg">
        {lang === "en" ? "Add rate limiting to the API and write tests." : "API'ye rate limiting ekle ve testlerini yaz."}
      </div>
      <div className="role" style={{ color: "#ff9500" }}>
        manager-agent
      </div>
      <div className="out">
        {lang === "en"
          ? "Plan ready. Spawning 2 workers in isolated sandboxes…"
          : "Plan hazır. İzole sandbox'larda 2 worker başlatılıyor…"}
      </div>
      <div className="role" style={{ color: "#ffb340", marginTop: 14 }}>
        worker-1 <span style={{ color: "var(--faint)" }}>· docker:sandbox-8f2a</span>
      </div>
      <div className="out">✓ wrote middleware/rateLimit.ts &nbsp;✓ ran 14 tests &nbsp;✓ committed a41c9e</div>
      <div className="role" style={{ color: "#ffb340", marginTop: 2 }}>
        worker-2 <span style={{ color: "var(--faint)" }}>· docker:sandbox-c31b</span>
      </div>
      <div className="out">✓ wrote rateLimit.test.ts &nbsp;✓ all green &nbsp;✓ committed 7d02f3</div>
    </div>
  );
}

function TeckPhone() {
  const { lang } = useLang();
  const bars = [3, 6, 2, 5, 3, 7, 2, 4, 6, 3];
  return (
    <div className="phone reveal">
      <div className="notch" />
      <div className="barcode">
        {bars.map((w, i) => (
          <span key={i} style={{ width: w, height: "100%" }} />
        ))}
      </div>
      <div className="code">8690123456789</div>
      <div className="row">
        <div className="p">{lang === "en" ? "Sneaker X — size 42" : "Sneaker X — 42 numara"}</div>
        <div className="ok">
          {lang === "en" ? "✓ stock −1 · synced to 3 stores + online" : "✓ stok −1 · 3 mağaza + online senkron"}
        </div>
      </div>
    </div>
  );
}

export function ProjectView({
  project: p,
  nextSlug,
  nextName,
  nextAccent,
}: {
  project: Project;
  nextSlug: string;
  nextName: string;
  nextAccent: string;
}) {
  const { lang } = useLang();

  return (
    <>
      <RevealProvider />
      <Nav variant="project" />

      <header className="proj-hero">
        <div className="proj-eyebrow" style={{ color: p.accent }}>
          {p.name} · {p.category[lang].toUpperCase()}
        </div>
        <h1
          style={{
            background: p.gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {p.tagline[lang]}
        </h1>
        <p className="lead">{p.blurb[lang]}</p>
        {p.liveUrl && (
          <div className="proj-actions">
            <a className="btn solid" href={p.liveUrl} target="_blank" rel="noreferrer">
              {site.work.visit[lang]} ›
            </a>
            <span className="badge-live" style={{ alignSelf: "center" }}>
              {site.work.live[lang]} · {p.liveUrl.replace("https://", "")}
            </span>
          </div>
        )}
      </header>

      {/* native mockups */}
      {p.mockup === "dravion" && (
        <section className="section" style={{ paddingBottom: 40 }}>
          <DravionTerminal />
        </section>
      )}
      {p.mockup === "teck" && (
        <section className="section" style={{ paddingBottom: 40 }}>
          <TeckPhone />
        </section>
      )}

      {/* real screenshots */}
      {p.gallery.length > 0 && (
        <section className="section" style={{ padding: "40px 24px 20px" }}>
          <div className="gallery">
            {p.gallery.map((s, i) => (
              <div key={s.src} className="shot reveal" data-d={i * 60}>
                <Image src={s.src} alt={s.caption[lang]} width={1600} height={1000} style={{ height: "auto" }} />
                <div className="cap">{s.caption[lang]}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* features */}
      <section className="section" style={{ padding: "60px 24px 90px" }}>
        <div className={`feat-grid ${p.features.length === 4 ? "feat-2" : "feat-3"}`}>
          {p.features.map((f, i) => (
            <div key={f.title.en} className="feat reveal" data-d={i * 80}>
              <div className="t">{f.title[lang]}</div>
              <div className="b">{f.body[lang]}</div>
            </div>
          ))}
        </div>
        <div className="tech-row reveal" style={{ marginTop: 44 }}>
          {p.tech.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      </section>

      <footer className="proj-foot">
        <Link href="/" style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ {site.work.back[lang]}
        </Link>
        <Link href={`/work/${nextSlug}`} style={{ fontSize: 15, fontWeight: 500, color: nextAccent }}>
          {site.work.next[lang]}: {nextName} ›
        </Link>
      </footer>
    </>
  );
}
