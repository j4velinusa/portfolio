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
check("session tokens are not signed with a password", () => {
  // Assert against CODE, not prose. These files explain themselves at length
  // and a doc comment quoting the old broken pattern tripped this check the
  // first time it ran — worse, a comment could just as easily have satisfied a
  // must-contain assertion that the code no longer met.
  const stripComments = (s) =>
    s
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");

  const lib = stripComments(read("src/lib/signed-token.ts"));
  assert(lib.includes("SESSION_SECRET"), "SESSION_SECRET is not used");
  const signLine = lib.split("\n").find((l) => l.includes("createHmac"));
  assert(signLine, "no createHmac in the signed-token primitive");
  assert(!/password/i.test(signLine), "the HMAC is keyed with a password");

  // One key signs admin, subscriber and magic-link tokens, so the kind has to
  // be inside the signed payload — otherwise a subscriber cookie verifies
  // perfectly as an admin cookie.
  assert(/k:\s*kind/.test(lib), "the token kind is not bound into the signed payload");
  assert(/c\.k\s*!==\s*kind/.test(lib), "readToken does not check the token kind");

  // JSON.parse must never touch bytes that have not been authenticated yet.
  assert(
    lib.indexOf("timingSafeEqual") < lib.indexOf("JSON.parse"),
    "the payload is parsed before the MAC is verified",
  );

  // The payload is base64url precisely so exactly one "." can appear. A
  // split()-based reader silently drops later segments of a forged token.
  assert(!/\.split\("\."\)/.test(lib), "readToken went back to split('.')");

  // admin-auth must not grow a second, weaker signer of its own.
  const admin = stripComments(read("src/lib/admin-auth.ts"));
  assert(!admin.includes("createHmac"), "admin-auth signs tokens itself instead of using the shared primitive");
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

/** `4 * 1024 * 1024` and friends — read the arithmetic, not the first digit. */
const literalBytes = (expr) => {
  const e = expr.replace(/_/g, "").trim();
  assert(/^[0-9+* ]+$/.test(e), `not a plain arithmetic literal: ${expr.trim()}`);
  return e.split("+").reduce((sum, t) => sum + t.split("*").reduce((a, b) => a * Number(b), 1), 0);
};

check("media caps and allowlist are shared by both upload paths", () => {
  // The proxy route and the client-token route MUST agree, so the vocabulary
  // lives in one module. If a second copy ever appears, the two paths drift and
  // the browser starts minting names the server refuses.
  const lib = read("src/lib/media.ts");

  const proxy = lib.match(/MAX_PROXY_UPLOAD_BYTES\s*=\s*([^;]+);/);
  assert(proxy, "MAX_PROXY_UPLOAD_BYTES is gone");
  const proxyBytes = literalBytes(proxy[1]);
  // Vercel Functions reject a body over 4.5 MB with their own opaque English
  // 413; ours has to fire first or that is what the panel shows.
  assert(
    proxyBytes > 0 && proxyBytes <= 4_500_000,
    `proxy cap of ${proxyBytes} bytes is at or above Vercel's 4.5 MB limit`,
  );

  const client = lib.match(/MAX_CLIENT_UPLOAD_BYTES\s*=\s*([^;]+);/);
  assert(client, "MAX_CLIENT_UPLOAD_BYTES is gone — the client token would be unbounded");
  assert(literalBytes(client[1]) > proxyBytes, "the direct-upload ceiling is not above the proxy cap");

  for (const t of ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]) {
    assert(lib.includes(`"${t}"`), `${t} dropped from the allowlist`);
  }
  // A stored name is one segment under media/ — no slashes, so `..` and nested
  // paths cannot appear in a browser-chosen pathname.
  assert(/MEDIA_PATHNAME_RE\s*=\s*\/\^media\\\//.test(lib), "MEDIA_PATHNAME_RE no longer pins the prefix");

  const route = read("src/app/api/admin/media/route.ts");
  assert(route.includes("MAX_PROXY_UPLOAD_BYTES"), "the upload route no longer enforces the shared cap");
  assert(route.includes("isMediaType"), "the upload route no longer enforces the shared allowlist");
  assert(route.includes("%PDF-"), "PDF magic-byte sniffing is gone");
});

check("the client-upload token route is gated", () => {
  const src = read("src/app/api/admin/media/token/route.ts");
  assert(src.includes('runtime = "nodejs"'), "not pinned to the nodejs runtime");
  assert(src.includes('dynamic = "force-dynamic"'), "not marked force-dynamic");
  // This route hands out a credential that writes straight to the store, so the
  // browser-facing branch needs the full gate.
  assert(src.includes("sessionIsValid"), "no session check");
  assert(src.includes("Bad origin"), "no Origin check");
  // The completion callback is authenticated by its own HMAC signature inside
  // handleUpload, which is why it is allowed to skip the session — that branch
  // must stay explicit rather than becoming a blanket bypass.
  assert(
    src.includes('body.type !== "blob.upload-completed"'),
    "the session bypass is no longer scoped to the signed completion callback",
  );
  assert(src.includes("MEDIA_PATHNAME_RE"), "browser-chosen pathnames are not validated");
  assert(src.includes("maximumSizeInBytes"), "the issued token has no size ceiling");
  assert(src.includes("allowedContentTypes"), "the issued token has no type allowlist");
});

check("the magic-link flow cannot be replayed or aimed elsewhere", () => {
  const link = read("src/app/api/auth/link/route.ts");
  assert(link.includes('runtime = "nodejs"'), "link route is not pinned to nodejs");
  assert(link.includes("Bad origin"), "link route has no Origin check");
  assert(link.includes("MAX_PENDING_LINKS"), "link route no longer rate-limits sends");
  // Only the hash is stored, so a database dump holds no working links.
  assert(link.includes("tokenHash"), "the raw token is being stored instead of its hash");
  assert(!/INSERT INTO login_token[\s\S]{0,120}link\.token[^H]/.test(link), "the raw token reaches the insert");

  // The email must not point at the consuming endpoint: a mail provider's link
  // scanner opens it and spends the token before the recipient clicks.
  assert(!/api\/auth\/verify\?t=/.test(link), "the emailed link points straight at the consumer again");
  assert(/courses\/giris\?t=/.test(link), "the emailed link no longer points at the confirmation page");

  const verify = read("src/app/api/auth/verify/route.ts");
  // POST only. A GET consumer is what the scanner problem was.
  assert(/export async function POST/.test(verify), "verify is not a POST handler");
  assert(!/export async function GET/.test(verify), "verify grew a GET handler — scanners will spend tokens again");

  // The confirmation page must read the token without consuming it.
  const page = read("src/app/[lang]/courses/giris/page.tsx");
  assert(page.includes("readLoginLink"), "the confirmation page does not validate the token");
  assert(!/DELETE FROM/.test(page), "the confirmation page consumes the token — that is the bug this fixed");
  assert(/method="POST"/.test(page), "the confirmation form is not a POST");
  // Single-use is the atomic DELETE. A SELECT-then-DELETE lets two concurrent
  // redemptions of one link both succeed.
  assert(/DELETE FROM login_token[\s\S]*RETURNING/.test(verify), "verify no longer consumes the token atomically");
  assert(verify.includes("sha256(token)"), "verify does not look the token up by hash");
  // The redirect target must come from the signed payload, never the URL.
  assert(/link\.lang/.test(verify), "the redirect no longer uses the signed lang");
  assert(
    !/searchParams\.get\((["'])(next|redirect|return|url)\1\)/.test(verify),
    "verify takes a redirect target from the query string — that is an open redirect",
  );
});

check("playback tokens are signed server-side and expire in seconds", () => {
  const src = read("src/lib/bunny.ts");
  assert(src.includes("BUNNY_TOKEN_SECURITY_KEY"), "the security key is no longer read from the environment");
  // Anyone holding the key can sign their own URLs for every video in the
  // library, forever. It must never be inlined into the client bundle.
  assert(!/NEXT_PUBLIC/.test(src), "a NEXT_PUBLIC_ variable appeared in the signing module");
  // Date.now() is milliseconds and Bunny wants seconds. Passing it straight
  // through mints a token that outlives the business.
  assert(
    /Math\.floor\(Date\.now\(\) \/ 1000\)/.test(src),
    "the expiry is no longer converted from milliseconds to seconds",
  );
  assert(src.includes("isBunnyVideoId"), "video ids are not validated before being put in a URL");

  const cfg = read("next.config.ts");
  // Without this the CSP falls back to default-src 'self' and the player is a
  // blank frame with no error anywhere.
  assert(
    /frame-src[^"]*player\.mediadelivery\.net/.test(cfg),
    "frame-src no longer allows the Bunny player",
  );
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
