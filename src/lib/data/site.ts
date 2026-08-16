import type { Stat } from "@/lib/types";

/**
 * Brand + navigation. Edit this file to rebrand the whole site.
 * `nav` is consumed by the desktop header, the mobile tab bar and the footer,
 * and is shaped to drop into a React Navigation tab navigator.
 */
export const site = {
  name: "Triumph",
  tagline: "Personal training that actually sticks",
  description:
    "Strength, conditioning and habit coaching in Manchester and online. Structured programmes, weekly check-ins, and a coach who answers.",
  email: "hello@triumph.fit",
  phone: "+44 7700 900412",
  location: "Ancoats, Manchester",
  studio: "Unit 4, Bengal Works, Manchester M4",
  social: [
    { label: "Instagram", handle: "@triumph.fit", href: "https://instagram.com" },
    { label: "TikTok", handle: "@triumph.fit", href: "https://tiktok.com" },
    { label: "Strava", handle: "Triumph Club", href: "https://strava.com" },
  ],
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Short label for the mobile tab bar. */
  short: string;
  icon: "home" | "dumbbell" | "chart" | "tag" | "message";
}

export const nav: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: "home" },
  { href: "/programmes", label: "Programmes", short: "Train", icon: "dumbbell" },
  { href: "/results", label: "Results", short: "Results", icon: "chart" },
  { href: "/pricing", label: "Pricing", short: "Pricing", icon: "tag" },
  { href: "/contact", label: "Contact", short: "Book", icon: "message" },
];

export const secondaryNav = [
  { href: "/about", label: "About the coach" },
  { href: "/programmes", label: "Programmes" },
  { href: "/results", label: "Client results" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Book a consult" },
];

export const headlineStats: Stat[] = [
  { label: "Clients coached", value: "240", suffix: "+" },
  { label: "Years coaching", value: "9" },
  { label: "Avg. client rating", value: "4.9", suffix: "/5" },
  { label: "Sessions delivered", value: "11k", suffix: "+" },
];
