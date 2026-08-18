"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, Home, LineChart, Repeat, Salad } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dean's view of one client, split the same way the client's own app is.
 * Same five sections, in the same order — so what he is editing always maps
 * onto what they are looking at — plus Plan, which is the repeating shape
 * behind all of them and has no client-side counterpart.
 */
export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;

  const tabs = [
    { href: base, label: "Overview", icon: Home },
    { href: `${base}/plan`, label: "Plan", icon: Repeat },
    { href: `${base}/sessions`, label: "Sessions", icon: CalendarDays },
    { href: `${base}/workouts`, label: "Workouts", icon: Dumbbell },
    { href: `${base}/food`, label: "Food", icon: Salad },
    { href: `${base}/weight`, label: "Weight", icon: LineChart },
  ];

  return (
    <nav aria-label="Client sections" className="no-scrollbar -mx-1 mb-5 overflow-x-auto px-1 sm:mb-8">
      <ul className="flex w-max min-w-full gap-1 rounded-full border border-line bg-surface p-1">
        {tabs.map((tab) => {
          const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                  active ? "bg-accent text-accent-ink" : "text-muted hover:text-text",
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
