import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Copy as CopyIcon,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import {
  getExercises,
  getLastEfforts,
  getMeals,
  getPlanBlock,
  getPlanWeek,
  getProfile,
  getRecentNotes,
  mondayOf,
  shiftDate,
  today,
  weekDiff,
} from "@/lib/members/service";
import { bumpPlanWeights, copyPlanWeek, createPlanBlock, savePlanDay } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle, field, fieldLabel } from "@/components/members/ui";
import { Chip } from "@/components/ui/Chip";
import { WeekBoard, type WeekBoardDay } from "@/components/members/WeekBoard";
import { ExercisePlanner, MealPlanner } from "@/components/members/PlanDayEditor";
import { PlanDayForm } from "@/components/members/PlanDayForm";
import { CopyFromClient } from "@/components/members/CopyFromClient";
import { ReviewBanner } from "@/components/members/ReviewBanner";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Day 0 is the block's start date, so its weekday depends on that date. */
function cycleLabel(startsOn: string, dayIndex: number, cycleWeeks: number): string {
  const weekday = WEEKDAYS[(new Date(`${startsOn}T00:00:00Z`).getUTCDay() + 6 + dayIndex) % 7];
  return cycleWeeks === 2 ? `${weekday} · week ${Math.floor(dayIndex / 7) + 1}` : weekday;
}

function longDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function weekLabel(weekStart: string) {
  const end = shiftDate(weekStart, 6);
  const fmt = (date: string, withMonth: boolean) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      ...(withMonth ? { month: "short" as const } : {}),
      timeZone: "UTC",
    });
  const sameMonth = weekStart.slice(0, 7) === end.slice(0, 7);
  return `${fmt(weekStart, !sameMonth)} – ${fmt(end, true)}`;
}

const isDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

