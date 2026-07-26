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
const CATEGORIES = ["Ajanlar", "Şifreleme", "Transport", "Ödeme", "Rust", "Ürün", "Genel"];

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

/** Same deterministic gradient the blog renders, so the preview is honest. */
function coverFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, oklch(0.62 0.17 ${h}), oklch(0.52 0.19 ${(h + 48) % 360}))`;
}

export function AdminEditor() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [slugTouched, setSlugTouched] = useState(false);
  const [posts, setPosts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return q ? posts.filter((p) => p.title.toLocaleLowerCase("tr").includes(q)) : posts;
  }, [posts, query]);

  /** Restore the local draft on login rather than in an effect: it is only
   *  needed once you are past the password. */
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

  async function loadPosts() {
    try {
      const r = await fetch("/api/admin/posts", { cache: "no-store" });
      if (r.ok) setPosts((await r.json()).posts ?? []);
    } catch {
      /* the list is a convenience; the editor still works without it */
    }
  }

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
        loadPosts();
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
    } catch {
      /* the cookie expires on its own anyway */
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to clean up */
    }
    setDraft(emptyDraft());
    setSlugTouched(false);
    setPosts([]);
    setEditing(null);
    setStatus("");
    setError("");
    setAuthed(false);
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
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* nothing to clean up */
        }
        setStatus(
          `${d.updated ? "Güncellendi" : "Yayınlandı"} · commit ${d.commit} — dağıtım başladı, ~1 dk içinde canlıda.`,
        );
        setEditing(draft.slug);
        loadPosts();
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(slug: string) {
    if (!confirm(`"${slug}" kalıcı olarak silinsin mi?`)) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const r = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Silinemedi.");
      else {
        setStatus(`Silindi · commit ${d.commit}`);
        if (editing === slug) newPost();
        loadPosts();
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  function edit(p: Draft) {
    setDraft({ ...p });
    setEditing(p.slug);
    setSlugTouched(true);
    setStatus("");
    setError("");
  }

  function newPost() {
    setDraft(emptyDraft());
    setEditing(null);
    setSlugTouched(false);
    setStatus("");
    setError("");
  }

  /** Prefix the current line (or every selected line) — for `## `, `> `, `- `,
   *  `1. `. Inserting these at the cursor mid-line produces `text> more`,
   *  which is not a quote and silently does nothing useful. */
  function prefixLines(prefix: string) {
    const ta = document.getElementById("body") as HTMLTextAreaElement | null;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const from = value.lastIndexOf("\n", s - 1) + 1;
    const toRaw = value.indexOf("\n", e);
    const to = toRaw === -1 ? value.length : toRaw;
    const block = value
      .slice(from, to)
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : prefix + l))
      .join("\n");
    const next = value.slice(0, from) + block + value.slice(to);
    set("body", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = from;
      ta.selectionEnd = from + block.length;
    });
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
            {words} kelime · ~{minutes} dk · Markdown
          </span>
          <a href="/tr/blog" target="_blank" rel="noreferrer" className="admin-ghost">
            Blogu aç
          </a>
          <button onClick={logout} className="admin-ghost">
            Çıkış
          </button>
          <button onClick={publish} disabled={busy} className="admin-primary">
            {busy ? "Gönderiliyor…" : editing ? "Güncelle" : "Yayınla"}
          </button>
        </div>
      </header>

      {(error || status) && (
        <div className={error ? "admin-banner err" : "admin-banner ok"}>{error || status}</div>
      )}

      <div className="admin-grid">
        <nav className="admin-list">
          <button className="admin-ghost wide" onClick={newPost}>
            + Yeni yazı
          </button>
          <input
            className="admin-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Yazı ara"
          />
          <div className="admin-count">
            {posts.length} yazı{query ? ` · ${shown.length} eşleşme` : ""}
          </div>

          {shown.map((p) => (
            <div key={p.slug} className={`admin-item${editing === p.slug ? " on" : ""}`}>
              <button className="admin-item-main" onClick={() => edit(p)}>
                <span className="t">{p.title}</span>
                <span className="m">
                  {p.date} · {p.category}
                </span>
              </button>
              <button className="admin-del" onClick={() => remove(p.slug)} title="Sil" disabled={busy}>
                ×
              </button>
            </div>
          ))}

          {posts.length === 0 && <p className="admin-count">Henüz yazı yok.</p>}
        </nav>

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
            {editing ? <span className="admin-editing">düzenleniyor</span> : null}
          </div>

          <div className="admin-tools">
            <button onClick={() => insert("**", "**")} title="Kalın">B</button>
            <button onClick={() => insert("*", "*")} title="İtalik"><i>I</i></button>
            <button onClick={() => prefixLines("## ")} title="Başlık">H2</button>
            <button onClick={() => prefixLines("> ")} title="Alıntı">&quot;&quot;</button>
            <button onClick={() => prefixLines("- ")} title="Liste">•</button>
            <button onClick={() => prefixLines("1. ")} title="Numaralı">1.</button>
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
              Tarih
              <input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
            </label>
            <label>
              Kategori
              <input
                list="admin-cats"
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Ajanlar"
              />
            </label>
            <datalist id="admin-cats">
              {[...new Set([...CATEGORIES, ...posts.map((p) => p.category)])].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="admin-count">
              Taslak repoya yazılmaz — yayınlayana kadar bu tarayıcıda kalır.
            </p>
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
              <div
                className="admin-cover"
                style={{ background: coverFor(draft.slug || draft.title || "yazi") }}
              />
              <div className="admin-preview-host">doganaykac.com</div>
              <div className="admin-preview-title">{draft.title || "Başlık"}</div>
              <div className="admin-preview-desc">{draft.excerpt || "Özet buraya gelecek."}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
