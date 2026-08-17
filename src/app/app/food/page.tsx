import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronRight, ShoppingBasket, Trash2 } from "lucide-react";
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
import { CalorieBar, EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
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
  const macros = mealLogs.reduce(
    (sum, log) => ({
      protein: sum.protein + (log.proteinG ?? 0),
      carbs: sum.carbs + (log.carbsG ?? 0),
      fat: sum.fat + (log.fatG ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );

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

          <form action={logFood} className="mt-5 flex flex-wrap gap-3">
            <input type="hidden" name="date" value={date} />
            <input
              name="calories"
              type="number"
              inputMode="numeric"
              min={1}
              required
              placeholder="Calories"
              aria-label="Calories"
              className="w-32 rounded-2xl border border-line bg-ink px-4 py-3 text-sm transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <input
              name="note"
              placeholder="Note (optional)"
              aria-label="Note"
              className="min-w-0 flex-1 rounded-2xl border border-line bg-ink px-4 py-3 text-sm transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
            >
              Add
            </button>
          </form>

          {todaysLogs.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {todaysLogs.map((log) => (
                <li key={log.id} className="rounded-2xl border border-line bg-ink p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{log.calories.toLocaleString("en-GB")} kcal</p>
                      {log.note ? <p className="mt-1 text-sm text-muted">{log.note}</p> : null}
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await deleteFoodLog(log.id);
                      }}
                    >
                      <button
                        type="submit"
                        aria-label="Delete entry"
                        className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                  <CommentThread
                    comments={commentsFor(comments, "food_log", log.id)}
                    clientId={profile.id}
                    targetType="food_log"
                    targetId={log.id}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Nothing logged today yet.</EmptyState>
          )}
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
                          {/* Ticking is the whole interaction, so it is the
                              biggest target on the row. */}
                          <form action={toggleMeal}>
                            <input type="hidden" name="date" value={date} />
                            <input type="hidden" name="slot" value={entry.slot} />
                            <input type="hidden" name="mealId" value={entry.meal.id} />
                            <input type="hidden" name="multiplier" value={entry.multiplier} />
                            <button
                              type="submit"
                              aria-label={
                                done ? `Untick ${entry.meal.name}` : `Tick ${entry.meal.name} as eaten`
                              }
                              className={cn(
                                "grid h-10 w-10 place-items-center rounded-full border transition-colors",
                                done
                                  ? "border-accent bg-accent text-accent-ink"
                                  : "border-line text-faint hover:border-accent hover:text-accent",
                              )}
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          </form>

                          <Link
                            href={`/app/food/meal/${entry.meal.id}?x=${entry.multiplier}`}
                            className="flex min-w-0 flex-1 items-center gap-3"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{entry.meal.name}</span>
                              <span className="text-xs text-faint">
                                {entry.multiplier !== 1 ? `${entry.multiplier}× · ` : ""}
                                {scaled.carbsG ?? 0}C · {scaled.fatG ?? 0}F · {scaled.proteinG ?? 0}P
                              </span>
                            </span>
                            <span className="shrink-0 text-sm text-muted tabular-nums">
                              {scaled.calories ?? "—"}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs text-faint">
              Tick a meal and its calories go on automatically. Tap the name for the amounts and how to make
              it.
            </p>
          </Panel>
        ) : null}

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
