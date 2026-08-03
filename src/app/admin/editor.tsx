"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { LANGS, type Loc } from "@/lib/i18n";
import type {
  CourseChangelogEntry,
  CourseData,
  CourseGalleryImage,
  CourseHeroImage,
  CourseModule,
} from "@/lib/course";

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

/* ------------------------------------------------------------------ tabs */

type Tab = "yazilar" | "kurs" | "medya";

const TABS: ReadonlyArray<readonly [Tab, string]> = [
  ["yazilar", "Yazılar"],
  ["kurs", "Kurs"],
  ["medya", "Medya"],
];

/* ----------------------------------------------------------------- media */

/** Exactly the row GET /api/admin/media returns. `uploadedAt` is an ISO string, not a Date. */
type MediaItem = { url: string; pathname: string; size: number; uploadedAt: string };

/** The server is the real gate (4 MB, magic-byte sniffed). These exist so a
 *  rejected file gets a sentence instead of a round trip. */
const UPLOAD_MAX = 4 * 1024 * 1024;
const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const UPLOAD_ACCEPT = UPLOAD_TYPES.join(",");

/* ---------------------------------------------------------------- course */

/** Mirrors of the caps in src/app/api/admin/course/route.ts. The server still decides. */
const COURSE_MAX_JSON = 200_000;
const CAP = { hero: 8, gallery: 48, modules: 20, changelog: 50 } as const;
const MAX_PRICE = 60;
const MAX_CTA = 60;
const MAX_ALT = 300;
const MAX_MODULE_TITLE = 120;
const MAX_MODULE_SUMMARY = 600;
const MAX_CHANGELOG_TITLE = 200;
const MAX_LESSONS = 999;
const MAX_IMAGE_PATH = 200;
const MAX_PAYMENT_LINK = 500;

// Mirrors the API exactly; see the note on ID_RE in api/admin/course/route.ts.
const ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const REL_IMAGE_RE = /^\/[A-Za-z0-9._\-/]+$/;
const BLOB_HOST_RE = /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

/* ------------------------------------------------------- small pure helpers */

/** A blank translated value in EVERY locale. Iterating LANGS is the point: the
 *  owner is adding languages, and a hardcoded {en,tr} would ship `undefined`. */
const emptyLoc = (): Loc => {
  const out = {} as Loc;
  for (const l of LANGS) out[l] = "";
  return out;
};

/** Ids are React keys and must be unique inside their own list. */
function freshId(prefix: string, taken: readonly { id: string }[]): string {
  const seen = new Set(taken.map((r) => r.id));
  for (let i = 1; i < 999; i++) {
    const id = `${prefix}${i}`;
    if (!seen.has(id)) return id;
  }
  return `${prefix}${Date.now().toString(36)}`;
}

function move<T>(list: readonly T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  const out = list.slice();
  if (j < 0 || j >= out.length) return out;
  const a = out[i];
  out[i] = out[j];
  out[j] = a;
  return out;
}

const patchAt = <T,>(list: readonly T[], i: number, patch: Partial<T>): T[] =>
  list.map((row, j) => (j === i ? { ...row, ...patch } : row));

const dropAt = <T,>(list: readonly T[], i: number): T[] => list.filter((_, j) => j !== i);

const fileNameOf = (pathname: string) => pathname.split("/").pop() || pathname;

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1).replace(".", ",")} MB`;
}

function formatWhen(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function isRealDate(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/* --------------------------------------------- client-side course validation */

/** The same shape the route enforces, so a bad field is named before the PUT. */
function imageProblem(v: string, at: string): string | null {
  if (v.trim().length === 0) return `${at}.image boş olamaz.`;
  if (v.length > MAX_IMAGE_PATH) return `${at}.image çok uzun (en fazla ${MAX_IMAGE_PATH} karakter).`;
  if (v.startsWith("/")) {
    if (v.startsWith("//") || v.includes("..") || !REL_IMAGE_RE.test(v)) {
      return `${at}.image geçersiz bir yol — "/gorseller/ad.jpg" biçiminde olmalı.`;
    }
    return null;
  }
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return `${at}.image "/" ile başlayan bir yol ya da https:// adresi olmalı.`;
  }
  if (u.protocol !== "https:" || !BLOB_HOST_RE.test(u.hostname)) {
    return `${at}.image yalnızca "/" ile başlayan bir yol ya da https Vercel Blob adresi olabilir.`;
  }
  return null;
}

