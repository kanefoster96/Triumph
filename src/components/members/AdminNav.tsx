"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ClipboardCheck, Inbox, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Clients", icon: Users },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/checkin", label: "Check-ins", icon: ClipboardCheck },
  { href: "/admin/library", label: "Library", icon: BookOpen },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
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
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200",
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
