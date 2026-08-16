"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/data/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Sits above the content and turns to glass once you scroll — the same
 * behaviour a native header has when the scroll view moves under it.
 */
export function TopBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "glass border-b border-line" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent font-display text-lg font-extrabold text-accent-ink">
            T
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                  active ? "bg-raised text-text" : "text-muted hover:text-text",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/*
          One button with a responsive label rather than two that toggle — the
          `hidden` utility cannot reliably override the button's own
          `inline-flex`, and this ships less DOM either way.
        */}
        <Button href="/contact" size="sm">
          <span className="sm:hidden">Book</span>
          <span className="hidden sm:inline">Book a consult</span>
        </Button>
      </div>
    </header>
  );
}
