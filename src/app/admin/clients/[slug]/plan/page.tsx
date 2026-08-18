import Link from "next/link";
import { notFound } from "next/navigation";
import {
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
        <Panel title="Build their first week">
          <form action={createPlanBlock} className="space-y-4">
            <input type="hidden" name="clientId" value={profile.id} />
            <p className="text-sm text-muted">
              Pick the week to start from. You build a week of training and food, and it carries on
              week after week until you change it — so nobody ever runs out of plan.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={fieldLabel} htmlFor="blk-cycle">
                  How it repeats
                </label>
                <select id="blk-cycle" className={field} name="cycleWeeks" defaultValue="1">
                  <option value="1">The same week, every week</option>
                  <option value="2">Two different weeks, alternating</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="blk-start">
                  Starting
                </label>
                <input id="blk-start" className={field} type="date" name="startsOn" defaultValue={now} />
                {/* Said out loud because the date is adjusted after it is
                    picked, and a field that quietly changes what you typed is
                    worse than one that explains itself. */}
                <p className="mt-2 text-xs text-faint">
                  Weeks run Monday to Sunday, so this moves back to the Monday of whichever week you
                  pick. Anything before that date stays as it is.
                </p>
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong sm:w-auto"
            >
              Start their plan
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
      // edit=1 opens the editor on arrival, which on a phone is the sheet.
      // The board is seven cards tall there, so a tap that only selected the
      // day left the thing you tapped for a screen and a half further down.
      href: `${basePath}?week=${weekStart}&date=${day.date}&edit=1${carry}#day-editor`,
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

      {/* One line, in the words somebody would use. What a "block" is and how
          a cycle repeats is the app's business, not Dean's. */}
      <ScreenTitle
        title="Plan"
        subtitle="Tap a day to edit it. Repeat onto next week to carry it forward, then tweak."
      />

      {/* Which week, and what to do with it. Sticky under the app header so
          paging and repeating stay reachable once the board is scrolled — on
          a phone this row is otherwise the first thing to leave the screen.
          -mx-5 lets the bar span the gutter it is pinned across. */}
      <div className="sticky top-[var(--admin-header-h)] z-20 -mx-5 flex flex-col gap-1.5 border-b border-line bg-ink/95 px-5 py-2 supports-[backdrop-filter]:bg-ink/75 supports-[backdrop-filter]:backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:rounded-2xl sm:border sm:px-3">
        {/* Which week, said in full. It shared a line with the pager and the
            Repeat button on a phone and was the thing that lost — "17 – 2…"
            is not a week. */}
        <p className="flex items-center gap-2 text-sm font-semibold sm:order-2 sm:min-w-0">
          <span className="truncate">{weekLabel(weekStart)}</span>
          {weekStart === mondayOf(now) ? <Chip tone="accent">This week</Chip> : null}
        </p>

        <div className="flex items-center justify-between gap-2 sm:order-1 sm:justify-start">
          <div className="flex min-w-0 items-center gap-1">
            {/* Named, not just arrows. Two chevrons either side of a date range
                is a puzzle the first time you meet it. */}
            <Link
              href={`${basePath}?week=${shiftDate(weekStart, -7)}${carry}`}
              className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full border border-line pr-3 pl-2 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous week</span>
              <span className="sm:hidden">Prev</span>
            </Link>
            <Link
              href={`${basePath}?week=${shiftDate(weekStart, 7)}${carry}`}
              className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full border border-line pr-2 pl-3 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <span className="hidden sm:inline">Next week</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            {weekStart === mondayOf(now) ? null : (
              <Link
                href={`${basePath}${fromReview ? "?review=1" : ""}`}
                className="ml-1 inline-flex h-11 shrink-0 items-center px-2 text-xs font-semibold text-accent"
              >
                This week
              </Link>
            )}
          </div>

          {/* A block already repeats, so this is for a week that has been changed
              away from it — a deload, a holiday, a fortnight built by hand. */}
          <form action={copyPlanWeek} className="shrink-0">
            <input type="hidden" name="clientId" value={profile.id} />
            <input type="hidden" name="from" value={weekStart} />
            <input type="hidden" name="to" value={shiftDate(weekStart, 7)} />
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <CopyIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Repeat onto next week</span>
              <span className="sm:hidden">Repeat</span>
            </button>
          </form>
        </div>
      </div>

      <WeekBoard days={cards} selected={selected} clientId={profile.id} review={fromReview}>
        <div id="day-editor" className="scroll-mt-24">
          {day === null || dayIndex === null ? (
            <Panel title={longDate(selected)}>
              <EmptyState>
                Nothing to edit here — this day is before {profile.fullName.split(" ")[0]} started.
              </EmptyState>
            </Panel>
          ) : !editable ? (
            <Panel title={longDate(selected)}>
              <EmptyState>This day has already happened, so it stays as it was.</EmptyState>
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
              subtitle={[
                day.workout?.isRest || (day.workout?.exercises.length ?? 0) === 0
                  ? "Rest day"
                  : `${day.workout?.exercises.length} ${day.workout?.exercises.length === 1 ? "exercise" : "exercises"}`,
                `${day.food?.meals.length ?? 0} ${(day.food?.meals.length ?? 0) === 1 ? "meal" : "meals"}`,
                day.food?.calorieTarget ? `${day.food.calorieTarget.toLocaleString("en-GB")} kcal` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              defaultOpen={query.edit === "1"}
              trainingHint={
                day.workout?.isRest || (day.workout?.exercises.length ?? 0) === 0
                  ? "Rest day"
                  : `${day.workout?.title ?? "Training"} · ${day.workout?.exercises.length} ${
                      day.workout?.exercises.length === 1 ? "exercise" : "exercises"
                    }`
              }
              foodHint={
                (day.food?.meals.length ?? 0) === 0
                  ? "No meals set"
                  : `${day.food?.meals.length} meals${
                      day.food?.calorieTarget
                        ? ` · ${day.food.calorieTarget.toLocaleString("en-GB")} kcal`
                        : ""
                    }`
              }
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
                        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-4 text-xs font-semibold whitespace-nowrap text-muted transition-colors hover:border-accent hover:text-accent"
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
              scope={<ApplyTo weekdayName={weekdayName} />}
            />
          )}
        </div>
      </WeekBoard>
    </div>
  );
}

/**
 * Where this save lands.
 *
 * One question, two answers, in the words somebody would use out loud. What
 * used to be here explained the model — reaches, weekdays from here on, a
 * shape of the week — and every one of those words is the app's vocabulary
 * rather than Dean's. Underneath it is the same two scopes it always was.
 */
function ApplyTo({ weekdayName }: { weekdayName: string }) {
  return (
    <div className="space-y-2">
      {(
        [
          ["date", "Just this week", `Only this ${weekdayName} changes.`],
          ["weekday", "Every week from now on", `Every ${weekdayName} from here changes.`],
        ] as const
      ).map(([value, title, hint], index) => (
        <label
          key={value}
          className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-ink p-4 transition-colors hover:border-accent/40 has-checked:border-accent has-checked:bg-accent/[0.07]"
        >
          <input
            type="radio"
            name="scope"
            value={value}
            defaultChecked={index === 0}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="block text-xs text-faint">{hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
