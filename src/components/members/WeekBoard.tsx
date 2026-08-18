"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarClock, Copy, Dumbbell, MoveRight, Pencil, Salad, MoreHorizontal } from "lucide-react";
import { copyPlanDay } from "@/lib/members/actions";
import { BottomSheet } from "./BottomSheet";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

/**
 * One day of the week as the board draws it.
 *
 * Flattened to strings and numbers on the server rather than passed as a
 * `PlanDay`: this crosses into a client component, and a card wants "three
 * exercises, 1,950 kcal" — not the whole plan it was worked out from.
 */
export interface WeekBoardDay {
  date: string;
  /** "Mon" and "18" — the two halves of the card's heading. */
  weekday: string;
  dayNumber: string;
  href: string;
  title: string | null;
  exercises: string[];
  isRest: boolean;
  calorieTarget: number | null;
  mealCount: number;
  sessions: string[];
  /** "Back squat 70 → 72.5kg" against the same weekday last week. */
  diffs: string[];
  oneOff: boolean;
  past: boolean;
  /** Before the block takes over: nothing to show and nothing to edit. */
  unplanned: boolean;
  isToday: boolean;
}

/**
 * A client's week, seen and edited as one thing.
 *
 * The old Plan tab was a stacked list of days above a long form, which meant
 * the week — the unit Dean actually thinks in — was never on screen. Seven
 * columns on a wide screen, a swipeable row of cards on a phone, and the
 * editor for whichever day is open sits underneath, so the week never leaves.
 */
export function WeekBoard({
  days,
  selected,
  clientId,
  review,
  children,
}: {
  days: WeekBoardDay[];
  selected: string | null;
  clientId: string;
  review: boolean;
  /** The editor for the selected day, rendered on the server. */
  children?: ReactNode;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  // Bring the open day into view in the carousel. scrollLeft on the rail
  // itself, not scrollIntoView — that would drag the whole page with it, and
  // the editor below is where the eye is meant to land.
  useEffect(() => {
    if (!selected || !rail.current) return;
    const card = rail.current.querySelector<HTMLElement>(`[data-date="${selected}"]`);
    if (card) rail.current.scrollLeft = card.offsetLeft - 16;
  }, [selected]);

  const open = days.find((day) => day.date === menuFor) ?? null;

  return (
    <div className="space-y-4">
      {/* The strip is the phone's way straight to a day without swiping
          through the ones in between. On a wide screen every card is already
          visible, so it would be a second copy of the same control. */}
      <div className="flex gap-1.5 sm:hidden">
        {days.map((day) => (
          <Link
            key={day.date}
            href={day.href}
            aria-label={`${day.weekday} ${day.dayNumber}`}
            aria-current={day.date === selected ? "page" : undefined}
            className={cn(
              "grid h-11 flex-1 place-items-center rounded-xl border text-xs font-semibold transition-colors",
              day.date === selected
                ? "border-accent bg-accent/15 text-accent"
                : day.isToday
                  ? "border-accent/50 text-accent"
                  : "border-line text-faint",
            )}
          >
            {day.weekday.slice(0, 1)}
          </Link>
        ))}
      </div>

      {/* One row of seven on a wide screen; a snapping carousel below it. The
          negative margin lets a card bleed to the screen edge so the next one
          is visibly half-there — the cue that says "swipe". */}
      <div
        ref={rail}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-7 sm:gap-2 sm:overflow-visible sm:px-0"
      >
        {days.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            active={day.date === selected}
            onMenu={() => setMenuFor(day.date)}
          />
        ))}
      </div>

      {children}

      {open ? (
        <DayMenu
          day={open}
          days={days}
          clientId={clientId}
          review={review}
          onClose={() => setMenuFor(null)}
        />
      ) : null}
    </div>
  );
}

