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
  ink: "#000000",
  surface: "#111820",
  raised: "#1A242E",
  overlay: "#232E3A",
  // Only for genuine rules — a divider between rows, the underside of a
  // header. Never to outline a card.
  line: "#1F2A35",

  // Text.
  text: "#F2F6F9",
  muted: "#94A3B2",
  faint: "#7A8A9A",

  // Brand accent — cyan.
  accent: "#22D3EE",
  accentStrong: "#06B6D4",
  accentInk: "#04212A",
  accentSoft: "rgba(34, 211, 238, 0.12)",

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
