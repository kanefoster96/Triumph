import Link from "next/link";
import { CalendarClock, ChevronRight, MessageSquare, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/** One collapsed row: what is on the day, in one line. */
export interface PlanListRow {
  date: string;
  /** "Mon 25 Aug". */
  label: string;
  /** "Lower body · 1,950 kcal", or "Rest". */
  summary: string;
  href: string;
  isRest: boolean;
  noteCount: number;
  sessions: string[];
  /** Written for this date alone rather than inherited from the weekday. */
  oneOff: boolean;
  past: boolean;
  isToday: boolean;
}

/**
 * A plan as a list of days.
 *
 * One line each, collapsed, in date order — no weeks to page through and no
 * cycle to hold in your head. The open day expands in place, so the days
 * either side of it stay visible while it is being edited.
 */
export function PlanDayList({
  rows,
  open,
  children,
}: {
  rows: PlanListRow[];
  /** The date currently expanded, if any. */
  open: string | null;
  /** The editor, rendered in place of that day's row. */
  children: React.ReactNode;
}) {
  return (
    <ol className="space-y-2">
      {rows.map((row) => (
        <li key={row.date} id={`day-${row.date}`} className="scroll-mt-32">
          {row.date === open ? (
            children
          ) : (
            <Link
              href={row.href}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-[var(--radius-sheet)] bg-surface px-4 py-3 transition-colors hover:bg-raised",
                row.past && "opacity-60",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      row.isToday ? "text-accent" : "text-text",
                    )}
                  >
                    {row.label}
                  </span>
                  {row.isToday ? (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      Today
                    </span>
                  ) : null}
                  {row.noteCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      <MessageSquare className="h-3 w-3" />
                      {row.noteCount === 1 ? "Left you a note" : `${row.noteCount} notes`}
                    </span>
                  ) : null}
                  {row.oneOff ? (
                    <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-semibold text-amber">
                      Just this day
                    </span>
                  ) : null}
                </span>

                <span
                  className={cn(
                    "mt-0.5 block truncate text-sm",
                    row.isRest ? "text-faint" : "text-muted",
                  )}
                >
                  {row.summary}
                </span>

                {row.sessions.map((session) => (
                  <span
                    key={session}
                    className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-accent"
                  >
                    <CalendarClock className="h-3 w-3 shrink-0" />
                    {session}
                  </span>
                ))}
              </span>

              {/* Says what a tap does. Without it the row reads as a summary
                  and the way in is something you have to guess at. */}
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-xs font-semibold text-accent sm:inline-flex">
                <Pencil className="h-3 w-3" />
                Edit
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-faint sm:hidden" />
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

/** A day's one-line summary, built the same way everywhere it is shown. */
export function summarise(
  workout: { isRest: boolean; title: string | null; exercises: unknown[] },
  food: { calorieTarget: number | null; meals: unknown[] },
): string {
  const parts: string[] = [];

  if (workout.isRest || workout.exercises.length === 0) parts.push("Rest");
  else parts.push(workout.title ?? "Training");

  /*
   * The target, or the meal count, but not both. Three facts do not fit on one
   * line at phone width and the third was landing as "1,9…", which is worse
   * than not saying it.
   */
  if (food.calorieTarget) parts.push(`${food.calorieTarget.toLocaleString("en-GB")} kcal`);
  else if (food.meals.length > 0) {
    parts.push(`${food.meals.length} ${food.meals.length === 1 ? "meal" : "meals"}`);
  }

  return parts.join(" · ");
}
