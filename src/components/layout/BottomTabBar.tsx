"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, Home, MessageCircle, Tag } from "lucide-react";
import type { ComponentType } from "react";
import { nav, type NavItem } from "@/lib/data/site";
import { cn } from "@/lib/utils";

const icons: Record<NavItem["icon"], ComponentType<{ className?: string }>> = {
  home: Home,
  dumbbell: Dumbbell,
  chart: BarChart3,
  tag: Tag,
  message: MessageCircle,
};

/**
 * Mobile tab bar. Mirrors `nav` exactly, so the React Native app can build its
 * tab navigator from the same array and land on matching routes.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    // Solid rather than translucent: content scrolling under a blurred bar
    // ghosts badly on browsers that skip backdrop-filter.
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink px-2 pt-2 md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {nav.map((item) => {
          const Icon = icons[item.icon];
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors duration-200",
                  active ? "text-accent" : "text-faint",
                )}
              >
                <span
                  className={cn(
                    "absolute -top-2 h-0.5 w-8 rounded-full transition-all duration-300 ease-[var(--ease-out-app)]",
                    active ? "bg-accent opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate text-[11px] font-semibold tracking-tight">
                  {item.short}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
