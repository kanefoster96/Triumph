import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/data/site";
import { palette } from "@/lib/theme/tokens";

/**
 * Titles only. Body text uses the platform UI font (SF Pro on Apple devices)
 * declared in globals.css, so it needs no download and matches the OS.
 */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    type: "website",
    locale: "en_GB",
  },
};

export const viewport: Viewport = {
  themeColor: palette.ink,
  colorScheme: "dark",
  // Lets the layout run under the status bar / home indicator when installed.
  viewportFit: "cover",
};

/**
 * Only the document shell. The marketing site and the members' area each
 * bring their own chrome from their own layout.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${outfit.variable} h-full antialiased`}>
      <head>
        {/* Scroll-reveal starts elements at opacity 0 and JS reveals them.
            Without JS there is no observer, so pin them visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col bg-ink text-text">{children}</body>
    </html>
  );
}
