import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getChatInbox } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { Avatar } from "@/components/members/Avatar";
import type { ChatInboxRow } from "@/lib/members/types";

export const dynamic = "force-dynamic";

function said(iso: string | null) {
  if (!iso) return "No messages yet";
  const when = new Date(iso);
  const days = Math.floor((Date.now() - when.getTime()) / 86_400_000);
  if (days === 0) return when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  return when.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Row({ thread }: { thread: ChatInboxRow }) {
  return (
    <li>
      <Link
        href={`/admin/chat/${thread.id}`}
        className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-ink p-3 transition-colors hover:border-accent/40"
      >
        <Avatar name={thread.clientName} src={thread.avatarUrl} size="md" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-semibold">{thread.clientName}</span>
            <span className="shrink-0 text-xs text-faint">{said(thread.lastMessageAt)}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {thread.preview ?? "No messages yet"}
          </span>
        </span>
        {thread.unread > 0 ? (
          <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-accent px-2 text-xs font-bold text-accent-ink">
            {thread.unread}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * Dean's inbox.
 *
 * Sorted by what is asking something of him rather than by time: a thread with
 * an unread message is work, an open one is a conversation, and one he has
 * marked done is history. Anything new said in a done thread reopens it, so
 * "done" can never hide a question.
 */
export default async function AdminChatPage() {
  const inbox = await getChatInbox();
  const waiting = inbox.filter((thread) => thread.unread > 0);
  const open = inbox.filter((thread) => thread.unread === 0 && !thread.closedAt);
  const done = inbox.filter((thread) => thread.unread === 0 && thread.closedAt);

  return (
    <>
      <ScreenTitle
        title="Messages"
        subtitle={
          waiting.length === 0
            ? "Nothing waiting on you."
            : `${waiting.length} waiting on you`
        }
      />

      <div className="space-y-5">
        <Panel title="Waiting on you">
          {waiting.length === 0 ? (
            <EmptyState>
              <MessageSquare className="mx-auto mb-2 h-5 w-5" />
              Nobody is waiting. Anything new turns up here.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {waiting.map((thread) => (
                <Row key={thread.id} thread={thread} />
              ))}
            </ul>
          )}
        </Panel>

        {open.length > 0 ? (
          <Panel title="Open">
            <ul className="space-y-2">
              {open.map((thread) => (
                <Row key={thread.id} thread={thread} />
              ))}
            </ul>
          </Panel>
        ) : null}

        {done.length > 0 ? (
          <Panel title="Done">
            <ul className="space-y-2">
              {done.map((thread) => (
                <Row key={thread.id} thread={thread} />
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
