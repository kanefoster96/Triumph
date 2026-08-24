import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import type { ClientNote } from "@/lib/members/types";
import { relativeDate } from "@/lib/utils";
import { Avatar } from "./Avatar";

/**
 * The reason Dean opened this page, kept in front of him while he works.
 *
 * A weekly review is read-then-change: he sees "struggled with the salmon
 * again", opens the food plan, and by the time he is picking meals the wording
 * of it is two screens behind him. So the notes come with him, and so does the
 * way back — the review is the place he is working through, and losing it
 * means finding his place in a list of thirty again.
 *
 * Only shown when he arrived from the review. On its own the food tab is not
 * about the notes and this would just be clutter.
 */
export function ReviewBanner({
  clientId,
  clientName,
  avatarUrl,
  notes,
}: {
  clientId: string;
  clientName: string;
  avatarUrl?: string | null;
  notes: ClientNote[];
}) {
  return (
    <div className="mb-5 rounded-[var(--radius-sheet)] bg-accent/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={clientName} src={avatarUrl} size="sm" />
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-accent">
            <MessageSquareText className="h-3.5 w-3.5" />
            What {clientName.split(" ")[0]} said
          </p>
        </div>
        <Link
          href={`/admin/checkin#client-${clientId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the review
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          They haven&rsquo;t written anything in the last fortnight.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {notes.slice(0, 5).map((note) => (
            <li key={note.id}>
              <p className="text-xs text-faint">
                {relativeDate(note.on)}
                {note.context ? ` · ${note.context}` : ""}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