/** True when next/image can be handed this value without throwing. */
const previewable = (v: string) => imageProblem(v, "x") === null;

function locProblem(v: Loc, at: string, max: number): string | null {
  for (const l of LANGS) {
    const s = v[l] ?? "";
    if (s.trim().length === 0) return `${at}.${l} boş olamaz.`;
    if (s.length > max) return `${at}.${l} çok uzun (en fazla ${max} karakter).`;
  }
  return null;
}

function idsProblem(rows: readonly { id: string }[], field: string): string | null {
  const seen = new Set<string>();
  for (const r of rows) {
    if (!ID_RE.test(r.id)) {
      return `${field}.id geçersiz — küçük harf, rakam ve tire kullan (en fazla 40 karakter).`;
    }
    if (seen.has(r.id)) return `${field}.id tekrar ediyor: "${r.id}". Her satırın id'si benzersiz olmalı.`;
    seen.add(r.id);
  }
  return null;
}

function courseProblem(c: CourseData): string | null {
  const caps: Array<[readonly unknown[], number, string]> = [
    [c.hero, CAP.hero, "hero"],
    [c.gallery, CAP.gallery, "gallery"],
    [c.modules, CAP.modules, "modules"],
    [c.changelog, CAP.changelog, "changelog"],
  ];
  for (const [list, max, field] of caps) {
    if (list.length > max) {
      return `${field} en fazla ${max} kayıt içerebilir (${list.length} var).`;
    }
  }

  const idChecks: Array<[readonly { id: string }[], string]> = [
    [c.hero, "hero"],
    [c.gallery, "gallery"],
    [c.modules, "modules"],
    [c.changelog, "changelog"],
  ];
  for (const [rows, field] of idChecks) {
    const bad = idsProblem(rows, field);
    if (bad) return bad;
  }

  const price = locProblem(c.price, "price", MAX_PRICE);
  if (price) return price;
  const cta = locProblem(c.ctaLabel, "ctaLabel", MAX_CTA);
  if (cta) return cta;

  if (c.paymentLink !== "") {
    if (c.paymentLink.length > MAX_PAYMENT_LINK) {
      return `paymentLink çok uzun (en fazla ${MAX_PAYMENT_LINK} karakter).`;
    }
    let u: URL | null = null;
    try {
      u = new URL(c.paymentLink);
    } catch {
      return "paymentLink geçerli bir adres değil — https:// ile başlamalı ya da boş olmalı.";
    }
    if (u.protocol !== "https:") return "paymentLink yalnızca https:// ile başlayabilir ya da boş olmalı.";
  }

  for (let i = 0; i < c.hero.length; i++) {
    const bad = imageProblem(c.hero[i].image, `hero[${i}]`);
    if (bad) return bad;
  }
  for (let i = 0; i < c.gallery.length; i++) {
    const g = c.gallery[i];
    const bad = imageProblem(g.image, `gallery[${i}]`) ?? locProblem(g.alt, `gallery[${i}].alt`, MAX_ALT);
    if (bad) return bad;
  }
  for (let i = 0; i < c.modules.length; i++) {
    const m = c.modules[i];
    const bad =
      locProblem(m.title, `modules[${i}].title`, MAX_MODULE_TITLE) ??
      locProblem(m.summary, `modules[${i}].summary`, MAX_MODULE_SUMMARY);
    if (bad) return bad;
    if (!Number.isInteger(m.lessons) || m.lessons < 0 || m.lessons > MAX_LESSONS) {
      return `modules[${i}].lessons 0 ile ${MAX_LESSONS} arasında bir tam sayı olmalı.`;
    }
  }
  for (let i = 0; i < c.changelog.length; i++) {
    const e = c.changelog[i];
    if (!isRealDate(e.date)) return `changelog[${i}].date gerçek bir takvim tarihi olmalı (YYYY-AA-GG).`;
    const bad = locProblem(e.title, `changelog[${i}].title`, MAX_CHANGELOG_TITLE);
    if (bad) return bad;
  }

  if (JSON.stringify(c).length >= COURSE_MAX_JSON) {
    return `Kurs verisi çok büyük (en fazla ${COURSE_MAX_JSON.toLocaleString("tr-TR")} karakter).`;
  }
  return null;
}

