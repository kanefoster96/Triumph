"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { nav, secondaryNav, site } from "@/lib/data/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Hamburger menu for the website. (The app navigates with the bottom tab bar
 * in `BottomTabBar` instead.)
 *
 * Mounted only while in use, in two phases so the slide still animates: the
 * panel enters the DOM closed, flips open on the next frame, and unmounts once
 * the slide-out has played.
 */
export function MobileMenu({ demoSlot }: { demoSlot?: ReactNode }) {
  const pathname = usePathname();
  /** Whether the panel is in the DOM at all. */
  const [mounted, setMounted] = useState(false);
  /** Whether it is slid into view. Trails `mounted` by a frame when opening. */
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(() => {
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
    setMounted(true);
    // Mount in the closed position first, then flip on the next frame so the
    // transform has something to animate from.
    requestAnimationFrame(() => setOpen(true));
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Unmount once the slide-out has played. The panel must not linger in the
    // DOM: a fixed element parked off-screen interferes with the page's
    // scroll-into-view behaviour even when it cannot be seen.
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
    unmountTimer.current = setTimeout(() => setMounted(false), 300);
  }, []);

  // Close on navigation, so the panel never hangs over the new page. Adjusted
  // during render rather than in an effect — this also covers back/forward.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
    setMounted(false);
  }

  useEffect(() => {
    if (!open) return;

    // Hold the page still behind the panel.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      // Keep focus inside the panel while it is open.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        aria-expanded={open}
        // Only reference the panel while it exists — a dangling aria-controls
        // points at nothing.
        aria-controls={mounted ? "mobile-menu" : undefined}
        aria-label="Open menu"
        className="grid h-10 w-10 place-items-center rounded-full text-text transition-colors hover:bg-raised md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/*
        Scrim and panel are mounted only while the menu is in use. Keeping a
        fixed, off-screen panel in the DOM interferes with the page's
        scroll-into-view behaviour, and a permanent full-viewport
        backdrop-filter makes the compositor rework the screen every frame.
      */}
      {mounted ? (
        <>
          <div
            onClick={close}
            aria-hidden
            className={cn(
              "fixed inset-0 z-50 bg-ink/70 transition-opacity duration-300 ease-[var(--ease-out-app)] md:hidden",
              open ? "opacity-100 backdrop-blur-sm" : "pointer-events-none opacity-0",
            )}
          />

          <div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            inert={!open}
            className={cn(
              "pb-safe fixed inset-y-0 right-0 z-50 flex w-[84%] max-w-sm flex-col border-l border-line bg-surface",
              "transition-transform duration-300 ease-[var(--ease-out-app)] md:hidden",
              open ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="text-sm font-semibold text-muted">Menu</span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => {
                  close();
                  triggerRef.current?.focus();
                }}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-full text-text transition-colors hover:bg-raised"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Site" className="flex-1 overflow-y-auto px-5 py-6">
              <ul className="space-y-1">
                {nav.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-2xl px-4 py-3.5 text-lg font-semibold transition-colors",
                          active ? "bg-accent/10 text-accent" : "text-text hover:bg-raised",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-8 mb-3 px-4 text-xs font-semibold tracking-[0.16em] text-faint uppercase">
                More
              </p>
              <ul className="space-y-1">
                {secondaryNav
                  .filter((item) => !nav.some((n) => n.href === item.href))
                  .map((item) => (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className="block rounded-2xl px-4 py-2.5 text-sm text-muted transition-colors hover:bg-raised hover:text-text"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>

            </nav>

            <div className="border-t border-line px-5 py-5">
              {/* In the fixed footer rather than the scrolling list: this is a
                  build-time tool, and it should never be below the fold. */}
              {demoSlot ? (
                <div className="mb-5 border-b border-line pb-5">
                  <p className="mb-2 px-4 text-xs font-semibold tracking-[0.16em] text-faint uppercase">
                    Demo logins
                  </p>
                  {demoSlot}
                </div>
              ) : null}

              {/* Three ways in, named for what they do. "Create account" is
                  the quick one and leads; applying for training is a different
                  decision and says so. */}
              <Button href="/signup" fullWidth>
                Create account
              </Button>
              <Button href="/login" variant="secondary" fullWidth>
                Log in
              </Button>
              <Button href="/join" variant="secondary" fullWidth>
                Apply for training
              </Button>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="mt-3 block text-center text-sm text-muted transition-colors hover:text-text"
              >
                {site.phone}
              </a>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
