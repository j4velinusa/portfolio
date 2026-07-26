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

/** Published posts, newest first. Server-only — reads the repo at build time. */
export function getPosts({ includeDrafts = false } = {}): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(POSTS_DIR, f), "utf8")) as Post)
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
      out.push(`<blockquote>${quote.map((q) => `<p>${inline(q)}</p>`).join("")}</blockquote>`);
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

    if (line.startsWith("&gt; ")) {
      closeList();
      quote.push(line.slice(5));
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
