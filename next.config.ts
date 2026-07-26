import type { NextConfig } from "next";

// The App Router streams hydration data through inline <script> blocks, and a
// fully static (CDN-cached) site has no per-request nonce to whitelist them
// with — so 'unsafe-inline' is the documented relaxation here. It is a small
// risk for this site specifically: the only content-injection surface is a
// post body, and that is rendered by the escape-then-transform pass in
// src/lib/posts.ts, which cannot emit raw HTML. Moving to a nonce would force
// dynamic rendering and give up the CDN cache — the site's biggest perf asset.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // No `preload` — that is hard to reverse and would bind every future
  // subdomain of doganaykac.com to HTTPS forever.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,
  images: {
    // AVIF first, WebP as the fallback the optimizer negotiates per request.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The panel and its API must never sit in a shared cache, and must
        // never be indexed — robots.txt is a request, a header is a directive.
        source: "/:path(admin|api/admin/.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  async redirects() {
    // A fixed redirect to the default locale — deliberately NOT based on
    // Accept-Language or IP. Google's guidance is explicit: don't auto-redirect
    // visitors between language versions, and don't use IP analysis to adapt
    // content. Visitors pick their language with the nav switcher.
    return [
      { source: "/", destination: "/en", permanent: false },
      { source: "/work", destination: "/en/work", permanent: false },
      { source: "/work/:slug", destination: "/en/work/:slug", permanent: false },
      { source: "/about", destination: "/en/about", permanent: false },
      { source: "/stack", destination: "/en/stack", permanent: false },
      { source: "/blog", destination: "/en/blog", permanent: false },
      { source: "/cv", destination: "/en/cv", permanent: false },
    ];
  },
};

export default nextConfig;
