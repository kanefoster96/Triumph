"use client";

import { useState } from "react";
import { CalendarSync, Check, X } from "lucide-react";
import { cancelDaySwap, requestDaySwap } from "@/lib/members/actions";
import type { SwapRequest } from "@/lib/members/types";
import { BottomSheet } from "./BottomSheet";
import { field, fieldLabel } from "./ui";

/**
 * "I can't train today — can I do it tomorrow?"
 *
 * Asking used to mean writing it in a comment and hoping, and the plan carried
 * on saying Monday while the client trained on Tuesday. This asks properly:
 * Dean gets it as a request he answers in one tap, and an approval actually
 * moves the day.
 *
 * A request, never a change. The client picks the day they want; whether the
 * week bends is still coaching.
 */
export function MoveWorkout({
  fromDate,
  title,
  options,
  pending,
}: {
  fromDate: string;
  title: string;
  /** The days they may ask for: date plus how it should read. */
  options: Array<{ date: string; label: string }>;
  pending: SwapRequest | null;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  if (pending) {
    return (
      <div className="rounded-2xl bg-amber/10 p-4">
        <p className="text-sm font-semibold text-amber">Asked Dean to move this</p>
        <p className="mt-1 text-sm text-muted">
          You asked to do it on{" "}
          {new Date(`${pending.toDate}T12:00:00Z`).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          })}
          . It stays where it is until he says yes.
        </p>
        {pending.reason ? <p className="mt-2 text-sm text-faint">“{pending.reason}”</p> : null}
        <form action={cancelDaySwap} className="mt-3">
          <input type="hidden" name="id" value={pending.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
          >
            <X className="h-4 w-4" />
            Never mind, leave it
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-raised px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent"
      >
        <CalendarSync className="h-4 w-4" />
        Move this workout
      </button>

      {open ? (
        <BottomSheet
          open
          onClose={() => setOpen(false)}
          title="Move this workout"
          description={`${title} — ask Dean to shift it to another day.`}
        >
          {options.length === 0 ? (
            <p className="py-4 text-sm text-faint">No other day to move it to just now.</p>
          ) : (
            <form action={requestDaySwap} className="space-y-5">
              <input type="hidden" name="from" value={fromDate} />

              <div>
                <span className={fieldLabel}>Which day instead?</span>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <label
                      key={option.date}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-raised px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent has-checked:bg-accent/10 has-checked:text-accent"
                    >
                      <input
                        type="radio"
                        name="to"
                        value={option.date}
                        required
                        checked={picked === option.date}
                        onChange={() => setPicked(option.date)}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="swap-reason">
                  Why, if you want to say (optional)
                </label>
                <textarea
                  id="swap-reason"
                  className={field}
                  name="reason"
                  rows={2}
                  maxLength={200}
                  placeholder="Working late — I'd rather do it properly tomorrow."
                />
              </div>

              <button
                type="submit"
                disabled={picked === null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint"
              >
                <Check className="h-4 w-4" />
                Send the request
              </button>

              <p className="text-xs text-faint">
                Nothing changes until Dean says yes. If he does, the day moves for you
                automatically.
              </p>
            </form>
          )}
        </BottomSheet>
      ) : null}
    </>
  );
}