/* --------------------------------------------------------- render helpers */

/** One translated field, one input per LANGS entry. Module scope on purpose:
 *  a component defined inside the render would remount on every keystroke and
 *  drop the caret. */
function LocField({
  label,
  value,
  max,
  rows,
  onChange,
}: {
  label: string;
  value: Loc;
  max: number;
  rows?: number;
  onChange: (next: Loc) => void;
}) {
  return (
    <div className="kurs-loc">
      <span className="kurs-loc-lab">{label}</span>
      {LANGS.map((l) => (
        <label key={l} className="kurs-loc-in">
          <span className="kurs-lang">{l}</span>
          {rows ? (
            <textarea
              rows={rows}
              maxLength={max}
              value={value[l] ?? ""}
              onChange={(e) => onChange({ ...value, [l]: e.target.value })}
            />
          ) : (
            <input
              maxLength={max}
              value={value[l] ?? ""}
              onChange={(e) => onChange({ ...value, [l]: e.target.value })}
            />
          )}
        </label>
      ))}
    </div>
  );
}

/** Thumbnail for a course image. Remote blob urls are an external host, so this
 *  goes through next/image — a raw <img> would be blocked by `img-src 'self'`. */
function Shot({ src }: { src: string }) {
  if (!previewable(src)) return <div className="kurs-shot empty">görsel yok</div>;
  return (
    <div className="kurs-shot">
      <Image src={src} alt="" fill sizes="220px" style={{ objectFit: "cover" }} />
    </div>
  );
}

