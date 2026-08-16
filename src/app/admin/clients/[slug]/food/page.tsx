import { notFound } from "next/navigation";
import {
  commentsFor,
  getAssignedFoodDates,
  getComments,
  getDayPlans,
  getFoodLogs,
  getFoodPlan,
  getProfile,
  sumCalories,
  today,
} from "@/lib/members/service";
import { assignDayPlan, saveFoodPlan } from "@/lib/members/actions";
import { PlanAssigner } from "@/components/members/PlanAssigner";
import {
  CalorieBar,
  EmptyState,
  Panel,
  field,
  fieldLabel,
  submitButton,
} from "@/components/members/ui";
import { CommentThread } from "@/components/members/Comments";

export const dynamic = "force-dynamic";

export default async function AdminClientFoodPage({
  params,
}: PageProps<"/admin/clients/[slug]/food">) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const date = today();
  const [plan, todaysLogs, allLogs, comments, dayPlans, assignedDates] = await Promise.all([
    getFoodPlan(profile.id, date),
    getFoodLogs(profile.id, date),
    getFoodLogs(profile.id),
    getComments(profile.id),
    getDayPlans(),
    getAssignedFoodDates(profile.id),
  ]);

  const upcoming = assignedDates.filter((p) => p.assignedFor > date);

  const earlierDays = [...new Set(allLogs.map((l) => l.loggedFor))]
    .filter((d) => d !== date)
    .slice(0, 7);

  return (
    <div className="space-y-5">
      <Panel title="Today">
        <CalorieBar total={sumCalories(todaysLogs)} target={plan?.calorieTarget ?? null} />

        {todaysLogs.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {todaysLogs.map((log) => (
              <li key={log.id} className="rounded-2xl border border-line bg-ink p-4">
                <p className="text-sm font-semibold">{log.calories.toLocaleString("en-GB")} kcal</p>
                {log.note ? <p className="mt-1 text-sm text-muted">{log.note}</p> : null}
                <CommentThread
                  comments={commentsFor(comments, "food_log", log.id)}
                  clientId={profile.id}
                  targetType="food_log"
                  targetId={log.id}
                  canReply
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Nothing logged today.</EmptyState>
        )}
      </Panel>

      <Panel title="Plan ahead">
        <PlanAssigner
          clientId={profile.id}
          today={date}
          plans={dayPlans}
          action={assignDayPlan}
          noun="food"
          emptyHint="No food plans yet — build one on the Plans page first."
        />
      </Panel>

      <Panel title={`Planned ahead (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <EmptyState>
            Nothing assigned beyond today. Today&rsquo;s target carries forward until you change it.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((assigned) => (
              <li
                key={assigned.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-ink px-4 py-3"
              >
                <span className="text-sm text-muted">
                  {new Date(`${assigned.assignedFor}T12:00:00Z`).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="text-sm font-semibold">
                  {assigned.calorieTarget
                    ? `${assigned.calorieTarget.toLocaleString("en-GB")} kcal`
                    : "No target"}
                  {assigned.meals.length > 0 ? (
                    <span className="font-normal text-faint"> · {assigned.meals.length} meals</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Today by hand">
        <p className="mb-4 text-sm text-muted">
          Overrides whatever is assigned for today, without touching the other days.
        </p>
        <form action={saveFoodPlan} className="space-y-4">
          <input type="hidden" name="clientId" value={profile.id} />
          <input type="hidden" name="date" value={date} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="f-cal">
                Calorie target
              </label>
              <input
                id="f-cal"
                className={field}
                type="number"
                name="calorieTarget"
                defaultValue={plan?.calorieTarget ?? ""}
                placeholder="1950"
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="f-pro">
                Protein target (g)
              </label>
              <input
                id="f-pro"
                className={field}
                type="number"
                name="proteinTarget"
                defaultValue={plan?.proteinTarget ?? ""}
                placeholder="130"
              />
            </div>
          </div>
          <div>
            <label className={fieldLabel} htmlFor="f-meals">
              Meals — one per line, &ldquo;Name | ingredients | kcal&rdquo;
            </label>
            <textarea
              id="f-meals"
              className={field}
              name="meals"
              rows={5}
              defaultValue={plan?.meals
                .map((m) => [m.name, m.ingredients ?? "", m.calories ?? ""].join(" | "))
                .join("\n")}
              placeholder="Breakfast | 200g yoghurt, berries | 420"
            />
            <p className="mt-2 text-xs text-faint">
              Leave empty to assign a calorie target only.
            </p>
          </div>
          <div>
            <label className={fieldLabel} htmlFor="f-notes">
              Note
            </label>
            <input id="f-notes" className={field} name="notes" defaultValue={plan?.notes ?? ""} />
          </div>
          <button type="submit" className={submitButton}>
            Save food plan
          </button>
        </form>
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
              const over = target ? dayTotal > target : false;
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
                  <span className={`text-sm font-semibold ${over ? "text-amber" : "text-text"}`}>
                    {dayTotal.toLocaleString("en-GB")}
                    {target ? (
                      <span className="font-normal text-faint">
                        {" "}
                        / {target.toLocaleString("en-GB")}
                      </span>
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
  );
}
