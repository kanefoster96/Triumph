import Link from "next/link";
import { CalendarClock } from "lucide-react";
import type { ComplianceRow, ComplianceState } from "@/lib/members/service";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

/**
 * Everyone's week at a glance.
 *
 * Three things are asked of a client on a normal day — the session, the meals,
 * the weigh-in — so a day is three marks, not one. Rolling them into a single
 * traffic light would hide the difference between somebody who trained and
 * forgot the scales and somebody who has stopped altogether, which is the only
 * distinction that matters here.
 *
 * A 30 × 7 grid does not fit a phone, so on small screens the row keeps its
 * seven days but drops to a single summary mark each. The colour language is
 * identical; only the resolution changes.
 */
const TONE: Record<ComplianceState, string> = {
  done: "bg-success",
  partial: "bg-amber",
  todo: "bg-danger",
  none: "bg-line",
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function label(state: ComplianceState, what: string): string {
  if (state === "none") return `No ${what} asked`;
  if (state === "done") return `${what}: done`;
  if (state === "partial") return `${what}: started`;
  return `${what}: not done`;
}

/** One day, as three stacked marks — training, food, weight, in that order. */
function DayCell({ day, href }: { day: ComplianceRow["days"][number]; href: string }) {
  const marks: Array<[ComplianceState, string]> = [
    [day.workout, "training"],
    [day.food, "food"],
    [day.weight, "weight"],
  ];

  return (
    <Link
      href={href}
      title={`${day.date}${day.session ? " · 1:1 booked" : ""}`}
      className={cn(
        "group/cell relative flex flex-col gap-0.5 rounded-lg p-1.5 transition-colors hover:bg-raised",
        // A day that has not happened is shown, never scored.
        day.future && "opacity-35",
      )}
    >
      {marks.map(([state, what]) => (
        <span
          key={what}
          aria-label={label(state, what)}
          className={cn("h-1.5 rounded-full", day.future && state === "todo" ? TONE.none : TONE[state])}
        />
      ))}
      {day.session ? (
        <CalendarClock className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 text-accent" />
      ) : null}
    </Link>
  );
}

export function ComplianceGrid({ rows, weekStart }: { rows: ComplianceRow[]; weekStart: string }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">No clients yet.</p>;
  }

  return (
    <div className="space-y-2">
      {/* The header is the only place the weekdays are named; every row below
          lines up with it, which is what makes the grid readable at all. It is
          a wide-screen thing — on a phone the days sit under the name, where a
          shared header would not line up with anything. */}
      <div className="hidden items-center gap-3 px-1 sm:flex">
        <span className="min-w-0 flex-1" />
        <div className="grid w-[calc(7*2.75rem)] shrink-0 grid-cols-7">
          {WEEKDAYS.map((day, index) => (
            <span key={index} className="text-center text-[10px] font-semibold text-faint">
              {day}
            </span>
          ))}
        </div>
        <span className="w-14 shrink-0 text-right text-[10px] font-semibold text-faint">WEEK</span>
      </div>

      <ul className="space-y-1.5">
        {rows.map((row) => {
          const rate = row.asked === 0 ? null : Math.round((row.done / row.asked) * 100);
          return (
            /*
             * Stacked on a phone, one line on a wide screen. Seven days of
             * marks and a name cannot share 350px: the name was squeezed to
             * nothing, leaving a list of avatars nobody could read.
             */
            <li
              key={row.profile.id}
              className="rounded-2xl bg-raised p-2.5 sm:flex sm:items-center sm:gap-3 sm:py-1.5 sm:pr-2 sm:pl-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5 sm:flex-1">
                <Link
                  href={`/admin/clients/${row.profile.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <Avatar name={row.profile.fullName} src={row.profile.avatarUrl} size="sm" />
                  <span className="min-w-0 truncate text-sm font-semibold">
                    {row.profile.fullName}
                  </span>
                </Link>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums sm:hidden",
                    rate === null
                      ? "text-faint"
                      : rate >= 80
                        ? "text-success"
                        : rate >= 50
                          ? "text-amber"
                          : "text-danger",
                  )}
                >
                  {rate === null ? "—" : `${rate}%`}
                </span>
              </div>

              <div className="mt-1.5 grid grid-cols-7 sm:mt-0 sm:w-[calc(7*2.75rem)] sm:shrink-0">
                {row.days.map((day, index) => (
                  <div key={day.date}>
                    <span className="block text-center text-[10px] font-semibold text-faint sm:hidden">
                      {WEEKDAYS[index]}
                    </span>
                    <DayCell
                      day={day}
                      href={`/admin/clients/${row.profile.id}/plan?week=${weekStart}&date=${day.date}`}
                    />
                  </div>
                ))}
              </div>

              <span
                className={cn(
                  "hidden w-14 shrink-0 text-right text-sm font-semibold tabular-nums sm:block",
                  rate === null
                    ? "text-faint"
                    : rate >= 80
                      ? "text-success"
                      : rate >= 50
                        ? "text-amber"
                        : "text-danger",
                )}
              >
                {rate === null ? "—" : `${rate}%`}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 pt-2 text-[11px] text-faint">
        <span className="font-semibold">Each day, top to bottom: training · food · weight.</span>
        {(
          [
            ["done", "done"],
            ["partial", "started"],
            ["todo", "not done"],
            ["none", "not asked"],
          ] as const
        ).map(([state, text]) => (
          <span key={state} className="inline-flex items-center gap-1.5">
            <span className={cn("h-1.5 w-4 rounded-full", TONE[state])} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
