import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarRange, Check, ShoppingBasket, Trash2, TriangleAlert } from "lucide-react";
import {
  commentsFor,
  getComments,
  getCurrentProfile,
  getFoodLogs,
  getMealLogs,
  getPlannedFood,
  scaleMeal,
  sumCalories,
  today,
} from "@/lib/members/service";
import { deleteFoodLog, logFood, toggleMeal } from "@/lib/members/actions";
import {
  CalorieBar,
  EmptyState,
  Panel,
  ScreenTitle,
  field,
  fieldLabel,
  submitButton,
} from "@/components/members/ui";
import { MacroRing } from "@/components/members/MacroRing";
import { CommentThread } from "@/components/members/Comments";
import { cn } from "@/lib/utils";

const SLOT_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;

export const dynamic = "force-dynamic";

export default async function FoodPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const date = today();
  const [plan, todaysLogs, allLogs, comments, mealLogs] = await Promise.all([
    getPlannedFood(profile.id, date),
    getFoodLogs(profile.id, date),
    getFoodLogs(profile.id),
    getComments(profile.id),
    getMealLogs(profile.id, date),
  ]);

  // Ticked meals and hand-typed entries both count towards the day, so what is
  // off-plan never has to be pretended into a meal.
  const eaten = new Set(mealLogs.map((log) => `${log.slot}:${log.mealId}`));
  const mealCalories = mealLogs.reduce((sum, log) => sum + (log.calories ?? 0), 0);
  const total = sumCalories(todaysLogs) + mealCalories;

  // Macros come from the meals plus any snack the client gave figures for.
  // Calories logged without them are counted in the total but named separately
  // rather than quietly left out of the breakdown, which is what made the ring
  // and the number underneath it disagree.
  const macros = [...mealLogs, ...todaysLogs].reduce(
    (sum, log) => ({
      protein: sum.protein + (log.proteinG ?? 0),
      carbs: sum.carbs + (log.carbsG ?? 0),
      fat: sum.fat + (log.fatG ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
  const accounted = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
  const unaccounted = Math.max(0, Math.round(total - accounted));

  const target = plan.calorieTarget;
  const remaining = target ? target - total : null;

  /*
   * Which snack took them over.
   *
   * Worked out by replaying the day in the order it was eaten: the one that
   * crossed the line is the one worth flagging, and the ones after it were
   * already over. Saying "this took you over" about all of them would be both
   * wrong and a nag.
   */
  const inOrder = [...todaysLogs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const crossedAt = new Map<string, number>();
  if (target) {
    let running = mealCalories;
    for (const log of inOrder) {
      const before = running;
      running += log.calories;
      if (before <= target && running > target) crossedAt.set(log.id, running - target);
    }
  }

  const bySlot = SLOT_ORDER.map((slot) => ({
    slot,
    meals: plan.meals.filter((entry) => entry.slot === slot),
  })).filter((group) => group.meals.length > 0);
  const earlierDays = [...new Set(allLogs.map((l) => l.loggedFor))].filter((d) => d !== date).slice(0, 7);

  return (
    <>
      <ScreenTitle
        title="Food"
        subtitle="Tick your meals off, or drop in one total at the end of the day."
        action={
          <Link
            href="/app/food/shopping"
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <ShoppingBasket className="h-4 w-4" />
            Shopping list
          </Link>
        }
      />

      <div className="space-y-5">
        <Panel title="Today">
          <MacroRing
            calories={total}
            proteinG={macros.protein}
            carbsG={macros.carbs}
            fatG={macros.fat}
            caption={plan.calorieTarget ? `of ${plan.calorieTarget.toLocaleString("en-GB")}` : "cal"}
          />

          <div className="mt-5">
            <CalorieBar total={total} target={plan.calorieTarget} />
          </div>

          {plan.proteinTarget ? (
            <p className="mt-3 text-sm text-muted">
              Protein target: <span className="font-semibold text-text">{plan.proteinTarget}g</span>
              {macros.protein > 0 ? (
                <span className="text-faint"> · {Math.round(macros.protein)}g so far</span>
              ) : null}
            </p>
          ) : null}

          {/* Says what the breakdown does not cover, instead of letting the
              ring and the total quietly disagree. */}
          {unaccounted > 50 ? (
            <p className="mt-2 text-xs text-faint">
              {unaccounted.toLocaleString("en-GB")} kcal logged without a breakdown, so the split
              above covers the rest.
            </p>
          ) : null}

        </Panel>

        {bySlot.length > 0 ? (
          <Panel title="Your meals today">
            <div className="space-y-5">
              {bySlot.map((group) => (
                <div key={group.slot}>
                  <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                    {group.slot}
                  </p>
                  <ul className="space-y-2">
                    {group.meals.map((entry) => {
                      const scaled = scaleMeal(entry.meal, entry.multiplier);
                      const done = eaten.has(`${entry.slot}:${entry.meal.id}`);

                      return (
                        <li
                          key={entry.id}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3",
                            done ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-ink",
                          )}
                        >
                          <Link
                            href={`/app/food/meal/${entry.meal.id}?date=${date}`}
                            className="flex min-w-0 flex-1 items-center gap-3"
                          >
                            <span className="min-w-0 flex-1">
                              {/* Wraps rather than truncates: "Cod, potatoes
                                  and gr…" tells them nothing. */}
                              <span className="block text-sm font-semibold">{entry.meal.name}</span>
                              <span className="text-xs text-faint">
                                {/* The amounts are already the client's. How
                                    they were arrived at is not their business
                                    to check. */}
                                {scaled.carbsG ?? 0}C · {scaled.fatG ?? 0}F · {scaled.proteinG ?? 0}P
                              </span>
                            </span>
                            <span className="shrink-0 text-sm text-muted tabular-nums">
                              {scaled.calories ?? "—"}
                            </span>
                          </Link>

                          {/* An empty box on the right, and a tick only once it
                              has been ticked. A greyed-out tick sitting there
                              from the start reads as a state rather than
                              something to press. */}
                          <form action={toggleMeal} className="shrink-0">
                            <input type="hidden" name="date" value={date} />
                            <input type="hidden" name="slot" value={entry.slot} />
                            <input type="hidden" name="mealId" value={entry.meal.id} />
                            <input type="hidden" name="multiplier" value={entry.multiplier} />
                            <button
                              type="submit"
                              aria-pressed={done}
                              aria-label={
                                done ? `Untick ${entry.meal.name}` : `Tick ${entry.meal.name} as eaten`
                              }
                              className="group/tick grid h-11 w-11 place-items-center rounded-xl"
                            >
                              <span
                                className={cn(
                                  "grid h-7 w-7 place-items-center rounded-lg border-2 transition-colors",
                                  done
                                    ? "border-accent bg-accent text-accent-ink"
                                    : "border-faint bg-ink group-hover/tick:border-accent",
                                )}
                              >
                                {done ? <Check className="h-4.5 w-4.5" strokeWidth={3} /> : null}
                              </span>
                            </button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {profile.foodMode === "self" ? (
              <Link
                href="/app/food/plan"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent"
              >
                <CalendarRange className="h-4 w-4" />
                Plan your next days
              </Link>
            ) : null}

            <p className="mt-5 text-xs text-faint">
              Tick the box on the right once you&rsquo;ve eaten it and the calories go on
              automatically. Tap the meal name for the amounts and how to make it.
            </p>
          </Panel>
        ) : null}

        {/* Snacks last: the plan is the thing to follow, and this is what
            happened on top of it. */}
        <Panel title="Anything else you ate">
          <p className="text-sm leading-relaxed text-muted">
            Seconds, a meal out, a bad afternoon — put it here rather than leaving it out. Macros are
            optional; the calories alone still count.
          </p>

          {target ? (
            <p className="mt-3 text-sm">
              {remaining !== null && remaining >= 0 ? (
                <span className="text-muted">
                  <span className="font-semibold text-text">
                    {remaining.toLocaleString("en-GB")} kcal
                  </span>{" "}
                  left today.
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 font-semibold text-amber">
                  <TriangleAlert className="h-4 w-4" />
                  {Math.abs(remaining ?? 0).toLocaleString("en-GB")} kcal over today.
                </span>
              )}
            </p>
          ) : null}

          <form action={logFood} className="mt-4 space-y-3">
            <input type="hidden" name="date" value={date} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["calories", "Calories", true],
                  ["protein", "Protein (g)", false],
                  ["carbs", "Carbs (g)", false],
                  ["fat", "Fat (g)", false],
                ] as const
              ).map(([name, label, required]) => (
                <div key={name}>
                  <label className={fieldLabel} htmlFor={`snack-${name}`}>
                    {label}
                  </label>
                  <input
                    id={`snack-${name}`}
                    name={name}
                    type="number"
                    inputMode="numeric"
                    min={required ? 1 : 0}
                    required={required}
                    className={field}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className={fieldLabel} htmlFor="snack-note">
                What was it?
              </label>
              <input
                id="snack-note"
                name="note"
                required
                placeholder="Flapjack at the office"
                className={field}
              />
            </div>

            <button type="submit" className={submitButton}>
              Add it
            </button>
          </form>

          {todaysLogs.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {todaysLogs.map((log) => {
                const over = crossedAt.get(log.id);
                const hasMacros =
                  log.proteinG !== null || log.carbsG !== null || log.fatG !== null;

                return (
                  <li
                    key={log.id}
                    className={cn(
                      "rounded-2xl border p-4",
                      over ? "border-amber/40 bg-amber/[0.05]" : "border-line bg-ink",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {log.calories.toLocaleString("en-GB")} kcal
                        </p>
                        {log.note ? <p className="mt-1 text-sm text-muted">{log.note}</p> : null}
                        {hasMacros ? (
                          <p className="mt-1 text-xs text-faint">
                            {log.carbsG ?? 0}C · {log.fatG ?? 0}F · {log.proteinG ?? 0}P
                          </p>
                        ) : null}
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await deleteFoodLog(log.id);
                        }}
                      >
                        <button
                          type="submit"
                          aria-label={`Delete ${log.note ?? "entry"}`}
                          className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>

                    {/* Flagged on the one that crossed the line, not on every
                        entry after it. */}
                    {over ? (
                      <p className="mt-3 inline-flex items-start gap-2 text-xs leading-relaxed font-semibold text-amber">
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        This one took you past your target, by {over.toLocaleString("en-GB")} kcal.
                      </p>
                    ) : null}

                    <CommentThread
                      comments={commentsFor(comments, "food_log", log.id)}
                      clientId={profile.id}
                      targetType="food_log"
                      targetId={log.id}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState>Nothing extra today.</EmptyState>
          )}
        </Panel>

        <Panel title="Earlier days">
          {earlierDays.length === 0 ? (
            <EmptyState>Nothing logged before today.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {earlierDays.map((day) => {
                const dayLogs = allLogs.filter((l) => l.loggedFor === day);
                const dayTotal = sumCalories(dayLogs);
                const target = plan?.calorieTarget ?? null;
                return (
                  <li
                    key={day}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-ink px-4 py-3.5"
                  >
                    <span className="text-sm text-muted">
                      {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-semibold">
                      {dayTotal.toLocaleString("en-GB")}
                      {target ? (
                        <span className="font-normal text-faint"> / {target.toLocaleString("en-GB")}</span>
                      ) : null}{" "}
                      kcal
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
