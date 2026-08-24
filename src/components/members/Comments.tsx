import { addComment } from "@/lib/members/actions";
import type { Comment, CommentTarget } from "@/lib/members/types";
import { relativeDate } from "@/lib/utils";
import { Avatar } from "./Avatar";

/**
 * Dean's comments on a client's note. Rendered under whatever they relate to —
 * a workout, a food log or a weight entry.
 */
export function CommentThread({
  comments,
  clientId,
  targetType,
  targetId,
  canReply = false,
  placeholder = "Reply to this note…",
}: {
  comments: Comment[];
  clientId: string;
  targetType: CommentTarget;
  targetId: string;
  canReply?: boolean;
  /** What the reply box invites. A check-in asks for more than a note does. */
  placeholder?: string;
}) {
  if (comments.length === 0 && !canReply) return null;

  return (
    <div className="mt-4">
      {comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 rounded-2xl bg-raised p-4">
              {/* Who said it, rather than a generic speech bubble on every
                  line — a thread is two people and it should look like it. */}
              <Avatar name={comment.authorName} size="sm" />
              <div className="min-w-0">
                <p className="text-xs text-faint">
                  <span className="font-semibold text-text">{comment.authorName}</span> ·{" "}
                  {relativeDate(comment.createdAt.slice(0, 10))}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {canReply ? (
        <form
          action={async (formData: FormData) => {
            "use server";
            await addComment(clientId, targetType, targetId, String(formData.get("body") ?? ""));
          }}
          className="mt-3 flex gap-2"
        >
          <input
            name="body"
            required
            placeholder={placeholder}
            aria-label={placeholder}
            className="min-w-0 flex-1 rounded-full bg-raised px-4 py-2.5 text-sm transition-colors placeholder:text-faint"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
          >
            Send
          </button>
        </form>
      ) : null}
    </div>
  );
}
