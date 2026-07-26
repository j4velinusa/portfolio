import fs from "node:fs";
import path from "node:path";

export type Post = {
  slug: string;
  title: string;
  category: string;
  /** ISO date, e.g. 2026-07-26 */
  date: string;
  readMinutes: number;
  excerpt: string;
  published: boolean;
  /** Markdown */
  body: string;
};

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/** A real calendar date, not just four-two-two digits: 2026-99-99 must fail. */
function isRealDate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const str = (v: unknown, max: number) => typeof v === "string" && v.length > 0 && v.length <= max;

/**
 * Content files are data, so they get validated like data — a hand-edited or
 * half-written JSON should drop that one post, never take the build down.
 * Returns null (and warns) instead of throwing.
 */
function parsePost(raw: unknown, file: string): Post | null {
  const p = raw as Partial<Post>;
  const ok =
    str(p.slug, 80) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug as string) &&
    str(p.title, 200) &&
    str(p.category, 60) &&
    isRealDate(p.date) &&
    typeof p.excerpt === "string" &&
    p.excerpt.length <= 300 &&
    typeof p.body === "string" &&
    p.body.length <= 250_000 &&
    typeof p.published === "boolean";

  if (!ok) {
    console.warn(`[posts] skipping ${file}: does not match the post schema`);
    return null;
  }
  return {
    slug: p.slug as string,
    title: p.title as string,
    category: p.category as string,
    date: p.date as string,
    readMinutes: typeof p.readMinutes === "number" && p.readMinutes > 0 ? p.readMinutes : 1,
    excerpt: p.excerpt as string,
    published: p.published as boolean,
    body: p.body as string,
  };
}

/** Published posts, newest first. Server-only — reads the repo at build time. */
export function getPosts({ includeDrafts = false } = {}): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return parsePost(JSON.parse(fs.readFileSync(path.join(POSTS_DIR, f), "utf8")), f);
      } catch {
        console.warn(`[posts] skipping ${f}: invalid JSON`);
        return null;
      }
    })
    .filter((p): p is Post => p !== null)
    .filter((p) => includeDrafts || p.published)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_TR[m - 1]} ${y}`;
}

/**
 * A deterministic cover for a post, derived from its slug — same input, same
 * gradient, forever. Avoids asking the author to make an image for every post
 * while still giving the list some colour to navigate by.
 */
export function coverFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, oklch(0.62 0.17 ${h}), oklch(0.52 0.19 ${(h + 48) % 360}))`;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Inline markdown, applied to already-escaped text. */
function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>',
    );
}

/**
 * Markdown → HTML for post bodies.
 *
 * Escapes first and only then applies a fixed set of transforms, so a post can
 * never inject raw HTML — even though the only author is the site owner.
 * Deliberately dependency-free: the syntax the editor offers is all we support.
 */
export function renderMarkdown(md: string): string {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let quote: string[] = [];

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };
  const closeQuote = () => {
    if (quote.length) {
      // Consecutive `>` lines are one paragraph, the way Markdown treats them —
      // a hard-wrapped quote should read as flowing text, not stacked lines.
      out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
      quote = [];
    }
  };

  for (const raw of md.replace(/\r\n/g, "\n").split("\n")) {
    const line = escapeHtml(raw.trim());

    if (!line) {
      closeList();
      closeQuote();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.*)$/);
    if (heading) {
      closeList();
      closeQuote();
      const level = heading[1].length; // ## -> h2
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    // `>` with or without a space — a missing space is the most common way to
    // write a quote by hand, and leaking a literal `>` looks like a bug.
    const q = line.match(/^&gt;\s?(.*)$/);
    if (q) {
      closeList();
      quote.push(q[1]);
      continue;
    }
    closeQuote();

    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  closeQuote();
  return out.join("\n");
}
