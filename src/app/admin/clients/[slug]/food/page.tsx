import Link from "next/link";
import { notFound } from "next/navigation";
import {
  commentsFor,
  dayIndexFor,
  getAssignedFoodDates,
  getComments,
  getDayPlans,
  getFoodLogs,
  getFoodPlan,
  getMealSwaps,
  getMeals,
  getPlanBlock,
  getPlanDay,
  getProfile,
  shiftDate,
  sumCalories,
  today,
} from "@/lib/members/service";
import { assignDayPlan, savePlanDay, saveFoodPlan, setFoodMode } from "@/lib/members/actions";
import { MealPlanner } from "@/components/members/PlanDayEditor";
import { MealBreakdown } from "@/components/members/MealBreakdown";
import { cn } from "@/lib/utils";
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

/** Today plus a fortnight — the stretch worth looking at in a review. */
const HORIZON = 14;

function shortLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function longLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default async function AdminClientFoodPage({
  params,
  searchParams,
}: PageProps<"/admin/clients/[slug]/food">) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const date = today();
  const requested = typeof query.date === "string" ? query.date : date;
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested >= date ? requested : date;

  const [plan, todaysLogs, allLogs, comments, dayPlans, assignedDates, block, meals] =
    await Promise.all([
      getFoodPlan(profile.id, date),
      getFoodLogs(profile.id, date),
      getFoodLogs(profile.id),
      getComments(profile.id),
      getDayPlans(),
      getAssignedFoodDates(profile.id),
      getPlanBlock(profile.id),
      getMeals(),
    ]);

  const swaps = await getMealSwaps(profile.id, selected);
  // The unswapped recipes, so the breakdown can name what a swap replaced.
  const library = new Map(meals.map((meal) => [meal.id, meal]));

  const planDay = block ? await getPlanDay(block, selected, "food") : null;
  const dayIndex = block ? dayIndexFor(block, selected) : null;
  const days = Array.from({ length: HORIZON }, (_, i) => shiftDate(date, i));

  const upcoming = assignedDates.filter((p) => p.assignedFor > date);

  const earlierDays = [...new Set(allLogs.map((l) => l.loggedFor))]
    .filter((d) => d !== date)
    .slice(0, 7);

  return (
    <div className="space-y-5">
      {/* Who holds the pen. Switching it never touches the plan already
          written — it only changes who may edit from here on. */}
      <Panel title="Who plans the food">
        <form action={setFoodMode} className="space-y-3">
          <input type="hidden" name="clientId" value={profile.id} />
          {(
            [
              [
                "coach",
                "You do",
                "You assign the meals. They see the finished plan and follow it.",
              ],
              [
                "self",
                "They do",
                "They build their own week from the meal library, to the targets you set. You can still see and edit it.",
              ],
            ] as const
          ).map(([value, label, blurb]) => (
            <label key={value} className="flex gap-3 rounded-2xl border border-line bg-ink p-4">
              <input
                type="radio"
                name="foodMode"
                value={value}
                defaultChecked={profile.foodMode === value}
                className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
              />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{blurb}</span>
              </span>
            </label>
          ))}
          <button type="submit" className={submitButton}>
            Save
          </button>
          <p className="text-xs text-faint">
            Changing this leaves the plan exactly as it is. Nobody&rsquo;s week gets cleared.
          </p>
        </form>
      </Panel>

      {/* A date-first view of the food week. Necessary whoever planned it, and
          the only way to see a self-planning client's actual choices — the
          Plan tab shows the repeating week, not what landed on a Thursday. */}
      <Panel
        title={profile.foodMode === "self" ? "Their food week" : "The food week"}
        action={
          <span className="text-xs text-faint">
            {profile.foodMode === "self" ? "They planned this — your edits win" : "You planned this"}
          </span>
        }
      >
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
          <ul className="flex w-max gap-2">
            {days.map((entry) => (
              <li key={entry}>
                <Link
                  href={`/admin/clients/${profile.id}/food?date=${entry}`}
                  aria-current={entry === selected ? "page" : undefined}
                  className={cn(
                    "block rounded-2xl border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                    entry === selected
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-ink text-muted hover:text-text",
                  )}
                >
                  {entry === date ? "Today" : shortLabel(entry)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          {!block || !planDay || dayIndex === null ? (
            <EmptyState>
              No repeating plan yet — start one on the Plan tab and the days show up here.
            </EmptyState>
          ) : (
            <form action={savePlanDay} className="space-y-4">
              <input type="hidden" name="clientId" value={profile.id} />
              <input type="hidden" name="dayIndex" value={dayIndex} />
              <input type="hidden" name="kind" value="food" />
              <input type="hidden" name="from" value={selected} />
              <input type="hidden" name="scope" value="date" />
              <p className="text-sm font-semibold">{longLabel(selected)}</p>
              <MealPlanner key={selected} day={planDay} meals={meals} calorieTarget={planDay.calorieTarget} />
              <button type="submit" className={submitButton}>
                Save {longLabel(selected)}
              </button>
              <p className="text-xs text-faint">
                Saves this date only. Use the Plan tab to change the shape of every week.
              </p>
            </form>
          )}
        </div>
      </Panel>

      {/* What the day is actually made of. Picking a meal and picking a portion
          was all Dean could do before; changing one ingredient meant editing
          the shared recipe, which is everyone else's dinner too. */}
      {planDay && planDay.meals.length > 0 ? (
        <Panel
          title={`What's in ${longLabel(selected)}`}
          action={
            swaps.length > 0 ? (
              <span className="text-xs font-semibold text-accent">
                {swaps.length} swap{swaps.length === 1 ? "" : "s"} in place
              </span>
            ) : null
          }
        >
          <MealBreakdown
            clientId={profile.id}
            date={selected}
            dateLabel={longLabel(selected)}
            slots={planDay.meals}
            library={library}
            swaps={swaps}
          />
        </Panel>
      ) : null}

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
