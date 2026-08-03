/**
 * Regression tests for the security properties that are easy to break by
 * accident. Runs in CI on every push, including the commits the admin panel
 * makes when publishing a post.
 *
 * No test framework on purpose: this is the whole suite, and a dependency-free
 * script cannot itself become a supply-chain surface.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures++;
    console.error(`  FAIL ${name}\n       ${e.message}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

console.log("\nsecurity regressions\n");

// --- JSON-LD must never be injected with a bare JSON.stringify -------------
check("JSON-LD is escaped everywhere it is injected", () => {
  for (const f of ["src/components/JsonLd.tsx", "src/app/[lang]/blog/[slug]/page.tsx"]) {
    const src = read(f);
    const bare = /dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify/.test(src);
    assert(!bare, `${f} injects JSON.stringify directly — use jsonLdSafe()`);
  }
});

check("jsonLdSafe neutralises a </script> breakout", () => {
  const src = read("src/components/JsonLd.tsx");
  // `\r?` because a Windows working copy checks out CRLF: without it this
  // check reports "jsonLdSafe not found" on every local run and stops being
  // something anyone trusts, while still passing in LF-land on CI.
  const m = src.match(/export const jsonLdSafe[\s\S]*?;\r?\n/);
  assert(m, "jsonLdSafe not found");
  for (const ch of ["<", ">", "&"]) {
    assert(m[0].includes(`/${ch}/g`), `jsonLdSafe does not escape ${ch}`);
  }
});

// --- the session key must not be the password -----------------------------
check("session cookie is not signed with ADMIN_PASSWORD", () => {
  const src = read("src/lib/admin-auth.ts");
  assert(src.includes("SESSION_SECRET"), "SESSION_SECRET is not used");
  const signLine = src.split("\n").find((l) => l.includes("createHmac"));
  assert(signLine && !signLine.includes("adminPassword"), "HMAC is keyed with the password");
});

// --- publish endpoint invariants ------------------------------------------
check("publish enforces auth, origin, size and slug shape", () => {
  const src = read("src/app/api/admin/publish/route.ts");
  assert(src.includes("sessionIsValid"), "no session check");
  assert(src.includes("Bad origin"), "no Origin check");
  assert(src.includes("application/json"), "no Content-Type check");
  assert(/body\.length\s*>/.test(src), "no body size limit");
  assert(src.includes("SLUG_RE"), "no slug validation");
  assert(src.includes("AbortSignal.timeout"), "GitHub fetch has no timeout");
});

check("drafts are never committed to the public repo", () => {
  const src = read("src/app/api/admin/publish/route.ts");
  assert(src.includes("p.published === false"), "draft posts are not rejected before the git write");
});

// --- the newer admin routes carry the same posture --------------------------
// These write to a public git repo and to blob storage respectively, so they
// need every guard the publish route needs. Asserted here because it is easy
// to add a fourth route later and forget one of them.
for (const route of ["course", "media"]) {
  check(`${route} route enforces auth, origin, size and timeouts`, () => {
    const src = read(`src/app/api/admin/${route}/route.ts`);
    assert(src.includes('runtime = "nodejs"'), "not pinned to the nodejs runtime");
    assert(src.includes('dynamic = "force-dynamic"'), "not marked force-dynamic");
    assert(src.includes("sessionIsValid"), "no session check");
    assert(src.includes("Bad origin"), "no Origin check");
    assert(/413/.test(src), "no explicit oversize rejection");
    assert(src.includes("AbortSignal.timeout"), "an outbound fetch has no timeout");
  });
}

check("media uploads are capped below the platform limit", () => {
  const src = read("src/app/api/admin/media/route.ts");
  // Vercel Functions reject a request body over 4.5 MB with their own opaque
  // English 413. Our cap has to fire first or the panel shows that instead of
  // the Turkish message.
  const m = src.match(/MAX_(?:UPLOAD|FILE)_BYTES\s*=\s*([^;]+);/);
  assert(m, "no MAX_UPLOAD_BYTES / MAX_FILE_BYTES constant to enforce a cap");
  // The cap is written as `4 * 1024 * 1024`, so read the arithmetic rather
  // than the first digit — grabbing `4` would pass this check on any value.
  const expr = m[1].replace(/_/g, "").trim();
  assert(/^[0-9+* ]+$/.test(expr), `cap is not a plain arithmetic literal: ${m[1].trim()}`);
  const bytes = expr
    .split("+")
    .reduce((sum, term) => sum + term.split("*").reduce((a, b) => a * Number(b), 1), 0);
  assert(bytes > 0 && bytes <= 4_500_000, `cap of ${bytes} bytes is at or above Vercel's 4.5 MB limit`);
  assert(/image\/jpeg/.test(src) && /image\/png/.test(src), "content-type allowlist is gone");
});

check("course data is not filed where the post schema is enforced", () => {
  // content/posts/*.json is walked by the post check below, which requires a
  // slug/title/body/date. course.json has none of those and would hard-fail.
  assert(!existsSync(join(process.cwd(), "content", "posts", "course.json")), "course.json is in content/posts/");
  assert(existsSync(join(process.cwd(), "content", "course.json")), "content/course.json is missing");
});

// --- markdown renderer stays escape-first ---------------------------------
check("markdown escapes before transforming", () => {
  const src = read("src/lib/posts.ts");
  assert(src.includes("escapeHtml"), "escapeHtml is gone");
  // The one line that matters: raw input is escaped on the way in, and every
  // later transform runs on the escaped value, never on `raw`.
  assert(/const line = escapeHtml\(raw/.test(src), "raw markdown is not escaped on entry");
  assert(!/inline\(\s*raw/.test(src), "inline() is applied to unescaped input");
});

// --- security headers ------------------------------------------------------
check("security headers are configured", () => {
  const src = read("next.config.ts");
  for (const h of [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "X-Frame-Options",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) {
    assert(src.includes(h), `${h} is missing`);
  }
  assert(src.includes("poweredByHeader: false"), "poweredByHeader is not disabled");
  assert(src.includes("no-store"), "admin/api is not marked no-store");
});

// --- no secrets in tracked source -----------------------------------------
check("no credentials committed to the repo", () => {
  const patterns = [
    /gh[pous]_[A-Za-z0-9]{16,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  ];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git"].includes(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx|js|mjs|json|md|yml|yaml)$/.test(e.name)) {
        const src = readFileSync(p, "utf8");
        for (const re of patterns) {
          assert(!re.test(src), `possible credential in ${p}`);
        }
      }
    }
  };
  walk(process.cwd());
});

// --- content files match the schema the site expects ----------------------
check("every published post parses and has sane fields", () => {
  const dir = join(process.cwd(), "content", "posts");
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    const p = JSON.parse(readFileSync(join(dir, f), "utf8"));
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug), `${f}: bad slug`);
    assert(typeof p.title === "string" && p.title.length <= 200, `${f}: bad title`);
    assert(typeof p.body === "string" && p.body.length <= 250_000, `${f}: bad body`);
    const [y, m, d] = String(p.date).split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    assert(
      dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d,
      `${f}: ${p.date} is not a real date`,
    );
  }
});

console.log(failures ? `\n${failures} check(s) failed\n` : "\nall checks passed\n");
process.exit(failures ? 1 : 0);
