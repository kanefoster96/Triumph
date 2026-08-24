import { redirect } from "next/navigation";
import {
  getCoach,
  getCurrentProfile,
  getThreadMessages,
} from "@/lib/members/service";
import {
  attachmentUrl,
  ensureThread,
  fetchNewMessages,
  markChatRead,
  sendChatMessage,
} from "@/lib/members/actions";
import { ChatThread } from "@/components/members/ChatThread";
import { ScreenTitle } from "@/components/members/ui";
import { displayName } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * The client's one conversation with Dean.
 *
 * The thread is opened here rather than at signup: somebody who has never
 * written to him costs nothing, and his inbox is then the people who actually
 * have something to say.
 */
export default async function ChatPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [threadId, coach] = await Promise.all([ensureThread(profile.id), getCoach()]);
  const messages = threadId ? await getThreadMessages(threadId) : [];

  return (
    // Full height rather than a guessed one: the layout is already a column
    // flex down to `main`, so the thread can take exactly what is left and the
    // composer sits on the bottom edge whatever else is on the page — the demo
    // banner, a taller header, a phone with a shorter screen.
    <div className="flex h-full min-h-0 flex-col">
      <ScreenTitle title="Messages" subtitle="Straight to me. I'll get back to you." />

      {threadId ? (
        <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-sheet)] border border-line bg-surface p-4 sm:p-5">
          <ChatThread
            threadId={threadId}
            asCoach={false}
            viewerName={displayName(profile)}
            otherName={coach ? displayName(coach) : "Dean"}
            otherAvatarUrl={coach?.avatarUrl ?? null}
            initialMessages={messages}
            sendAction={sendChatMessage}
            markReadAction={markChatRead}
            fetchNewAction={fetchNewMessages}
            attachmentUrlAction={attachmentUrl}
          />
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-faint">
          Messages are not available right now. Try again in a moment.
        </p>
      )}
    </div>
  );
}
