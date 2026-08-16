"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { nav } from "@/lib/data/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

/**
 * Sticky header. Transparent over the top of the page, then turns to frosted
 * glass once content scrolls beneath it.
 */
export function TopBar({ demoSlot }: { demoSlot?: ReactNode }) {
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
        // Mostly opaque by default; browsers that can blur get a lighter tint
        // so the frosted effect is actually visible.
        scrolled
          ? "border-b border-line bg-ink/90 supports-[backdrop-filter]:bg-ink/60 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150"
          : "border-b border-transparent bg-ink",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />

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
                  active ? "text-accent" : "text-muted hover:text-text",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-text md:inline-flex"
          >
            Members
          </Link>
          {/* Wrapped rather than given `hidden` directly: the Button sets its
              own `inline-flex`, which wins over a `hidden` passed in. */}
          <span className="hidden md:inline-flex">
            <Button href="/contact" size="sm">
              Book a consult
            </Button>
          </span>
          <MobileMenu demoSlot={demoSlot} />
        </div>
      </div>
    </header>
  );
}
