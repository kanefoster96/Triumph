import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronUp, Lock, TrendingUp, TriangleAlert } from "lucide-react";
import {
  findLastLike,
  getExercises,
  getLastEfforts,
  getMeals,
  getPlanDays,
  getProfile,
  getRecentNotes,
  mondayOf,
  shiftDate,
  today,
  weekdayOf,
} from "@/lib/members/service";
import { bumpPlanWeights, savePlanDay } from "@/lib/members/actions";
import { ScreenTitle, field, fieldLabel } from "@/components/members/ui";
import { PlanDayList, summarise, type PlanListRow } from "@/components/members/PlanDayList";
import { ExercisePlanner, MealPlanner } from "@/components/members/PlanDayEditor";
import { PlanDayForm } from "@/components/members/PlanDayForm";
import { FillOptions } from "@/components/members/FillOptions";
import { DayNotes } from "@/components/members/DayNotes";
import { ReviewBanner } from "@/components/members/ReviewBanner";

export const dynamic = "force-dynamic";

/** How many days a page of the plan shows, and how far the arrows move. */
const PAGE = 14;

function rowLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function longDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function weekdayName(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
}

/** The same day with nothing on it — what "start blank" renders. */
function emptyDay<T extends { exercises: unknown[]; meals: unknown[] }>(day: T): T {
  return {
    ...day,
    title: null,
    suggestedTime: null,
    coachNotes: null,
    calorieTarget: null,
    proteinTarget: null,
    isRest: false,
    exercises: [],
    meals: [],
  };
}

