import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarRange, TrendingUp, TriangleAlert } from "lucide-react";
import {
  getExercises,
  getLastEfforts,
  getMeals,
  getPlanBlock,
  getPlanCycle,
  getProfile,
  today,
} from "@/lib/members/service";
import { bumpPlanWeights, createPlanBlock, savePlanDay } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import { ExercisePlanner, MealPlanner } from "@/components/members/PlanDayEditor";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Day 0 is the block's start date, so its weekday depends on that date. */
function dayLabel(startsOn: string, dayIndex: number, cycleWeeks: number): string {
  const weekday = WEEKDAYS[(new Date(`${startsOn}T00:00:00Z`).getUTCDay() + 6 + dayIndex) % 7];
  return cycleWeeks === 2 ? `${weekday} · week ${Math.floor(dayIndex / 7) + 1}` : weekday;
}

export default async function AdminClientPlanPage({
  params,
  searchParams,
}: PageProps<"/admin/clients/[slug]/plan">) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const now = today();
  const block = await getPlanBlock(profile.id);

  if (!block) {
    return (
      <Panel title="No repeating plan yet">
        <form action={createPlanBlock} className="space-y-4">
          <input type="hidden" name="clientId" value={profile.id} />
          <p className="text-sm text-muted">
            A block repeats until you change it, so it never runs out. The start date is also the date it
            takes over — anything already assigned before then stays exactly as it is.
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
            </div>
          </div>
          <button type="submit" className={submitButton}>
            Start a repeating plan
          </button>
        </form>
      </Panel>
    );
  }

  const editing = Number(typeof query.day === "string" ? query.day : "");
  const dayIndex = Number.isFinite(editing) && editing >= 0 ? editing : null;

  const [workoutCycle, foodCycle, exercises, meals, efforts] = await Promise.all([
    getPlanCycle(block, now, "workout"),
    getPlanCycle(block, now, "food"),
    getExercises(),
    getMeals(),
    getLastEfforts(profile.id),
  ]);

  const basePath = `/admin/clients/${profile.id}/plan`;
  const day = dayIndex === null ? null : workoutCycle[dayIndex];
  const foodDay = dayIndex === null ? null : foodCycle[dayIndex];

  return (
    <div className="space-y-5">
      <ScreenTitle
        title="Plan"
        subtitle={`A ${block.cycleWeeks === 2 ? "two week" : "one week"} block, repeating from ${block.startsOn}. Edit a day and choose how far the change reaches.`}
        action={
          <form action={bumpPlanWeights}>
            <input type="hidden" name="clientId" value={profile.id} />
            <input type="hidden" name="delta" value="2.5" />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-text"
            >
              <TrendingUp className="h-4 w-4" />
              +2.5kg everywhere
            </button>
          </form>
        }
      />

      <Panel title="The week">
        <ul className={cn("grid gap-2", block.cycleWeeks === 2 ? "sm:grid-cols-2" : "")}>
          {workoutCycle.map((entry, index) => {
            const food = foodCycle[index];
            const active = index === dayIndex;
            return (
              <li key={index}>
                <Link
                  href={`${basePath}?day=${index}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors",
                    active ? "border-accent bg-accent/10" : "border-line bg-ink hover:bg-raised",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {dayLabel(block.startsOn, index, block.cycleWeeks)}
                    </span>
                    <span className="text-xs text-faint">
                      {entry.exercises.length > 0
                        ? `${entry.title ?? "Workout"} · ${entry.exercises.length} exercises`
                        : "Rest"}
                      {food.calorieTarget ? ` · ${food.calorieTarget} kcal` : ""}
                      {food.meals.length > 0 ? ` · ${food.meals.length} meals` : ""}
                    </span>
                  </span>
                  {entry.exercises.some((e) => e.archived) || food.meals.some((m) => m.archived) ? (
                    <Chip tone="amber">
                      <TriangleAlert className="h-3 w-3" />
                      Archived item
                    </Chip>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>

      {day === null || foodDay === null ? (
        <Panel>
          <EmptyState>Pick a day above to edit it.</EmptyState>
        </Panel>
      ) : (
        <>
          <Panel
            title={`Training — ${dayLabel(block.startsOn, dayIndex as number, block.cycleWeeks)}`}
            action={
              <form action={bumpPlanWeights}>
                <input type="hidden" name="clientId" value={profile.id} />
                <input type="hidden" name="dayIndex" value={dayIndex as number} />
                <input type="hidden" name="delta" value="2.5" />
                <button type="submit" className="text-xs font-semibold text-accent">
                  +2.5kg this day
                </button>
              </form>
            }
          >
            {day.exercises.length > 0 ? (
              <ul className="mb-5 space-y-2">
                {day.exercises.map((exercise) => {
                  const last = efforts.get(exercise.exerciseId);
                  return (
                    <li key={exercise.id} className="rounded-2xl border border-line bg-ink p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold">{exercise.name}</span>
                        <span className="text-xs text-faint tabular-nums">
                          {exercise.sets
                            .map((set) => `${set.targetWeightKg ?? 0}×${set.targetReps ?? 0}`)
                            .join("  ")}
                        </span>
                      </div>
                      {/* Progression memory: what they actually managed last time. */}
                      {last ? (
                        <p className="mt-2 text-xs text-muted">
                          Last {last.on}:{" "}
                          {last.sets.map((set) => `${set.weightKg ?? 0}×${set.reps ?? 0}`).join("  ")}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-faint">Nothing logged yet.</p>
                      )}
                      {exercise.archived ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          This exercise has been archived in the library.
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState>Rest day.</EmptyState>
            )}

            <form action={savePlanDay} className="space-y-4">
              <input type="hidden" name="clientId" value={profile.id} />
              <input type="hidden" name="dayIndex" value={dayIndex as number} />
              <input type="hidden" name="kind" value="workout" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="pd-title">
                    Title
                  </label>
                  <input
                    id="pd-title"
                    className={field}
                    name="title"
                    defaultValue={day.title ?? ""}
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
                    defaultValue={day.suggestedTime ?? ""}
                  />
                </div>
              </div>

              {/* The planners seed their rows from props once, so moving to
                  another day has to remount them. Without this, clicking Mon →
                  Wed leaves Monday's exercises in the form and saving writes
                  them onto Wednesday. */}
              <ExercisePlanner key={`w-${dayIndex}`} day={day} exercises={exercises} />

              <div>
                <label className={fieldLabel} htmlFor="pd-notes">
                  Note to client
                </label>
                <textarea
                  id="pd-notes"
                  className={field}
                  name="coachNotes"
                  rows={2}
                  defaultValue={day.coachNotes ?? ""}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-muted">
                <input type="checkbox" name="isRest" className="h-4 w-4 accent-[var(--color-accent)]" />
                Make this a rest day
              </label>

              <ScopeFields defaultFrom={now} />

              <button type="submit" className={submitButton}>
                Save training day
              </button>
            </form>
          </Panel>

          <Panel title={`Food — ${dayLabel(block.startsOn, dayIndex as number, block.cycleWeeks)}`}>
            <form action={savePlanDay} className="space-y-4">
              <input type="hidden" name="clientId" value={profile.id} />
              <input type="hidden" name="dayIndex" value={dayIndex as number} />
              <input type="hidden" name="kind" value="food" />

              <MealPlanner
                key={`f-${dayIndex}`}
                day={foodDay}
                meals={meals}
                calorieTarget={foodDay.calorieTarget}
              />

              <ScopeFields defaultFrom={now} />

              <button type="submit" className={submitButton}>
                Save food day
              </button>
            </form>
          </Panel>
        </>
      )}
    </div>
  );
}

/**
 * How far an edit reaches. Weekday-forward is the common case, so it leads;
 * either way the date cannot be earlier than today, which is what keeps
 * finished days finished.
 */
function ScopeFields({ defaultFrom }: { defaultFrom: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink p-4">
      <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
        <CalendarRange className="h-3.5 w-3.5" />
        How far does this reach?
      </p>
      <div className="mt-3 space-y-2">
        {(
          [
            ["weekday", "This weekday, from the date below onwards"],
            ["date", "Just that one date"],
          ] as const
        ).map(([value, label], index) => (
          <label key={value} className="flex items-center gap-3 text-sm text-muted">
            <input
              type="radio"
              name="scope"
              value={value}
              defaultChecked={index === 0}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-3 max-w-xs">
        <label className={fieldLabel} htmlFor={`scope-from-${defaultFrom}`}>
          From
        </label>
        <input
          id={`scope-from-${defaultFrom}`}
          className={field}
          type="date"
          name="from"
          min={defaultFrom}
          defaultValue={defaultFrom}
        />
      </div>
      <p className="mt-2 text-xs text-faint">Days already gone are never changed.</p>
    </div>
  );
}
