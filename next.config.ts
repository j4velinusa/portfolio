import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP as the fallback the optimizer negotiates per request.
    formats: ["image/avif", "image/webp"],
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
    ];
  },
};

export default nextConfig;