/** The next time this weekday comes round, from today. */
function nextSame(date: string, now: string): string {
  let cursor = shiftDate(now, 1);
  while (weekdayOf(cursor) !== weekdayOf(date)) cursor = shiftDate(cursor, 1);
  return cursor;
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
  const firstName = profile.fullName.split(" ")[0];
  // Arrived from the weekly review: bring the notes and the way back with him.
  const fromReview = query.review === "1";

  /*
   * Where the list starts. From the Monday of this week by default, so the
   * days just gone — the ones carrying the notes he is answering — are on the
   * same screen as the days he is about to build.
   */
  const selected = isDate(query.date) ? query.date : null;
  /*
   * A link straight to a date — from the check-in card, the sessions tab, a
   * bookmark — has to land on a page that contains it, or the day opens onto
   * nothing at all.
   */
  const requested = isDate(query.from) ? mondayOf(query.from) : mondayOf(now);
  const from =
    selected && (selected < requested || selected >= shiftDate(requested, PAGE))
      ? mondayOf(selected)
      : requested;
  // "Start blank" empties one half of the open day's fields, server-side, so
  // there is no second copy of the editor rendered on the chance he taps it.
  const blank = query.blank === "workout" || query.blank === "food" ? query.blank : null;

  const [days, reviewNotes] = await Promise.all([
    getPlanDays(profile.id, from, PAGE),
    fromReview ? getRecentNotes(profile.id) : Promise.resolve([]),
  ]);

  const basePath = `/admin/clients/${profile.id}/plan`;
  const carry = fromReview ? "&review=1" : "";
  const page = (start: string) => `${basePath}?from=${start}${carry}`;

  const rows: PlanListRow[] = days.map((day) => ({
    date: day.date,
    label: rowLabel(day.date),
    summary: summarise(day.workout, day.food),
    href: `${page(from)}&date=${day.date}#day-${day.date}`,
    isRest: day.workout.isRest || day.workout.exercises.length === 0,
    noteCount: day.notes.length,
    sessions: day.sessions.map(
      (session) =>
        `1:1 · ${new Date(session.startsAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
    ),
    oneOff: day.workout.oneOff || day.food.oneOff,
    past: day.past,
    isToday: day.isToday,
  }));

  const found = selected ? (days.find((entry) => entry.date === selected) ?? null) : null;
  const day = found
    ? {
        ...found,
        workout: blank === "workout" ? emptyDay(found.workout) : found.workout,
        food: blank === "food" ? emptyDay(found.food) : found.food,
      }
    : null;

  // Only asked for the day being edited: two lookups rather than twenty-eight.
  const [exercises, meals, efforts, lastWorkout, lastFood] = await Promise.all([
    getExercises(),
    getMeals(),
    getLastEfforts(profile.id),
    day ? findLastLike(profile.id, day.date, "workout") : Promise.resolve(null),
    day ? findLastLike(profile.id, day.date, "food") : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-5">
      {fromReview ? (
        <ReviewBanner
          clientId={profile.id}
          clientName={profile.fullName}
          avatarUrl={profile.avatarUrl}
          notes={reviewNotes}
        />
      ) : null}

      <ScreenTitle title="Plan" subtitle="Tap a day to edit it." />

      <Link
        href={page(shiftDate(from, -PAGE))}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-raised text-sm font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent"
      >
        <ChevronUp className="h-4 w-4" />
        Earlier days
      </Link>

      <PlanDayList rows={rows} open={selected}>
        {day && day.past ? (
          /*
           * A day that has been and gone is shown, never edited. Nothing here
           * can reach back into it — `savePlanDay` never backdates — so an
           * editor with a Save button on it was a form that quietly did
           * nothing, which is worse than no form at all. The way to change
           * this session is to change the next one.
           */
          <PastDay
            title={longDate(day.date)}
            summary={summarise(day.workout, day.food)}
            exercises={day.workout.exercises.map((exercise) => exercise.name)}
            meals={day.food.meals.map((slot) => slot.meal.name)}
            notes={
              day.notes.length > 0 ? (
                <DayNotes clientId={profile.id} notes={day.notes} firstName={firstName} />
              ) : null
            }
            closeHref={page(from)}
            nextHref={`${page(from)}&date=${nextSame(day.date, now)}#day-${nextSame(day.date, now)}`}
            weekdayName={weekdayName(day.date)}
            historyHref={`/admin/clients/${profile.id}/history?date=${day.date}&month=${day.date.slice(0, 7)}`}
          />
        ) : day ? (
          /*
           * Keyed on the date, and on whether this is a blanked day. The
           * title, the suggested time, the note and the rest-day box are
           * uncontrolled inputs, so React keeps the DOM node — and its
           * typed-in value — across a navigation that only changes props.
           * Tuesday's title stayed in the field while Thursday's exercises
           * loaded underneath it, and "start blank" cleared the exercises
           * while leaving the old name sitting above them.
           */
          <PlanDayForm
            key={`${day.date}${blank ?? ""}`}
            action={savePlanDay}
            title={longDate(day.date)}
            subtitle={summarise(day.workout, day.food)}
            weekdayName={weekdayName(day.date)}
            defaultOpen
            noteCount={day.notes.length}
            trainingHint={
              day.workout.isRest || day.workout.exercises.length === 0
                ? "Rest day"
                : `${day.workout.title ?? "Training"} · ${day.workout.exercises.length} ${
                    day.workout.exercises.length === 1 ? "exercise" : "exercises"
                  }`
            }
            foodHint={
              day.food.meals.length === 0
                ? "No meals set"
                : `${day.food.meals.length} meals${
                    day.food.calorieTarget
                      ? ` · ${day.food.calorieTarget.toLocaleString("en-GB")} kcal`
                      : ""
                  }`
            }
            hidden={
              <>
                <input type="hidden" name="clientId" value={profile.id} />
                <input type="hidden" name="kind" value="both" />
                <input type="hidden" name="date" value={day.date} />
                {fromReview ? <input type="hidden" name="review" value="1" /> : null}
              </>
            }
            toolbar={
              <>
                <Link
                  href={page(from)}
                  className="inline-flex h-11 shrink-0 items-center rounded-full bg-raised px-4 text-xs font-semibold whitespace-nowrap text-muted transition-colors hover:bg-overlay hover:text-accent"
                >
                  Close
                </Link>
                {day.workout.exercises.length > 0 && !day.past ? (
                  <form action={bumpPlanWeights}>
                    <input type="hidden" name="clientId" value={profile.id} />
                    <input type="hidden" name="date" value={day.date} />
                    <input type="hidden" name="delta" value="2.5" />
                    <button
                      type="submit"
                      className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-raised px-4 text-xs font-semibold whitespace-nowrap text-muted transition-colors hover:bg-overlay hover:text-accent"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      +2.5kg on every set
                    </button>
                  </form>
                ) : null}
              </>
            }
            notes={
              day.notes.length > 0 ? (
                <DayNotes clientId={profile.id} notes={day.notes} firstName={firstName} />
              ) : undefined
            }
            training={
              <>
                <FillOptions
                  clientId={profile.id}
                  date={day.date}
                  kind="workout"
                  weekdayName={weekdayName(day.date)}
                  hasLast={lastWorkout !== null}
                  blankHref={`${page(from)}&date=${day.date}&blank=workout#day-${day.date}`}
                  review={fromReview}
                />
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={fieldLabel} htmlFor="pd-title">
                        Title
                      </label>
                      <input
                        id="pd-title"
                        className={field}
                        name="title"
                        defaultValue={day.workout.title ?? ""}
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
                        defaultValue={day.workout.suggestedTime ?? ""}
                      />
                    </div>
                  </div>

                  {/* The planners seed their rows once, so moving to another
                      day has to remount them. Without this, tapping Mon → Wed
                      leaves Monday's exercises in the form and saving writes
                      them onto Wednesday. */}
                  <ExercisePlanner
                    key={`w-${day.date}${blank === "workout" ? "-blank" : ""}`}
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
                      defaultValue={day.workout.coachNotes ?? ""}
                    />
                  </div>

                  <label className="flex min-h-11 items-center gap-3 text-sm text-muted">
                    <input
                      type="checkbox"
                      name="isRest"
                      defaultChecked={day.workout.isRest}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    Make this a rest day
                  </label>

                  {day.workout.exercises.some((exercise) => exercise.archived) ? (
                    <p className="inline-flex items-center gap-2 text-xs text-amber">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      One of these has been archived in the library.
                    </p>
                  ) : null}
                </div>
              </>
            }
            food={
              <>
                <FillOptions
                  clientId={profile.id}
                  date={day.date}
                  kind="food"
                  weekdayName={weekdayName(day.date)}
                  hasLast={lastFood !== null}
                  blankHref={`${page(from)}&date=${day.date}&blank=food#day-${day.date}`}
                  review={fromReview}
                />
                <MealPlanner
                  key={`f-${day.date}${blank === "food" ? "-blank" : ""}`}
                  day={day.food}
                  meals={meals}
                  calorieTarget={day.food.calorieTarget}
                />
              </>
            }
          />
        ) : null}
      </PlanDayList>

      <Link
        href={page(shiftDate(from, PAGE))}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-raised text-sm font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent"
      >
        <ChevronDown className="h-4 w-4" />
        Later days
      </Link>
    </div>
  );
}

/**
 * A day that has already happened.
 *
 * Read only, and it says so. The plan never rewrites the past — the client
 * has already trained, or not — so the useful thing to offer is the next one
 * of these, which is where a change can actually land.
 */
function PastDay({
  title,
  summary,
  exercises,
  meals,
  notes,
  closeHref,
  nextHref,
  weekdayName,
  historyHref,
}: {
  title: string;
  summary: string;
  exercises: string[];
  meals: string[];
  notes: React.ReactNode;
  closeHref: string;
  nextHref: string;
  weekdayName: string;
  historyHref: string;
}) {
  return (
    <div className="rounded-[var(--radius-sheet)] bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <p className="truncate text-xs text-faint">{summary}</p>
        </div>
        <Link
          href={closeHref}
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-raised px-4 text-xs font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent"
        >
          Close
        </Link>
      </header>

      <div className="space-y-5 p-5">
        <p className="inline-flex items-start gap-2 rounded-2xl bg-raised p-4 text-sm leading-relaxed text-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
          This day has been and gone, so it stays as it was. Change next{" "}
          {weekdayName} instead.
        </p>

        {notes}

        {exercises.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-faint">Training</p>
            <ul className="mt-2 space-y-1">
              {exercises.map((name) => (
                <li key={name} className="text-sm text-muted">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {meals.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-faint">Meals</p>
            <ul className="mt-2 space-y-1">
              {meals.map((name) => (
                <li key={name} className="text-sm text-muted">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={nextHref}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
          >
            <ArrowRight className="h-4 w-4" />
            Edit next {weekdayName}
          </Link>
          <Link
            href={historyHref}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-raised px-5 text-sm font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent"
          >
            See what they did
          </Link>
        </div>
      </div>
    </div>
  );
}
