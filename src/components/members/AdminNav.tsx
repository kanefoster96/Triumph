"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ClipboardCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Clients", icon: Users },
  { href: "/admin/checkin", label: "Check-ins", icon: ClipboardCheck },
  { href: "/admin/library", label: "Library", icon: BookOpen },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  // Templates are the older way of assigning a day and are on their way out,
  // but the check-in round and the Food tab still read from them, so the page
  // that maintains them has to be reachable rather than URL-only.
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="no-scrollbar flex items-center gap-1 overflow-x-auto">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              active ? "bg-accent/10 text-accent" : "text-muted hover:text-text",
            )}
          >
            <link.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
