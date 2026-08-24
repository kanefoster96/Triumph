/**
 * Design tokens.
 *
 * Plain data, no DOM and no web-only units, so this file can be imported
 * as-is by a React Native app (StyleSheet) as well as by the web build.
 * The web mirrors these values in `globals.css` under `@theme`.
 */

export const palette = {
  // Surfaces, darkest to lightest.
  //
  // The page itself is true black, and every layer above it is a step up in
  // tone. That step is what separates a card from the page, so cards carry no
  // border: `surface` on `ink` is a wider gap than the hairline ever drew.
  // Each level must stay clearly lighter than the one below, or a nested row
  // loses its only edge.
  //
  // Neutral grey, deliberately. These used to carry a blue cast, and with a
  // cyan accent on top of them the whole page read as though it had a filter
  // over it. The colour belongs to the accent; everything under it is grey so
  // the accent is the only thing that is coloured.
  ink: "#000000",
  surface: "#141414",
  raised: "#1F1F1F",
  overlay: "#2A2A2A",
  // Only for genuine rules — a divider between rows, the underside of a
  // header. Never to outline a card.
  line: "#262626",

  // Text. Also neutral: blue-grey body copy tints every paragraph on the page.
  text: "#FAFAFA",
  muted: "#A1A1A1",
  faint: "#8A8A8A",

  // Brand accent — cyan.
  accent: "#22D3EE",
  accentStrong: "#06B6D4",
  accentInk: "#0A0A0A",
  accentSoft: "rgba(34, 211, 238, 0.12)",
  /**
   * The bloom under the accent CTA — the only glow anywhere, and the reason
   * the button reads as lit rather than as a coloured rectangle. Native takes
   * this as a shadow colour; the web mirrors it as `--shadow-glow`.
   */
  accentGlow: "rgba(34, 211, 238, 0.7)",
  /**
   * Anything filled, lit from above: white along the top edge, black along
   * the bottom. Both are needed — the dark surfaces have room to be lifted
   * and the accent has none, so the white does the work on one and the black
   * on the other.
   *
   * The white is kept under half of `surface`-to-`raised`, the smallest step
   * on the ramp above, so a lit card's top edge stays darker than a plain
   * `raised` row and nesting never inverts.
   */
  sheenTop: "rgba(255, 255, 255, 0.022)",
  sheenBottom: "rgba(0, 0, 0, 0.055)",

  // Supporting signal colours.
  amber: "#F5B23D",
  success: "#34D399",
  danger: "#F87171",
  white: "#FFFFFF",
} as const;

/** 4pt spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
  "5xl": 96,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Font families.
 *
 * Body text deliberately uses the platform UI font — SF Pro on iOS, Roboto on
 * Android — which is also React Native's default, so the app gets this for
 * free. Only the title face is a downloaded font.
 */
export const fonts = {
  /** Pass to RN as `System`, or omit the fontFamily entirely. */
  body: "system",
  display: "Outfit",
  displayWeights: ["600", "700"],
} as const;

export const typeScale = {
  display: { size: 48, lineHeight: 52, weight: "800" },
  h1: { size: 36, lineHeight: 42, weight: "800" },
  h2: { size: 28, lineHeight: 34, weight: "700" },
  h3: { size: 20, lineHeight: 28, weight: "700" },
  body: { size: 16, lineHeight: 26, weight: "400" },
  small: { size: 14, lineHeight: 22, weight: "400" },
  label: { size: 12, lineHeight: 16, weight: "600" },
} as const;

/** Motion durations in ms — shared with Reanimated on native. */
export const motion = {
  fast: 140,
  base: 240,
  slow: 420,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export type Palette = typeof palette;
