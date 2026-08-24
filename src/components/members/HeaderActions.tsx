"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Bell, MessageSquare, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

/**
 * The three things in the header that can change while you are looking at
 * something else.
 *
 * Counts arrive from the server with the page and are nudged by Realtime after
 * that, so a message landing while somebody is reading their food plan puts a
 * number on the header rather than waiting for the next navigation. Both
 * subscriptions are namespaced by `useId`, because this component renders once
 * in the header and once inside the phone menu on some screens — two channels
 * of the same name would be one subscription, and only one of them would ever
 * hear anything.
 */
export function HeaderActions({
  base,
  chatHref,
  unreadChat,
  unreadNotifications,
  boardHref,
}: {
  /** "/app" or "/admin" — only used to keep the labels honest. */
  base: "/app" | "/admin";
  chatHref: string;
  unreadChat: number;
  unreadNotifications: number;
  /** Null when this person cannot see the board. */
  boardHref: string | null;
}) {
  const [chat, setChat] = useState(unreadChat);
  const [notes, setNotes] = useState(unreadNotifications);
  const [fromServer, setFromServer] = useState({ chat: unreadChat, notes: unreadNotifications });
  const channelId = useId();
  const asCoach = base === "/admin";

  // The server is the source of truth. When it hands down a new count — a
  // navigation, a revalidation after marking read — take it, or a badge
  // cleared somewhere else would stay lit here. Adjusted during the render
  // that brought the new value rather than in an effect, so the badge never
  // paints once with the old number and again with the new one.
  if (fromServer.chat !== unreadChat || fromServer.notes !== unreadNotifications) {
    setFromServer({ chat: unreadChat, notes: unreadNotifications });
    setChat(unreadChat);
    setNotes(unreadNotifications);
  }

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`header:${base}:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          // Your own message is not something waiting for you.
          if (Boolean((payload.new as { from_coach?: boolean }).from_coach) === asCoach) return;
          setChat((count) => count + 1);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => setNotes((count) => count + 1),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [base, channelId, asCoach]);

  return (
    <div className="flex items-center gap-1">
      {boardHref ? (
        <IconLink href={boardHref} label="The board" icon={Users} />
      ) : null}
      <IconLink href={chatHref} label="Messages" icon={MessageSquare} count={chat} />
      <IconLink href={`${base}/notifications`} label="Notifications" icon={Bell} count={notes} />
    </div>
  );
}

function IconLink({
  href,
  label,
  icon: Icon,
  count = 0,
}: {
  href: string;
  label: string;
  icon: typeof Bell;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} — ${count} new` : label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:text-text"
    >
      <Icon className="h-5 w-5" />
      {count > 0 ? (
        <span
          className={cn(
            "absolute top-1.5 right-1.5 inline-flex h-4 min-w-4 items-center justify-center",
            "rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink",
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
