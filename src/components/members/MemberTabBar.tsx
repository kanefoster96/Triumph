"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, LineChart, Salad, CalendarDays } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export interface MemberTab {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * The five member tabs. This array is the app's navigation too — a React
 * Navigation tab navigator can be built from it directly.
 */
export const memberTabs: MemberTab[] = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/app/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/app/food", label: "Food", icon: Salad },
  { href: "/app/weight", label: "Weight", icon: LineChart },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

/** Bottom tab bar on mobile. */
export function MemberTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink px-2 pt-2 md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {memberTabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href} className="min-w-0 flex-1">
              <Link
                href={tab.href}
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
                <tab.icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate text-[11px] font-semibold tracking-tight">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The same tabs as a horizontal row on desktop. */
export function MemberTabsInline() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
      {memberTabs.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
              active ? "bg-accent/10 text-accent" : "text-muted hover:text-text",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
