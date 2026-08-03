import type { CSSProperties } from "react";

/**
 * The Riviera sub-brand palette.
 *
 * The site chrome is hard black; everything under the course brand is warm
 * paper. The switch happens by re-declaring the global custom properties on a
 * wrapper carrying `.riviera` — the same mechanism `.proj-theme` and
 * `.cv-page` already use. Custom properties inherit down the DOM only, so
 * nothing leaks to sibling routes and there is no state to reset.
 *
 * NEVER declare these on :root, on html/body, or in a Tailwind @theme block.
 * That would repaint every dark page on the site at once.
 *
 * --line and --line2 are the ones that bite. Globally they are white alphas
 * (rgba(255,255,255,.09) / .16), and every border on the site reads them, so
 * on paper they have to be flipped to dark alphas or every separator, card
 * edge and section rule silently disappears.
 *
 * Lives here rather than in a page because three routes need it — the course
 * page, the sign-in confirmation, and the lesson player — and three copies of
 * thirteen hex values is three chances to drift.
 */
export const rivieraTheme = {
  "--bg": "#F1EFEA",
  "--bg2": "#FBFAF7",
  "--surface": "#FBFAF7",
  "--surface2": "#FFFFFF",
  "--text": "#1C1B19",
  "--muted": "#5C5749",
  "--dim": "#8E897D",
  "--accent": "#137A63",
  "--accent2": "#5FCBAA",
  "--deep": "#0E3A2E",
  "--sand": "#E7E4DD",
  "--line": "rgba(28, 27, 25, 0.07)",
  "--line2": "rgba(28, 27, 25, 0.16)",
} as CSSProperties;
