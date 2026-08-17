import { CheckCheck, TriangleAlert } from "lucide-react";
import { submitDay } from "@/lib/members/actions";

/**
 * Closing out a day that did not go to plan.
 *
 * Folded away by default so it never competes with actually doing the thing —
 * but always there, because a day that cannot be finished is a day the client
 * either abandons or lies about. Opening it says plainly what is going down as
 * missed, and asks why.
 *
 * A `details` element rather than a modal: it works with no JavaScript, and the
 * note being `required` means the browser refuses an empty reason without a
 * round trip. The server checks the same thing, since a form can be posted
 * without a browser.
 */
export function FinishAnyway({ date, missed }: { date: string; missed: string[] }) {
  return (
    <details className="group mb-6 rounded-[var(--radius-sheet)] border border-line bg-surface">
      <summary className="cursor-pointer list-none p-5 text-sm font-semibold text-muted transition-colors hover:text-text">
        Done for today anyway?
        <span className="mt-1 block text-xs font-normal text-faint">
          You can close the day out with things unticked — Dean just needs to know why.
        </span>
      </summary>

      <div className="border-t border-line p-5">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-amber uppercase">
          <TriangleAlert className="h-3.5 w-3.5" />
          Going down as missed
        </p>
        <ul className="mt-3 space-y-1.5">
          {missed.map((item) => (
            <li key={item} className="text-sm text-muted">
              {item}
            </li>
          ))}
        </ul>

        <form action={submitDay} className="mt-5">
          <input type="hidden" name="date" value={date} />
          <label
            htmlFor="finish-note"
            className="mb-2 block text-xs font-semibold tracking-[0.14em] text-faint uppercase"
          >
            What happened?
          </label>
          <textarea
            id="finish-note"
            name="note"
            rows={3}
            required
            placeholder="Didn't have the salmon in, and I was out at lunch."
            className="w-full rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <p className="mt-2 text-xs text-faint">
            This is not a telling off. Dean uses it to change the plan — if a meal keeps getting
            missed, it is the wrong meal.
          </p>
          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
          >
            <CheckCheck className="h-4 w-4" />
            Finish my day
          </button>
        </form>
      </div>
    </details>
  );
}
