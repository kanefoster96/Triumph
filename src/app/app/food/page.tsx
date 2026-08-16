import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  commentsFor,
  getComments,
  getCurrentProfile,
  getFoodLogs,
  getFoodPlan,
  sumCalories,
  today,
} from "@/lib/members/service";
import { deleteFoodLog, logFood } from "@/lib/members/actions";
import { CalorieBar, EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { CommentThread } from "@/components/members/Comments";

export const dynamic = "force-dynamic";

export default async function FoodPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const date = today();
  const [plan, todaysLogs, allLogs, comments] = await Promise.all([
    getFoodPlan(profile.id),
    getFoodLogs(profile.id, date),
    getFoodLogs(profile.id),
    getComments(profile.id),
  ]);

  const total = sumCalories(todaysLogs);
  const earlierDays = [...new Set(allLogs.map((l) => l.loggedFor))].filter((d) => d !== date).slice(0, 7);

  return (
    <>
      <ScreenTitle title="Food" subtitle="Log as you go, or drop in one total at the end of the day." />

      <div className="space-y-5">
        <Panel title="Today">
          <CalorieBar total={total} target={plan?.calorieTarget ?? null} />

          {plan?.proteinTarget ? (
            <p className="mt-3 text-sm text-muted">
              Protein target: <span className="font-semibold text-text">{plan.proteinTarget}g</span>
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
                      <p className="text-sm font-semibold">
                        {log.calories.toLocaleString("en-GB")} kcal
                      </p>
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

        {plan && plan.meals.length > 0 ? (
          <Panel title="Your meal plan">
            {plan.notes ? <p className="mb-4 text-sm leading-relaxed text-muted">{plan.notes}</p> : null}
            <ul className="space-y-3">
              {plan.meals.map((meal) => (
                <li key={meal.id} className="rounded-2xl border border-line bg-ink p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{meal.name}</p>
                    {meal.calories ? (
                      <span className="shrink-0 text-sm text-accent">{meal.calories} kcal</span>
                    ) : null}
                  </div>
                  {meal.ingredients ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{meal.ingredients}</p>
                  ) : null}
                </li>
              ))}
            </ul>
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
