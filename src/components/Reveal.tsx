"use client";

import { useEffect } from "react";

/** Adds `.in` to every `.reveal` element as it scrolls into view. */
export function RevealProvider() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!els.length) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return; // leave everything visible
    }

    // opt into the hidden-then-revealed state only now that JS is running
    document.documentElement.classList.add("js-ready");

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const d = el.dataset.d;
          if (d) el.style.transitionDelay = `${d}ms`;
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
