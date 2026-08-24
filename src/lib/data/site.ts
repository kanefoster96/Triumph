import type { Stat } from "@/lib/types";

/**
 * Brand + navigation. Edit this file to rebrand the whole site.
 * `nav` is consumed by the desktop header, the mobile menu and the footer,
 * and is shaped to drop into a React Navigation tab navigator.
 */
export const site = {
  name: "Triumph Training",
  /** Used where the full name is too wide. */
  shortName: "Triumph",
  tagline: "Online coaching that actually adapts to you",
  description:
    "Online coaching with Dean Foster. A plan you’ll stick to, an app that keeps you on target, and weekly check-ins for real accountability. Hit your first-month targets and get 50% back.",
  email: "hello@triumphtraining.fit",
  phone: "+44 7700 900412",
  location: "Newcastle upon Tyne",
  /** Where in-person sessions run. */
  inPersonArea: "Newcastle upon Tyne",
  social: [
    { label: "Instagram", handle: "@triumph.training", href: "https://instagram.com" },
    { label: "TikTok", handle: "@triumph.training", href: "https://tiktok.com" },
  ],
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Short label for the app's tab bar. */
  short: string;
  icon: "home" | "dumbbell" | "chart" | "tag" | "message";
}

export const nav: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: "home" },
  { href: "/coaching", label: "Coaching", short: "Coaching", icon: "dumbbell" },
  { href: "/results", label: "Results", short: "Results", icon: "chart" },
  { href: "/pricing", label: "Pricing", short: "Pricing", icon: "tag" },
  { href: "/contact", label: "Contact", short: "Contact", icon: "message" },
];

export const secondaryNav = [
  { href: "/about", label: "About Dean" },
  { href: "/coaching", label: "Online coaching" },
  { href: "/results", label: "Client results" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Ask a question" },
];

export const headlineStats: Stat[] = [
  { label: "Clients helped", value: "80", suffix: "+" },
  { label: "Star rating", value: "5", suffix: "/5" },
];
