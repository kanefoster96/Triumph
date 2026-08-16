import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/layout/TopBar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/lib/data/site";
import { palette } from "@/lib/theme/tokens";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        {/* Scroll-reveal starts elements at opacity 0 and JS reveals them.
            Without JS there is no observer, so pin them visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col bg-ink text-text">
        <TopBar />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomTabBar />
      </body>
    </html>
  );
}
