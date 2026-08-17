"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, LineChart, Salad, CalendarDays } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { DayProgress, DayTaskState } from "@/lib/members/types";

export interface MemberTab {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Which part of the day this tab is responsible for, if any. */
  task?: "workout" | "food" | "weight";
}

/**
 * The five member tabs. This array is the app's navigation too — a React
 * Navigation tab navigator can be built from it directly.
 */
export const memberTabs: MemberTab[] = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/app/workouts", label: "Workouts", icon: Dumbbell, task: "workout" },
  { href: "/app/food", label: "Food", icon: Salad, task: "food" },
  { href: "/app/weight", label: "Weight", icon: LineChart, task: "weight" },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

/**
 * The bar above each tab reports the day rather than just marking the page
 * you are on: amber while something is outstanding, green once it is done.
 * A tab with nothing asked of it today stays quiet — nagging about a rest day
 * is how a signal stops being read.
 */
function barTone(state: DayTaskState | undefined, active: boolean): string {
  if (state === "done") return "bg-success opacity-100";
  if (state === "todo") return "bg-amber opacity-100";
  return active ? "bg-accent opacity-100" : "opacity-0";
}

function stateLabel(state: DayTaskState | undefined): string {
  if (state === "done") return " — done today";
  if (state === "todo") return " — still to do today";
  return "";
}

/** Bottom tab bar on mobile. */
export function MemberTabBar({ progress }: { progress?: DayProgress }) {
  const pathname = usePathname();
  // Everything is in: the home tab pulses until they close the day out.
  const readyToSubmit = Boolean(progress?.allDone && !progress.submittedAt);

  return (
    <nav
      aria-label="Sections"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink px-2 pt-2 md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {memberTabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          const state = tab.task && progress ? progress[tab.task] : undefined;
          const pulsing = tab.href === "/app" && readyToSubmit;

          return (
            <li key={tab.href} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors duration-200",
                  active ? "text-accent" : state === "done" ? "text-success" : "text-faint",
                  pulsing && "text-accent",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-2 h-0.5 w-8 rounded-full transition-all duration-300 ease-[var(--ease-out-app)]",
                    pulsing ? "animate-day-ready bg-accent opacity-100" : barTone(state, active),
                  )}
                />
                <tab.icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate text-[11px] font-semibold tracking-tight">
                  {tab.label}
                </span>
                <span className="sr-only">
                  {stateLabel(state)}
                  {pulsing ? " — your day is ready to submit" : ""}
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
export function MemberTabsInline({ progress }: { progress?: DayProgress }) {
  const pathname = usePathname();
  const readyToSubmit = Boolean(progress?.allDone && !progress.submittedAt);

  return (
    <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
      {memberTabs.map((tab) => {
        const active = isActive(pathname, tab.href);
        const state = tab.task && progress ? progress[tab.task] : undefined;
        const pulsing = tab.href === "/app" && readyToSubmit;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
              active ? "bg-accent/10 text-accent" : "text-muted hover:text-text",
              !active && state === "done" && "text-success",
              !active && pulsing && "text-accent",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-4 top-0 h-0.5 rounded-full transition-all duration-300",
                pulsing ? "animate-day-ready bg-accent opacity-100" : barTone(state, false),
              )}
            />
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="sr-only">
              {stateLabel(state)}
              {pulsing ? " — your day is ready to submit" : ""}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