export default async function AdminClientPlanPage({
  params,
  searchParams,
}: PageProps<"/admin/clients/[slug]/plan">) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const now = today();
  // Arrived from the weekly review: bring the notes and the way back with him.
  const fromReview = query.review === "1";
  const [block, reviewNotes] = await Promise.all([
    getPlanBlock(profile.id),
    fromReview ? getRecentNotes(profile.id) : Promise.resolve([]),
  ]);

  const banner = fromReview ? (
    <ReviewBanner
      clientId={profile.id}
      clientName={profile.fullName}
      avatarUrl={profile.avatarUrl}
      notes={reviewNotes}
    />
  ) : null;

  if (!block) {
    return (
      <>
        {banner}
        <Panel title="No repeating plan yet">
          <form action={createPlanBlock} className="space-y-4">
            <input type="hidden" name="clientId" value={profile.id} />
            <p className="text-sm text-muted">
              A block repeats until you change it, so it never runs out. The start date is also the
              date it takes over — anything already assigned before then stays exactly as it is.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={fieldLabel} htmlFor="blk-cycle">
                  Cycle
                </label>
                <select id="blk-cycle" className={field} name="cycleWeeks" defaultValue="1">
                  <option value="1">One week</option>
                  <option value="2">Two weeks</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="blk-start">
                  Takes over from
                </label>
                <input id="blk-start" className={field} type="date" name="startsOn" defaultValue={now} />
                {/* Said out loud because the date is adjusted after it is
                    picked, and a field that quietly changes what you typed is
                    worse than one that explains itself. */}
                <p className="mt-2 text-xs text-faint">
                  Blocks run Monday to Sunday, so this moves back to the Monday of whichever week you
                  pick.
                </p>
              </div>
            </div>
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
            >
              Start a repeating plan
            </button>
          </form>
        </Panel>
      </>
    );
  }

  const weekStart = mondayOf(isDate(query.week) ? query.week : now);
  const weekEnd = shiftDate(weekStart, 6);
  // Default to today when it is in view, so the board opens on the day Dean
  // most likely came here about rather than always on Monday.
  const selected =
    isDate(query.date) && query.date >= weekStart && query.date <= weekEnd
      ? query.date
      : now >= weekStart && now <= weekEnd
        ? now
        : weekStart;

  const [week, previousWeek, exercises, meals, efforts] = await Promise.all([
    getPlanWeek(block, weekStart),
    getPlanWeek(block, shiftDate(weekStart, -7)),
    getExercises(),
    getMeals(),
    getLastEfforts(profile.id),
  ]);

  const basePath = `/admin/clients/${profile.id}/plan`;
  const carry = fromReview ? "&review=1" : "";

  const cards: WeekBoardDay[] = week.map((day, index) => {
    const diffs = weekDiff(day.workout, previousWeek[index]?.workout ?? null);
    return {
      date: day.date,
      weekday: WEEKDAYS[index],
      dayNumber: String(Number(day.date.slice(8, 10))),
      href: `${basePath}?week=${weekStart}&date=${day.date}${carry}#day-editor`,
      title: day.workout?.title ?? null,
      exercises: day.workout?.exercises.map((exercise) => exercise.name) ?? [],
      isRest: day.workout?.isRest ?? false,
      calorieTarget: day.food?.calorieTarget ?? null,
      mealCount: day.food?.meals.length ?? 0,
      sessions: day.sessions.map(
        (session) =>
          `1:1 · ${new Date(session.startsAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
      ),
      diffs: [...diffs.entries()].map(([exerciseId, change]) => {
        const name = day.workout?.exercises.find((e) => e.exerciseId === exerciseId)?.name ?? "";
        return change === "new" ? `${name} — new` : `${name} ${change}`;
      }),
      oneOff: Boolean(day.workout?.oneOff || day.food?.oneOff),
      past: day.past,
      unplanned: day.dayIndex === null,
      isToday: day.date === now,
    };
  });

  const day = week.find((entry) => entry.date === selected) ?? null;
  // Pulled out so it narrows: the editor is nested two conditionals deep and
  // `day.dayIndex` had lost its non-null by the time it got there.
  const dayIndex = day?.dayIndex ?? null;
  const editable = day !== null && dayIndex !== null && !day.past;
  const weekdayName = longDate(selected).split(" ")[0];

  return (
    <div className="space-y-5">
      {banner}

      <ScreenTitle
        title="Plan"
        subtitle={`A ${block.cycleWeeks === 2 ? "two week" : "one week"} block repeating from ${block.startsOn}. This is the week it works out to — edit any day and choose how far the change reaches.`}
      />

      {/* The week you are on, and the two either side of it. A block repeats,
          so paging forward is how a change made "from here on" gets checked. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href={`${basePath}?week=${shiftDate(weekStart, -7)}${carry}`}
            aria-label="Previous week"
            className="rounded-full border border-line p-2.5 text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`${basePath}?week=${shiftDate(weekStart, 7)}${carry}`}
            aria-label="Next week"
            className="rounded-full border border-line p-2.5 text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <p className="ml-2 truncate text-sm font-semibold">{weekLabel(weekStart)}</p>
          {weekStart === mondayOf(now) ? (
            <Chip tone="accent">This week</Chip>
          ) : (
            <Link
              href={`${basePath}${fromReview ? "?review=1" : ""}`}
              className="ml-2 shrink-0 text-xs font-semibold text-accent"
            >
              Back to this week
            </Link>
          )}
        </div>

        {/* A block already repeats, so this is for a week that has been changed
            away from it — a deload, a holiday, a fortnight built by hand. */}
        <form action={copyPlanWeek}>
          <input type="hidden" name="clientId" value={profile.id} />
          <input type="hidden" name="from" value={weekStart} />
          <input type="hidden" name="to" value={shiftDate(weekStart, 7)} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <CopyIcon className="h-4 w-4" />
            Repeat onto next week
          </button>
        </form>
      </div>

      <WeekBoard days={cards} selected={selected} clientId={profile.id} review={fromReview}>
        <div id="day-editor" className="scroll-mt-24">
          {day === null || dayIndex === null ? (
            <Panel title={longDate(selected)}>
              <EmptyState>
                This date is before the plan takes over, so there is nothing to edit.
              </EmptyState>
            </Panel>
          ) : !editable ? (
            <Panel title={longDate(selected)}>
              <EmptyState>This day has been and gone. Past days are kept as they were.</EmptyState>
            </Panel>
          ) : (
            /*
             * Keyed on the date. The title, the suggested time, the note and
             * the rest-day box are uncontrolled inputs, so React keeps the DOM
             * node — and its typed-in value — across a navigation that only
             * changes props. Tuesday's title stayed in the field while
             * Thursday's exercises loaded underneath it, and saving wrote it.
             */
            <PlanDayForm
              key={selected}
              action={savePlanDay}
              title={longDate(selected)}
              hidden={
                <>
                  <input type="hidden" name="clientId" value={profile.id} />
                  <input type="hidden" name="dayIndex" value={dayIndex} />
                  <input type="hidden" name="kind" value="both" />
                  <input type="hidden" name="from" value={selected} />
                  {fromReview ? <input type="hidden" name="review" value="1" /> : null}
                </>
              }
              toolbar={
                <>
                  <CopyFromClient clientId={profile.id} date={selected} review={fromReview} />
                  {(
                    [
                      ["day", "this weekday on"],
                      ["week", "this week"],
                      ["everywhere", "every day on"],
                    ] as const
                  ).map(([reach, label]) => (
                    <form key={reach} action={bumpPlanWeights}>
                      <input type="hidden" name="clientId" value={profile.id} />
                      <input type="hidden" name="delta" value="2.5" />
                      <input type="hidden" name="reach" value={reach} />
                      <input type="hidden" name="from" value={reach === "week" ? weekStart : selected} />
                      {reach === "day" ? (
                        <input type="hidden" name="dayIndex" value={dayIndex} />
                      ) : null}
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        +2.5kg {label}
                      </button>
                    </form>
                  ))}
                </>
              }
              training={
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={fieldLabel} htmlFor="pd-title">
                        Title
                      </label>
                      <input
                        id="pd-title"
                        className={field}
                        name="title"
                        defaultValue={day.workout?.title ?? ""}
                        placeholder="Lower body — strength"
                      />
                    </div>
                    <div>
                      <label className={fieldLabel} htmlFor="pd-time">
                        Suggested time (optional)
                      </label>
                      <input
                        id="pd-time"
                        className={field}
                        type="time"
                        name="suggestedTime"
                        defaultValue={day.workout?.suggestedTime ?? ""}
                      />
                    </div>
                  </div>

                  {/* The planners seed their rows once, so moving to another
                      day has to remount them. Without this, tapping Mon → Wed
                      leaves Monday's exercises in the form and saving writes
                      them onto Wednesday. */}
                  <ExercisePlanner
                    key={`w-${selected}`}
                    day={day.workout}
                    exercises={exercises}
                    lastEfforts={Object.fromEntries(
                      [...efforts.entries()].map(([exerciseId, effort]) => [
                        exerciseId,
                        `${effort.on}: ${effort.sets
                          .map((set) => `${set.weightKg ?? 0}×${set.reps ?? 0}`)
                          .join("  ")}`,
                      ]),
                    )}
                  />

                  <div>
                    <label className={fieldLabel} htmlFor="pd-notes">
                      Note to client
                    </label>
                    <textarea
                      id="pd-notes"
                      className={field}
                      name="coachNotes"
                      rows={2}
                      defaultValue={day.workout?.coachNotes ?? ""}
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm text-muted">
                    <input
                      type="checkbox"
                      name="isRest"
                      defaultChecked={day.workout?.isRest ?? false}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    Make this a rest day
                  </label>

                  {day.workout?.exercises.some((exercise) => exercise.archived) ? (
                    <p className="inline-flex items-center gap-2 text-xs text-amber">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      One of these has been archived in the library.
                    </p>
                  ) : null}
                </>
              }
              food={
                <MealPlanner
                  key={`f-${selected}`}
                  day={day.food}
                  meals={meals}
                  calorieTarget={day.food?.calorieTarget ?? null}
                />
              }
              scope={
                <ScopeFields
                  dateLabel={longDate(selected)}
                  weekdayName={weekdayName}
                  startsOn={block.startsOn}
                  cycleWeeks={block.cycleWeeks}
                  dayIndex={dayIndex}
                />
              }
            />
          )}
        </div>
      </WeekBoard>
    </div>
  );
}

/**
 * How far a save reaches, and which other weekdays it also lands on.
 *
 * The board is date-first, so "just this date" leads — the opposite of the old
 * cycle view, where the week was the subject. The weekday chips are the thing
 * that makes setting a client up quick: four food slots that barely change,
 * written to Monday through Friday in one save.
 */
function ScopeFields({
  dateLabel,
  weekdayName,
  startsOn,
  cycleWeeks,
  dayIndex,
}: {
  dateLabel: string;
  weekdayName: string;
  startsOn: string;
  cycleWeeks: number;
  dayIndex: number;
}) {
  const others = Array.from({ length: cycleWeeks * 7 }, (_, i) => i).filter((i) => i !== dayIndex);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-ink p-4">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
          <CalendarRange className="h-3.5 w-3.5" />
          How far does this reach?
        </p>
        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="radio"
              name="scope"
              value="date"
              defaultChecked
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            Just {dateLabel}
          </label>
          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="radio"
              name="scope"
              value="weekday"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            Every {weekdayName} from here on
          </label>
        </div>
        <p className="mt-3 text-xs text-faint">
          Days already gone are never changed, and nothing the client has already logged is
          overwritten.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-ink p-4">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
          <CopyIcon className="h-3.5 w-3.5" />
          Use this for other weekdays too
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {others.map((index) => (
            <label
              key={index}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent has-checked:border-accent has-checked:bg-accent/10 has-checked:text-accent"
            >
              <input
                type="checkbox"
                name="alsoDay"
                value={index}
                className="h-3.5 w-3.5 accent-[var(--color-accent)]"
              />
              {cycleLabel(startsOn, index, cycleWeeks)}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-faint">
          Only applies to &ldquo;every {weekdayName} from here on&rdquo; — one date is one weekday,
          so there is nothing to spread.
        </p>
      </div>
    </div>
  );
}
