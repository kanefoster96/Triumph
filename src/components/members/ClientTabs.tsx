"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, History, Home, LineChart, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dean's view of one client.
 *
 * Plan is the one place a day is changed — training and food together — so
 * there is no second editor to keep in step with it and no way to edit the
 * same Tuesday from two screens. History answers a different question
 * ("how did it actually go") and never writes anything.
 */
export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;

  const tabs = [
    { href: base, label: "Overview", icon: Home },
    { href: `${base}/plan`, label: "Plan", icon: ListChecks },
    { href: `${base}/sessions`, label: "Sessions", icon: CalendarDays },
    { href: `${base}/history`, label: "What they did", icon: History },
    { href: `${base}/weight`, label: "Weight", icon: LineChart },
  ];

  return (
    <nav aria-label="Client sections" className="no-scrollbar -mx-1 mb-5 overflow-x-auto px-1 sm:mb-8">
      <ul className="flex w-max min-w-full gap-1 rounded-full bg-surface p-1">
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