/* ======================================================================== */

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
  const [tab, setTab] = useState<Tab>("yazilar");

  const [course, setCourse] = useState<CourseData | null>(null);
  const [courseLoaded, setCourseLoaded] = useState(false);
  const [openImg, setOpenImg] = useState<Record<string, boolean>>({});

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /** The markdown toolbar edits the textarea imperatively. A ref instead of
   *  document.getElementById("body") keeps that working no matter how the
   *  panes are mounted — with the id lookup, switching tabs would silently
   *  turn every toolbar button into a no-op. */
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
    setTab("yazilar");
    setCourse(null);
    setCourseLoaded(false);
    setMedia([]);
    setMediaLoaded(false);
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
    const ta = bodyRef.current;
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
    const ta = bodyRef.current;
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

  /* ------------------------------------------------------------- kurs */

  async function loadCourse() {
    try {
      const r = await fetch("/api/admin/course", { cache: "no-store" });
      const d = (await r.json()) as { course?: CourseData; error?: string };
      if (!r.ok) {
        setError(d.error ?? "Kurs verisi alınamadı.");
        if (r.status === 401) setAuthed(false);
        return;
      }
      // GET never 4xx's on a malformed stored file — it serves the default —
      // so `course` is always a real CourseData here.
      if (d.course) {
        setCourse(d.course);
        setCourseLoaded(true);
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    }
  }

  async function saveCourse() {
    if (!course) return;
    const problem = courseProblem(course);
    if (problem) {
      setStatus("");
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const r = await fetch("/api/admin/course", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course),
      });
      const d = (await r.json()) as { ok?: true; commit?: string; error?: string };
      if (!r.ok) {
        setError(d.error ?? "Kaydedilemedi.");
        if (r.status === 401) setAuthed(false);
      } else {
        setStatus(
          `Kurs kaydedildi${d.commit ? ` · commit ${d.commit}` : ""} — dağıtım başladı, ~1 dk içinde canlıda.`,
        );
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  /** Every course edit funnels through here so the null check lives in one place. */
  const patchCourse = (patch: Partial<CourseData>) => setCourse((c) => (c ? { ...c, ...patch } : c));

  const toggleImg = (k: string) => setOpenImg((o) => ({ ...o, [k]: !o[k] }));

  /* ------------------------------------------------------------ medya */

  async function loadMedia() {
    try {
      const r = await fetch("/api/admin/media", { cache: "no-store" });
      const d = (await r.json()) as { items?: MediaItem[]; error?: string };
      if (!r.ok) {
        setError(d.error ?? "Medya listesi alınamadı.");
        if (r.status === 401) setAuthed(false);
        return;
      }
      setMedia(d.items ?? []);
      setMediaLoaded(true);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    }
  }

  async function uploadFiles(picked: File[]) {
    if (picked.length === 0) return;
    // The server re-checks all of this (and sniffs magic bytes). This pass only
    // exists so a wrong file gets a sentence instead of a round trip.
    for (const f of picked) {
      if (!UPLOAD_TYPES.includes(f.type)) {
        setStatus("");
        setError(`"${f.name}": Yalnızca JPEG, PNG, WebP ve AVIF yüklenebilir.`);
        return;
      }
      if (f.size === 0) {
        setStatus("");
        setError(`"${f.name}": Dosya boş.`);
        return;
      }
      if (f.size > UPLOAD_MAX) {
        setStatus("");
        setError(`"${f.name}": Dosya çok büyük. En fazla 4 MB.`);
        return;
      }
    }

    setBusy(true);
    setError("");
    setStatus("");
    try {
      for (let i = 0; i < picked.length; i++) {
        const f = picked[i];
        setStatus(`Yükleniyor · ${i + 1} / ${picked.length} · ${f.name}`);
        const fd = new FormData();
        // No manual Content-Type — the browser has to add the multipart boundary.
        fd.append("file", f);
        const r = await fetch("/api/admin/media", { method: "POST", body: fd });
        const d = (await r.json()) as { ok?: true; url?: string; error?: string };
        if (!r.ok) {
          setStatus("");
          setError(d.error ?? "Yüklenemedi.");
          if (r.status === 401) setAuthed(false);
          return;
        }
      }
      setStatus(`${picked.length} dosya yüklendi.`);
      await loadMedia();
    } catch {
      setStatus("");
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMedia(item: MediaItem) {
    if (!confirm(`"${fileNameOf(item.pathname)}" kalıcı olarak silinsin mi?`)) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const r = await fetch(`/api/admin/media?url=${encodeURIComponent(item.url)}`, {
        method: "DELETE",
      });
      const d = (await r.json()) as { ok?: true; error?: string };
      if (!r.ok) {
        setError(d.error ?? "Silinemedi.");
        if (r.status === 401) setAuthed(false);
      } else {
        setStatus("Dosya silindi.");
        setMedia((m) => m.filter((x) => x.url !== item.url));
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setError("");
      setStatus("Adres panoya kopyalandı.");
    } catch {
      setStatus("");
      setError("Kopyalanamadı — adresi elle seç.");
    }
  }

  /* --------------------------------------------------- load on tab open */

  /** Fetching from the click rather than from an effect: opening the tab IS
   *  the event, and an effect here would be a cascading-render setState. */
  function openTab(next: Tab) {
    setTab(next);
    if (next === "kurs" && !courseLoaded) loadCourse();
    if (next === "medya" && !mediaLoaded) loadMedia();
  }

  /* --------------------------------------------------------------- gate */

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

  const lessonTotal = course ? course.modules.reduce((n, m) => n + m.lessons, 0) : 0;

  return (
    <div className="admin">
      <header className="admin-bar">
        <strong>Gündem paneli</strong>
        <div className="admin-actions">
          {tab === "yazilar" && (
            <span className="admin-note">
              {words} kelime · ~{minutes} dk · Markdown
            </span>
          )}
          {tab === "medya" && <span className="admin-note">{media.length} dosya</span>}
          <a href="/tr/blog" target="_blank" rel="noreferrer" className="admin-ghost">
            Blogu aç
          </a>
          <button onClick={logout} className="admin-ghost">
            Çıkış
          </button>
          {tab === "yazilar" && (
            <button onClick={publish} disabled={busy} className="admin-primary">
              {busy ? "Gönderiliyor…" : editing ? "Güncelle" : "Yayınla"}
            </button>
          )}
          {tab === "kurs" && (
            <button onClick={saveCourse} disabled={busy || !course} className="admin-primary">
              {busy ? "Gönderiliyor…" : "Kursu kaydet"}
            </button>
          )}
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Panel bölümleri">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`admin-tab${tab === id ? " on" : ""}`}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => openTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {(error || status) && (
        <div className={error ? "admin-banner err" : "admin-banner ok"}>{error || status}</div>
      )}

      {tab === "yazilar" && (
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
              ref={bodyRef}
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
      )}

      {tab === "kurs" && (
        <section className="kurs-pane">
          <div className="kurs-head">
            <h2>Riviera Aesthetic</h2>
            <span className="admin-note">
              {course
                ? `${course.modules.length} modül · ${lessonTotal} ders · ${course.price.tr}`
                : "Yükleniyor…"}
            </span>
            <a href="/tr/courses" target="_blank" rel="noreferrer" className="admin-ghost">
              Sayfayı aç ›
            </a>
          </div>

          {!course && <p className="admin-count">Kurs verisi yükleniyor…</p>}

          {course && (
            <>
              {/* ---------------------------------------------- hero */}
              <div className="kurs-sec">
                <div className="kurs-lab">Hero mozaiği</div>
                <p className="kurs-hint">
                  Sayfanın en üstündeki görseller. İlki geniş kare olarak iki sütun kaplıyor.
                  Adresi Medya sekmesindeki “Kopyala” ile alabilirsin.
                </p>
                <div className="kurs-slots">
                  {course.hero.map((h, i) => (
                    <div key={h.id} className="kurs-slot">
                      <Shot src={h.image} />
                      <div className="kurs-slot-body">
                        <div className="kurs-mono">{h.image || "—"}</div>
                        {openImg[`hero:${h.id}`] && (
                          <input
                            className="kurs-imgin"
                            value={h.image}
                            maxLength={MAX_IMAGE_PATH}
                            placeholder="/courses/ad.jpg ya da https://…"
                            onChange={(e) =>
                              patchCourse({
                                hero: patchAt<CourseHeroImage>(course.hero, i, { image: e.target.value }),
                              })
                            }
                          />
                        )}
                        <div className="kurs-acts">
                          <button
                            type="button"
                            className="kurs-mini"
                            onClick={() => toggleImg(`hero:${h.id}`)}
                          >
                            Değiştir
                          </button>
                          <button
                            type="button"
                            className="kurs-mini danger"
                            onClick={() => patchCourse({ hero: dropAt(course.hero, i) })}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="kurs-add"
                  disabled={course.hero.length >= CAP.hero}
                  onClick={() =>
                    patchCourse({
                      hero: [...course.hero, { id: freshId("h", course.hero), image: "" }],
                    })
                  }
                >
                  + Görsel ekle ({course.hero.length}/{CAP.hero})
                </button>
              </div>

              {/* ------------------------------------------- gallery */}
              <div className="kurs-sec">
                <div className="kurs-lab">Galeri ızgarası</div>
                <p className="kurs-hint">
                  “Kursta üretilen işler” bölümü. Sıra, sayfadaki sırayla aynı — okları kullan.
                </p>
                <div className="kurs-rows">
                  {course.gallery.map((g, i) => (
                    <div key={g.id} className="kurs-row">
                      <div className="kurs-move">
                        <button
                          type="button"
                          className="kurs-mini"
                          title="Yukarı taşı"
                          disabled={i === 0}
                          onClick={() => patchCourse({ gallery: move(course.gallery, i, -1) })}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="kurs-mini"
                          title="Aşağı taşı"
                          disabled={i === course.gallery.length - 1}
                          onClick={() => patchCourse({ gallery: move(course.gallery, i, 1) })}
                        >
                          ↓
                        </button>
                      </div>
                      <Shot src={g.image} />
                      <div className="kurs-rowmain">
                        <input
                          className="kurs-imgin"
                          value={g.image}
                          maxLength={MAX_IMAGE_PATH}
                          placeholder="/courses/ad.jpg ya da https://…"
                          onChange={(e) =>
                            patchCourse({
                              gallery: patchAt<CourseGalleryImage>(course.gallery, i, {
                                image: e.target.value,
                              }),
                            })
                          }
                        />
                        <LocField
                          label="Alt metin — görselde ne var? (erişilebilirlik için zorunlu)"
                          value={g.alt}
                          max={MAX_ALT}
                          rows={2}
                          onChange={(alt) =>
                            patchCourse({
                              gallery: patchAt<CourseGalleryImage>(course.gallery, i, { alt }),
                            })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="kurs-mini danger"
                        onClick={() => patchCourse({ gallery: dropAt(course.gallery, i) })}
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="kurs-add"
                  disabled={course.gallery.length >= CAP.gallery}
                  onClick={() =>
                    patchCourse({
                      gallery: [
                        ...course.gallery,
                        { id: freshId("g", course.gallery), image: "", alt: emptyLoc() },
                      ],
                    })
                  }
                >
                  + Görsel ekle ({course.gallery.length}/{CAP.gallery})
                </button>
              </div>

              {/* ------------------------------------------- modules */}
              <div className="kurs-sec">
                <div className="kurs-lab">Müfredat</div>
                <div className="kurs-rows">
                  {course.modules.map((m, i) => (
                    <div key={m.id} className="kurs-row">
                      <div className="kurs-ord">{String(i + 1).padStart(2, "0")}</div>
                      <div className="kurs-rowmain">
                        <LocField
                          label="Modül başlığı"
                          value={m.title}
                          max={MAX_MODULE_TITLE}
                          onChange={(title) =>
                            patchCourse({ modules: patchAt<CourseModule>(course.modules, i, { title }) })
                          }
                        />
                        <LocField
                          label="Özet"
                          value={m.summary}
                          max={MAX_MODULE_SUMMARY}
                          rows={2}
                          onChange={(summary) =>
                            patchCourse({ modules: patchAt<CourseModule>(course.modules, i, { summary }) })
                          }
                        />
                      </div>
                      <label className="kurs-lessons">
                        <span className="kurs-loc-lab">Ders</span>
                        <input
                          type="number"
                          min={0}
                          max={MAX_LESSONS}
                          step={1}
                          value={m.lessons}
                          onChange={(e) =>
                            patchCourse({
                              modules: patchAt<CourseModule>(course.modules, i, {
                                lessons: Number.isFinite(e.target.valueAsNumber)
                                  ? Math.trunc(e.target.valueAsNumber)
                                  : 0,
                              }),
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="kurs-mini danger"
                        onClick={() => patchCourse({ modules: dropAt(course.modules, i) })}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="kurs-add"
                  disabled={course.modules.length >= CAP.modules}
                  onClick={() =>
                    patchCourse({
                      modules: [
                        ...course.modules,
                        {
                          id: freshId("m", course.modules),
                          title: emptyLoc(),
                          summary: emptyLoc(),
                          lessons: 0,
                        },
                      ],
                    })
                  }
                >
                  + Modül ekle ({course.modules.length}/{CAP.modules})
                </button>
              </div>

              {/* ----------------------------------------- changelog */}
              <div className="kurs-sec">
                <div className="kurs-lab">Bu ay eklenenler</div>
                <p className="kurs-hint">
                  Aboneliğin canlı olduğunu gösteren bölüm. Sayfa en yeni tarihi ilk sırada gösterir.
                </p>
                <div className="kurs-rows">
                  {course.changelog.map((c, i) => (
                    <div key={c.id} className="kurs-row">
                      <label className="kurs-date">
                        <span className="kurs-loc-lab">Tarih</span>
                        <input
                          type="date"
                          value={c.date}
                          onChange={(e) =>
                            patchCourse({
                              changelog: patchAt<CourseChangelogEntry>(course.changelog, i, {
                                date: e.target.value,
                              }),
                            })
                          }
                        />
                      </label>
                      <div className="kurs-rowmain">
                        <LocField
                          label="Başlık"
                          value={c.title}
                          max={MAX_CHANGELOG_TITLE}
                          onChange={(title) =>
                            patchCourse({
                              changelog: patchAt<CourseChangelogEntry>(course.changelog, i, { title }),
                            })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="kurs-mini danger"
                        onClick={() => patchCourse({ changelog: dropAt(course.changelog, i) })}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                  {course.changelog.length === 0 && (
                    <p className="admin-count">Henüz kayıt yok.</p>
                  )}
                </div>
                <button
                  type="button"
                  className="kurs-add"
                  disabled={course.changelog.length >= CAP.changelog}
                  onClick={() =>
                    patchCourse({
                      changelog: [
                        ...course.changelog,
                        {
                          id: freshId("c", course.changelog),
                          date: new Date().toISOString().slice(0, 10),
                          title: emptyLoc(),
                        },
                      ],
                    })
                  }
                >
                  + Ay ekle ({course.changelog.length}/{CAP.changelog})
                </button>
              </div>

              {/* --------------------------------------------- price */}
              <div className="kurs-sec">
                <div className="kurs-lab">Fiyat</div>
                <div className="kurs-price">
                  <LocField
                    label="Aylık ücret"
                    value={course.price}
                    max={MAX_PRICE}
                    onChange={(price) => patchCourse({ price })}
                  />
                  <label className="kurs-field">
                    <span className="kurs-loc-lab">Ödeme linki</span>
                    <input
                      value={course.paymentLink}
                      maxLength={MAX_PAYMENT_LINK}
                      placeholder="https://… (boş bırakırsan CTA mailto'ya düşer)"
                      onChange={(e) => patchCourse({ paymentLink: e.target.value })}
                    />
                  </label>
                  <LocField
                    label="Buton metni"
                    value={course.ctaLabel}
                    max={MAX_CTA}
                    onChange={(ctaLabel) => patchCourse({ ctaLabel })}
                  />
                </div>
              </div>

              <div className="kurs-save">
                <button onClick={saveCourse} disabled={busy} className="admin-primary">
                  {busy ? "Gönderiliyor…" : "Kursu kaydet"}
                </button>
                <span className="admin-count">
                  Kaydetmek repoya bir commit atar — sayfa yeniden derlendikten sonra, ~1 dk içinde
                  canlıda görünür.
                </span>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "medya" && (
        <section className="media-pane">
          <div className="media-head">
            <h2>Medya</h2>
            <span className="admin-note">
              {media.length} dosya · {formatSize(media.reduce((n, m) => n + m.size, 0))}
            </span>
            <button
              type="button"
              className="admin-primary"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "Yükleniyor…" : "Yükle"}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept={UPLOAD_ACCEPT}
            className="media-file"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              e.target.value = "";
              uploadFiles(picked);
            }}
          />

          <div
            className={`media-drop${dragOver ? " on" : ""}${busy ? " busy" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!busy) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (busy) return;
              uploadFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <div className="media-drop-t">Dosyaları buraya bırak · birden fazla seçebilirsin</div>
            <div className="media-drop-m">JPEG, PNG, WebP, AVIF · en fazla 4 MB</div>
          </div>

          {!mediaLoaded && <p className="admin-count">Liste yükleniyor…</p>}
          {mediaLoaded && media.length === 0 && (
            <p className="admin-count">Henüz dosya yok.</p>
          )}

          <div className="media-grid">
            {media.map((m) => (
              <div key={m.url} className="media-card">
                <div className="media-shot">
                  <Image
                    src={m.url}
                    alt=""
                    fill
                    sizes="(max-width: 700px) 45vw, 220px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="media-body">
                  <div className="media-name" title={fileNameOf(m.pathname)}>
                    {fileNameOf(m.pathname)}
                  </div>
                  <div className="media-meta">
                    {formatSize(m.size)} · {formatWhen(m.uploadedAt)}
                  </div>
                  <div className="media-acts">
                    <button
                      type="button"
                      className="kurs-mini"
                      onClick={() => copyUrl(m.url)}
                      title={m.url}
                    >
                      Kopyala
                    </button>
                    <button
                      type="button"
                      className="kurs-mini danger"
                      disabled={busy}
                      onClick={() => removeMedia(m)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
