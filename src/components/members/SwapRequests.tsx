import { CalendarSync, Check, X } from "lucide-react";
import { decideDaySwap } from "@/lib/members/actions";
import type { SwapRequest } from "@/lib/members/types";
import { Avatar } from "./Avatar";

/**
 * Clients waiting on an answer about moving a day.
 *
 * It sits at the top of Dean's home rather than in a notifications drawer
 * because it is the one thing on this screen with somebody waiting at the
 * other end of it. Approving does the move; there is no second step, and no
 * version of this where he says yes and then forgets to change the plan.
 */
function dayName(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function SwapRequests({
  requests,
}: {
  requests: Array<SwapRequest & { clientName: string; avatarUrl: string | null }>;
}) {
  if (requests.length === 0) return null;

  return (
    <section className="mb-5 rounded-[var(--radius-sheet)] border border-amber/40 bg-amber/[0.05]">
      <header className="flex items-center gap-2.5 border-b border-amber/20 px-5 py-3.5">
        <CalendarSync className="h-4 w-4 shrink-0 text-amber" />
        <h2 className="text-sm font-semibold text-amber">
          {requests.length === 1 ? "One client wants to move a day" : `${requests.length} clients want to move a day`}
        </h2>
      </header>

      <ul className="divide-y divide-amber/15">
        {requests.map((request) => (
          /* Stacked on a phone. Side by side, the sentence's `flex-1` let it
             shrink to a column of single words rather than pushing the two
             buttons onto a line of their own. */
          <li key={request.id} className="px-5 py-4 sm:flex sm:items-center sm:gap-3">
            <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
              <Avatar name={request.clientName} src={request.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{request.clientName}</span>{" "}
                  <span className="text-muted">
                    wants {request.title ?? "their session"} moved from {dayName(request.fromDate)}{" "}
                    to {dayName(request.toDate)}.
                  </span>
                </p>
                {request.reason ? (
                  <p className="mt-1 text-sm text-faint">&ldquo;{request.reason}&rdquo;</p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">
              {(
                [
                  ["approve", "Move it", Check, "bg-accent text-accent-ink hover:bg-accent-strong"],
                  ["decline", "Keep it", X, "border border-line text-muted hover:text-text"],
                ] as const
              ).map(([decision, label, Icon, tone]) => (
                <form key={decision} action={decideDaySwap}>
                  <input type="hidden" name="id" value={request.id} />
                  <input type="hidden" name="decision" value={decision} />
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
