import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Undo2 } from "lucide-react";
import { getChatInbox, getThreadMessages } from "@/lib/members/service";
import {
  attachmentUrl,
  fetchNewMessages,
  markChatRead,
  sendChatMessage,
  setThreadClosed,
} from "@/lib/members/actions";
import { ChatThread } from "@/components/members/ChatThread";
import { Avatar } from "@/components/members/Avatar";

export const dynamic = "force-dynamic";

export default async function AdminThreadPage({ params }: PageProps<"/admin/chat/[id]">) {
  const { id } = await params;
  const inbox = await getChatInbox();
  const thread = inbox.find((entry) => entry.id === id);
  if (!thread) notFound();

  const messages = await getThreadMessages(thread.id);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/chat"
            aria-label="Back to messages"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Avatar name={thread.clientName} src={thread.avatarUrl} size="md" />
          <div className="min-w-0">
            <h1 className="truncate text-xl">{thread.clientName}</h1>
            {thread.closedAt ? (
              <p className="text-xs text-faint">Marked done</p>
            ) : null}
          </div>
        </div>

        {/* Its own form, outside the thread — the composer is not a form, and
            this must not become the one it submits. */}
        <form action={setThreadClosed}>
          <input type="hidden" name="threadId" value={thread.id} />
          <input type="hidden" name="closed" value={thread.closedAt ? "false" : "true"} />
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {thread.closedAt ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {thread.closedAt ? "Reopen" : "Mark done"}
          </button>
        </form>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-sheet)] border border-line bg-surface p-4 sm:p-5">
        <ChatThread
          threadId={thread.id}
          asCoach
          viewerName="Dean"
          otherName={thread.clientName}
          otherAvatarUrl={thread.avatarUrl}
          initialMessages={messages}
          sendAction={sendChatMessage}
          markReadAction={markChatRead}
          fetchNewAction={fetchNewMessages}
          attachmentUrlAction={attachmentUrl}
        />
      </div>
    </div>
  );
}
