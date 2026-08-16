/**
 * Design tokens.
 *
 * Plain data, no DOM and no web-only units, so this file can be imported
 * as-is by a React Native app (StyleSheet) as well as by the web build.
 * The web mirrors these values in `globals.css` under `@theme`.
 */

export const palette = {
  // Surfaces, darkest to lightest.
  ink: "#08090B",
  surface: "#101217",
  raised: "#171A21",
  overlay: "#1E222B",
  line: "#262A34",

  // Text.
  text: "#F5F6F8",
  muted: "#9AA1AD",
  faint: "#6A7180",

  // Brand accent — "volt".
  accent: "#D3FF4E",
  accentStrong: "#B8E62C",
  accentInk: "#0B1002",
  accentSoft: "rgba(211, 255, 78, 0.12)",

  // Supporting signal colours.
  heat: "#FF6A3D",
  cool: "#4EA8FF",
  success: "#3DDC97",
  danger: "#FF4D4D",
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
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typeScale = {
  display: { size: 56, lineHeight: 56, weight: "800" },
  h1: { size: 40, lineHeight: 44, weight: "800" },
  h2: { size: 28, lineHeight: 32, weight: "700" },
  h3: { size: 20, lineHeight: 26, weight: "700" },
  body: { size: 16, lineHeight: 26, weight: "400" },
  small: { size: 14, lineHeight: 20, weight: "400" },
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