function DayCard({
  day,
  active,
  onMenu,
}: {
  day: WeekBoardDay;
  active: boolean;
  onMenu: () => void;
}) {
  const shown = day.exercises.slice(0, 3);
  const more = day.exercises.length - shown.length;

  return (
    <div
      data-date={day.date}
      className={cn(
        "relative min-w-[78%] snap-start sm:min-w-0",
        // A day already gone is readable but visibly not for editing.
        day.past && "opacity-60",
      )}
    >
      <Link
        href={day.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-full flex-col rounded-2xl border p-3 transition-colors",
          active
            ? "border-accent bg-accent/[0.07]"
            : "border-line bg-ink hover:border-accent/40 hover:bg-raised",
        )}
      >
        {/* Both on the left: the top-right corner belongs to the ⋯ button,
            and a right-aligned date sat underneath it. */}
        <div className="flex items-baseline gap-2 pr-7">
          <span
            className={cn(
              "font-display text-lg leading-none font-bold tabular-nums",
              day.isToday ? "text-accent" : "text-text",
            )}
          >
            {day.dayNumber}
          </span>
          <span className="text-xs font-semibold tracking-[0.1em] text-faint uppercase">
            {day.weekday}
          </span>
        </div>

        {day.unplanned ? (
          <p className="mt-3 text-xs text-faint">Before the plan starts.</p>
        ) : (
          <>
            <p
              className={cn(
                "mt-2.5 line-clamp-2 text-sm font-semibold",
                day.isRest || day.exercises.length === 0 ? "text-faint" : "text-text",
              )}
            >
              {day.isRest || day.exercises.length === 0 ? "Rest" : (day.title ?? "Training")}
            </p>

            {shown.length > 0 ? (
              <ul className="mt-1.5 space-y-0.5">
                {shown.map((name) => (
                  <li key={name} className="truncate text-[11px] text-muted">
                    {name}
                  </li>
                ))}
                {more > 0 ? <li className="text-[11px] text-faint">+{more} more</li> : null}
              </ul>
            ) : null}

            {/* What moved since the same day last week. This is the whole
                point of a block and it used to be invisible. */}
            {day.diffs.length > 0 ? (
              <ul className="mt-2 space-y-0.5">
                {day.diffs.slice(0, 2).map((line) => (
                  <li key={line} className="truncate text-[11px] font-semibold text-accent">
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-auto space-y-1 pt-3">
              {day.calorieTarget || day.mealCount > 0 ? (
                <p className="flex items-center gap-1.5 text-[11px] text-muted tabular-nums">
                  <Salad className="h-3 w-3 shrink-0 text-faint" />
                  {day.calorieTarget ? `${day.calorieTarget.toLocaleString("en-GB")} kcal` : "No target"}
                  {day.mealCount > 0 ? ` · ${day.mealCount}` : ""}
                </p>
              ) : null}

              {day.sessions.map((session) => (
                <p
                  key={session}
                  className="flex items-center gap-1.5 truncate text-[11px] font-semibold text-accent"
                >
                  <CalendarClock className="h-3 w-3 shrink-0" />
                  {session}
                </p>
              ))}

              {day.oneOff ? (
                <p className="text-[11px] text-amber">Changed this week</p>
              ) : null}

              {/* Says what a tap does. Without it the card reads as a summary
                  and the way in is something you have to guess at. */}
              {!day.past ? (
                <span
                  className={cn(
                    "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold",
                    active ? "bg-accent text-accent-ink" : "bg-raised text-accent",
                  )}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </span>
              ) : null}
            </div>
          </>
        )}
      </Link>

      {/* Outside the link, or the whole card would be a button inside a link.
          Hidden on days that cannot receive an edit anyway. */}
      {!day.past && !day.unplanned ? (
        <button
          type="button"
          onClick={onMenu}
          aria-label={`More for ${day.weekday} ${day.dayNumber}`}
          className="absolute top-0 right-0 grid h-11 w-11 place-items-center rounded-full text-faint/70 transition-colors hover:bg-raised hover:text-text"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Copy or move a day onto another one, in two taps.
 *
 * Dragging a card between columns is the obvious desktop gesture and a bad
 * touch one, so both live here instead: pick the action's row, tap the day.
 * Days already gone are not offered — nothing ever writes backwards.
 */
function DayMenu({
  day,
  days,
  clientId,
  review,
  onClose,
}: {
  day: WeekBoardDay;
  days: WeekBoardDay[];
  clientId: string;
  review: boolean;
  onClose: () => void;
}) {
  const targets = days.filter((entry) => entry.date !== day.date && !entry.past && !entry.unplanned);

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={`${day.weekday} ${day.dayNumber}`}
      description="Copy or move this day, workout and meals together."
    >
      {targets.length === 0 ? (
        <p className="py-4 text-sm text-faint">
          No other day left this week to move it to.
        </p>
      ) : (
        <div className="space-y-5">
          {(
            [
              ["copy", "Copy to", Copy, "Keeps this day as well."],
              ["move", "Move to", MoveRight, "Empties this day."],
            ] as const
          ).map(([mode, label, Icon, hint]) => (
            <div key={mode}>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {targets.map((target) => (
                  <form key={target.date} action={copyPlanDay}>
                    <input type="hidden" name="clientId" value={clientId} />
                    <input type="hidden" name="from" value={day.date} />
                    <input type="hidden" name="to" value={target.date} />
                    <input type="hidden" name="mode" value={mode} />
                    {review ? <input type="hidden" name="review" value="1" /> : null}
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      {target.weekday} {target.dayNumber}
                    </button>
                  </form>
                ))}
              </div>
              <p className="mt-2 text-xs text-faint">{hint}</p>
            </div>
          ))}

          <p className="border-t border-line pt-4 text-xs text-faint">
            Changes this week only. To change every week, edit the day and pick &ldquo;every week
            from now on&rdquo;.
          </p>
        </div>
      )}
    </BottomSheet>
  );
}

/** The training/food split shown above the editor, so the day names itself. */
export function DayHeading({ title, meals }: { title: string; meals: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip tone="accent">
        <Dumbbell className="h-3 w-3" />
        {title}
      </Chip>
      <Chip>
        <Salad className="h-3 w-3" />
        {meals} {meals === 1 ? "meal" : "meals"}
      </Chip>
    </div>
  );
}
