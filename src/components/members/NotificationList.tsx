"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Bell } from "lucide-react";
import type { Notification } from "@/lib/members/types";
import { cn } from "@/lib/utils";

function when(iso: string) {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Everything sent to whoever is reading, newest first.
 *
 * Opening the list is what marks it read — there is no button, because there
 * is nothing a person would do with one. The mark is a single timestamp, so
 * anything that arrives while the page is open is still new next time.
 */
export function NotificationList({
  notifications,
  readAt,
  markRead,
}: {
  notifications: Notification[];
  readAt: string | null;
  markRead: () => Promise<void>;
}) {
  useEffect(() => {
    void markRead();
  }, [markRead]);

  if (notifications.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-faint">
        <Bell className="mx-auto mb-2 h-5 w-5" />
        Nothing yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {notifications.map((notification) => {
        const unread = !readAt || notification.createdAt > readAt;
        const inner = (
          <>
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-semibold">{notification.title}</span>
              <span className="shrink-0 text-xs text-faint">{when(notification.createdAt)}</span>
            </span>
            {notification.body ? (
              <span className="mt-1 block text-sm text-muted">{notification.body}</span>
            ) : null}
            <span className="mt-1 block text-xs text-faint">{notification.sentByName}</span>
          </>
        );

        return (
          <li key={notification.id}>
            {notification.actionHref ? (
              <Link
                href={notification.actionHref as never}
                className={cn(
                  "block rounded-2xl border bg-ink p-4 transition-colors hover:border-accent/40",
                  unread ? "border-accent/40" : "border-line",
                )}
              >
                {inner}
              </Link>
            ) : (
              <div
                className={cn(
                  "rounded-2xl border bg-ink p-4",
                  unread ? "border-accent/40" : "border-line",
                )}
              >
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
