import { Dumbbell, Salad, Trash2 } from "lucide-react";
import { getDayPlans, getSessionPlans } from "@/lib/members/service";
import {
  deleteDayPlan,
  deleteSessionPlan,
  saveDayPlan,
  saveSessionPlan,
} from "@/lib/members/actions";
import {
  EmptyState,
  Panel,
  ScreenTitle,
  field,
  fieldLabel,
  submitButton,
} from "@/components/members/ui";
import { IconTile } from "@/components/ui/IconTile";

export const dynamic = "force-dynamic";

/**
 * Build once, assign many times. Plans live here, detached from any client;
 * assigning them to days happens on a client's Workouts or Food tab.
 */
export default async function AdminPlansPage() {
  const [sessionPlans, dayPlans] = await Promise.all([getSessionPlans(), getDayPlans()]);

  return (
    <>
      <ScreenTitle
        title="Plans"
        subtitle="Build a workout or a day of food once, then assign it to as many days as you like."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* --------------------------------------------------- Session plans */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Dumbbell} size="sm" />
            <h2 className="text-lg font-semibold">Workout plans</h2>
          </div>

          <Panel title="New workout plan">
            <form action={saveSessionPlan} className="space-y-4">
              <div>
                <label className={fieldLabel} htmlFor="sp-name">
                  Name
                </label>
                <input
                  id="sp-name"
                  className={field}
                  name="name"
                  required
                  placeholder="Push day"
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="sp-items">
                  Exercises — one per line, &ldquo;Exercise — sets/reps/weight&rdquo;
                </label>
                <textarea
                  id="sp-items"
                  className={field}
                  name="items"
                  rows={6}
                  required
                  placeholder={"Bench press — 4 × 6 @ 42.5kg\nOverhead press — 3 × 8\nCable fly — 3 × 12"}
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="sp-notes">
                  Note to client
                </label>
                <input id="sp-notes" className={field} name="notes" />
              </div>
              <button type="submit" className={submitButton}>
                Save plan
              </button>
            </form>
          </Panel>

          {sessionPlans.length === 0 ? (
            <Panel>
              <EmptyState>No workout plans yet.</EmptyState>
            </Panel>
          ) : (
            sessionPlans.map((plan) => (
              <Panel
                key={plan.id}
                title={plan.name}
                action={
                  <form
                    action={async () => {
                      "use server";
                      await deleteSessionPlan(plan.id);
                    }}
                  >
                    <button
                      type="submit"
                      aria-label={`Delete ${plan.name}`}
                      className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                }
              >
                <form action={saveSessionPlan} className="space-y-3">
                  <input type="hidden" name="id" value={plan.id} />
                  <input className={field} name="name" defaultValue={plan.name} aria-label="Name" />
                  <textarea
                    className={field}
                    name="items"
                    rows={Math.max(3, plan.items.length)}
                    aria-label="Exercises"
                    defaultValue={plan.items
                      .map((i) => (i.target ? `${i.label} — ${i.target}` : i.label))
                      .join("\n")}
                  />
                  <input
                    className={field}
                    name="notes"
                    defaultValue={plan.notes ?? ""}
                    placeholder="Note to client"
                    aria-label="Note"
                  />
                  <button type="submit" className={submitButton}>
                    Save changes
                  </button>
                </form>
              </Panel>
            ))
          )}
        </div>

        {/* ------------------------------------------------------- Day plans */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Salad} size="sm" />
            <h2 className="text-lg font-semibold">Food plans</h2>
          </div>

          <Panel title="New food plan">
            <form action={saveDayPlan} className="space-y-4">
              <div>
                <label className={fieldLabel} htmlFor="dp-name">
                  Name
                </label>
                <input
                  id="dp-name"
                  className={field}
                  name="name"
                  required
                  placeholder="1,950 kcal — training day"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="dp-cal">
                    Calorie target
                  </label>
                  <input
                    id="dp-cal"
                    className={field}
                    type="number"
                    name="calorieTarget"
                    placeholder="1950"
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="dp-pro">
                    Protein (g)
                  </label>
                  <input
                    id="dp-pro"
                    className={field}
                    type="number"
                    name="proteinTarget"
                    placeholder="130"
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="dp-meals">
                  Meals — one per line, &ldquo;Name | ingredients | kcal&rdquo;
                </label>
                <textarea
                  id="dp-meals"
                  className={field}
                  name="meals"
                  rows={5}
                  placeholder="Breakfast | 200g yoghurt, berries, granola | 420"
                />
                <p className="mt-2 text-xs text-faint">
                  Leave empty for a calorie target with no set meals.
                </p>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="dp-notes">
                  Note to client
                </label>
                <input id="dp-notes" className={field} name="notes" />
              </div>
              <button type="submit" className={submitButton}>
                Save plan
              </button>
            </form>
          </Panel>

          {dayPlans.length === 0 ? (
            <Panel>
              <EmptyState>No food plans yet.</EmptyState>
            </Panel>
          ) : (
            dayPlans.map((plan) => (
              <Panel
                key={plan.id}
                title={plan.name}
                action={
                  <form
                    action={async () => {
                      "use server";
                      await deleteDayPlan(plan.id);
                    }}
                  >
                    <button
                      type="submit"
                      aria-label={`Delete ${plan.name}`}
                      className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                }
              >
                <form action={saveDayPlan} className="space-y-3">
                  <input type="hidden" name="id" value={plan.id} />
                  <input className={field} name="name" defaultValue={plan.name} aria-label="Name" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={field}
                      type="number"
                      name="calorieTarget"
                      defaultValue={plan.calorieTarget ?? ""}
                      aria-label="Calorie target"
                    />
                    <input
                      className={field}
                      type="number"
                      name="proteinTarget"
                      defaultValue={plan.proteinTarget ?? ""}
                      aria-label="Protein target"
                    />
                  </div>
                  <textarea
                    className={field}
                    name="meals"
                    rows={Math.max(2, plan.meals.length)}
                    aria-label="Meals"
                    defaultValue={plan.meals
                      .map((m) => [m.name, m.ingredients ?? "", m.calories ?? ""].join(" | "))
                      .join("\n")}
                  />
                  <input
                    className={field}
                    name="notes"
                    defaultValue={plan.notes ?? ""}
                    placeholder="Note to client"
                    aria-label="Note"
                  />
                  <button type="submit" className={submitButton}>
                    Save changes
                  </button>
                </form>
              </Panel>
            ))
          )}
        </div>
      </div>
    </>
  );
}
