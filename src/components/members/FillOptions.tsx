"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CopyPlus, Loader2, PenLine } from "lucide-react";
import { copyLastLike } from "@/lib/members/actions";
import { CopyFromClient } from "./CopyFromClient";

/**
 * Three ways to fill this part of a day, offered on every day.
 *
 * Building a day from a blank set of fields is most of the work, and it is
 * work Dean has usually already done: this Monday is normally last Monday with
 * a bit more weight on it. So the fast path leads — copy the last one — with
 * somebody else's day and a clean sheet beside it.
 *
 * `Copy last …` calls the action directly rather than posting a form of its
 * own: this sits inside the day's form, and a form inside a form is dropped by
 * the browser without a word. `Start blank` is a link for the same reason, and
 * because the fields it clears are rendered on the server.
 */
export function FillOptions({
  clientId,
  date,
  kind,
  weekdayName,
  hasLast,
  blankHref,
  review,
}: {
  clientId: string;
  date: string;
  kind: "workout" | "food";
  /** "Monday", for the copy button's own label. */
  weekdayName: string;
  /** Whether there is an earlier one of this weekday worth copying. */
  hasLast: boolean;
  /** Where "start blank" goes — the same day with this part emptied. */
  blankHref: string;
  review: boolean;
}) {
  const [copying, startCopy] = useTransition();

  const chip =
    "inline-flex h-11 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold whitespace-nowrap text-muted transition-colors hover:border-accent hover:text-accent";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={!hasLast || copying}
        onClick={() =>
          startCopy(async () => {
            const data = new FormData();
            data.set("clientId", clientId);
            data.set("date", date);
            data.set("kind", kind);
            await copyLastLike(data);
          })
        }
        title={hasLast ? undefined : `Nothing on a recent ${weekdayName} to copy.`}
        className="inline-flex h-11 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold whitespace-nowrap text-accent-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint"
      >
        {copying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CopyPlus className="h-3.5 w-3.5" />}
        Copy last {weekdayName}
      </button>

      <CopyFromClient clientId={clientId} date={date} review={review} kind={kind} />

      <Link href={blankHref} className={chip}>
        <PenLine className="h-3.5 w-3.5" />
        Start blank
      </Link>
    </div>
  );
}
