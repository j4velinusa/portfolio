"use client";

import { useEffect, useMemo, useState } from "react";

type Draft = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  body: string;
  published: boolean;
};

const DRAFT_KEY = "da_admin_draft_v1";
const EXCERPT_MAX = 200;

const emptyDraft = (): Draft => ({
  slug: "",
  title: "",
  category: "Ajanlar",
  date: new Date().toISOString().slice(0, 10),
  excerpt: "",
  body: "",
  published: true,
});

const slugify = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

export function AdminEditor() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [slugTouched, setSlugTouched] = useState(false);

  /** Restore the local draft. Called on login rather than from an effect:
   *  the draft is only needed once you are actually in the editor. */
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        setDraft({ ...emptyDraft(), ...JSON.parse(raw) });
        setSlugTouched(true);
      }
    } catch {
      /* a corrupt draft just starts you fresh */
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* storage full or blocked — the draft simply isn't kept */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [draft]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const words = useMemo(() => draft.body.trim().split(/\s+/).filter(Boolean).length, [draft.body]);
  const minutes = Math.max(1, Math.round(words / 200));

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Giriş başarısız.");
      else {
        restoreDraft();
        setAuthed(true);
        setPassword("");
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const r = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "Yayınlanamadı.");
        if (r.status === 401) setAuthed(false);
      } else {
        setStatus(
          `${d.updated ? "Güncellendi" : "Yayınlandı"} · commit ${d.commit} — Vercel dağıtımı başladı, ~1 dk içinde canlıda.`,
        );
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  function insert(before: string, after = "") {
    const ta = document.getElementById("body") as HTMLTextAreaElement | null;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const next = value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e);
    set("body", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd = e + before.length;
    });
  }

  if (!authed) {
    return (
      <div className="admin-gate">
        <form onSubmit={login} className="admin-card">
          <h1>Gündem paneli</h1>
          <p>Yazı yazmak için şifre gerekiyor.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            autoFocus
            autoComplete="current-password"
          />
          <button type="submit" disabled={busy || !password}>
            {busy ? "Kontrol ediliyor…" : "Giriş"}
          </button>
          {error && <p className="admin-err">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <strong>Gündem paneli</strong>
        <div className="admin-actions">
          <span className="admin-note">
            {words} kelime · ~{minutes} dk okuma · Markdown destekli
          </span>
          <a href="/tr/blog" target="_blank" rel="noreferrer" className="admin-ghost">
            Blogu aç
          </a>
          <button onClick={publish} disabled={busy} className="admin-primary">
            {busy ? "Gönderiliyor…" : draft.published ? "Yayınla" : "Taslak olarak kaydet"}
          </button>
        </div>
      </header>

      {(error || status) && (
        <div className={error ? "admin-banner err" : "admin-banner ok"}>{error || status}</div>
      )}

      <div className="admin-grid">
        <main className="admin-main">
          <input
            className="admin-title"
            value={draft.title}
            placeholder="Başlık"
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
          <div className="admin-slug">
            doganaykac.com/tr/blog/
            <input
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              placeholder="yazi-adresi"
            />
          </div>

          <div className="admin-tools">
            <button onClick={() => insert("**", "**")} title="Kalın">B</button>
            <button onClick={() => insert("*", "*")} title="İtalik"><i>I</i></button>
            <button onClick={() => insert("## ")} title="Başlık">H2</button>
            <button onClick={() => insert("> ")} title="Alıntı">&quot;&quot;</button>
            <button onClick={() => insert("- ")} title="Liste">•</button>
            <button onClick={() => insert("1. ")} title="Numaralı">1.</button>
            <button onClick={() => insert("[", "](https://)")} title="Bağlantı">🔗</button>
            <button onClick={() => insert("`", "`")} title="Kod">{"</>"}</button>
          </div>

          <textarea
            id="body"
            className="admin-body"
            value={draft.body}
            placeholder="Yazmaya başla…"
            onChange={(e) => set("body", e.target.value)}
          />
        </main>

        <aside className="admin-side">
          <div className="admin-block">
            <div className="admin-lab">YAYIN</div>
            <label>
              Durum
              <select
                value={draft.published ? "yes" : "no"}
                onChange={(e) => set("published", e.target.value === "yes")}
              >
                <option value="yes">Yayında</option>
                <option value="no">Taslak</option>
              </select>
            </label>
            <label>
              Tarih
              <input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
            </label>
            <label>
              Kategori
              <input
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Ajanlar"
              />
            </label>
          </div>

          <div className="admin-block">
            <div className="admin-lab">ÖZET</div>
            <textarea
              className="admin-excerpt"
              value={draft.excerpt}
              maxLength={EXCERPT_MAX}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Blog listesinde ve Google'da görünecek iki cümle."
            />
            <div className="admin-count">
              {draft.excerpt.length} / {EXCERPT_MAX} karakter
            </div>
          </div>

          <div className="admin-block">
            <div className="admin-lab">ÖNİZLEME</div>
            <div className="admin-preview">
              <div className="admin-preview-host">doganaykac.com</div>
              <div className="admin-preview-title">{draft.title || "Başlık"}</div>
              <div className="admin-preview-desc">{draft.excerpt || "Özet buraya gelecek."}</div>
            </div>
          </div>

          <button
            className="admin-ghost wide"
            onClick={() => {
              if (confirm("Taslağı temizleyip sıfırdan başlansın mı?")) {
                setDraft(emptyDraft());
                setSlugTouched(false);
              }
            }}
          >
            Yeni yazı
          </button>
        </aside>
      </div>
    </div>
  );
}
