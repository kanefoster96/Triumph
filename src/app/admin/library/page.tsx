import Link from "next/link";
import { Archive, Dumbbell, Salad, TriangleAlert } from "lucide-react";
import { getExercises, getMeals } from "@/lib/members/service";
import { archiveExercise, archiveMeal, saveExercise, saveMeal } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { IconTile } from "@/components/ui/IconTile";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import { needsUnit, type MealTag } from "@/lib/members/types";
import { IngredientRows } from "@/components/members/IngredientRows";

export const dynamic = "force-dynamic";

const TAGS: MealTag[] = ["breakfast", "lunch", "dinner", "snack"];

/**
 * A method step is instructions, so amounts belong in the ingredient list where
 * they can be scaled. This spots the common slips rather than blocking a save
 * and losing Dean's typing.
 */
function looksLikeQuantity(step: string): boolean {
  return /\b\d+(\.\d+)?\s*(g|kg|ml|l|tbsp|tsp|oz|lb|cups?|slices?|cloves?)\b/i.test(step);
}

function matches(haystack: Array<string | null>, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  return haystack.some((value) => (value ?? "").toLowerCase().includes(needle));
}

export default async function AdminLibraryPage({ searchParams }: PageProps<"/admin/library">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const tag = TAGS.includes(params.tag as MealTag) ? (params.tag as MealTag) : null;
  const maxCalories = Number(typeof params.kcal === "string" ? params.kcal : "") || null;
  const editExercise = typeof params.exercise === "string" ? params.exercise : null;
  const editMeal = typeof params.meal === "string" ? params.meal : null;

  const [exercises, meals] = await Promise.all([getExercises(true), getMeals(true)]);

  const shownExercises = exercises.filter((e) => matches([e.name, e.muscleGroup, e.equipment], query));
  const shownMeals = meals.filter(
    (m) =>
      matches([m.name, ...m.ingredients.map((i) => i.name)], query) &&
      (!tag || m.tag === tag) &&
      (!maxCalories || (m.calories ?? 0) <= maxCalories),
  );

  const exercise = editExercise ? exercises.find((e) => e.id === editExercise) : null;
  const meal = editMeal ? meals.find((m) => m.id === editMeal) : null;

  return (
    <>
      <ScreenTitle
        title="Library"
        subtitle="Exercises and meals, built once and shared across every client. Correcting one here fixes every future day that uses it."
      />

      {/* Stacked on a phone: side by side, the search box shrank to about
          twenty pixels and the row ran off the screen. */}
      <form className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-end" action="/admin/library">
        <div className="min-w-0 sm:flex-1">
          <label className={fieldLabel} htmlFor="lib-q">
            Search
          </label>
          <input
            id="lib-q"
            className={field}
            name="q"
            defaultValue={query}
            placeholder="Name, muscle group or ingredient"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <div className="min-w-0">
            <label className={fieldLabel} htmlFor="lib-tag">
              Meal tag
            </label>
            <select id="lib-tag" className={field} name="tag" defaultValue={tag ?? ""}>
              <option value="">Any</option>
              {TAGS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label className={fieldLabel} htmlFor="lib-kcal">
              Up to kcal
            </label>
            <input
              id="lib-kcal"
              className={cn(field, "sm:w-32")}
              type="number"
              inputMode="numeric"
              name="kcal"
              defaultValue={maxCalories ?? ""}
            />
          </div>
        </div>

        <button type="submit" className={cn(submitButton, "w-full sm:w-auto")}>
          Filter
        </button>
      </form>

      {/* min-w-0 on the columns: a grid track will not shrink below its
          content's min-width without it, which pushed the whole page sideways
          on a phone. */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* ------------------------------------------------------ exercises */}
        <div className="min-w-0 space-y-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Dumbbell} size="sm" />
            <h2 className="text-lg font-semibold">Exercises</h2>
            <span className="text-sm text-faint">{shownExercises.length}</span>
          </div>

          <Panel title={exercise ? `Edit ${exercise.name}` : "New exercise"}>
            <form action={saveExercise} className="space-y-4" key={exercise?.id ?? "new-exercise"}>
              {exercise ? <input type="hidden" name="id" value={exercise.id} /> : null}
              <div>
                <label className={fieldLabel} htmlFor="ex-name">
                  Name
                </label>
                <input
                  id="ex-name"
                  className={field}
                  name="name"
                  required
                  defaultValue={exercise?.name ?? ""}
                  placeholder="Back squat"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="ex-muscle">
                    Muscle group
                  </label>
                  <input
                    id="ex-muscle"
                    className={field}
                    name="muscleGroup"
                    defaultValue={exercise?.muscleGroup ?? ""}
                    placeholder="Legs"
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="ex-equipment">
                    Equipment
                  </label>
                  <input
                    id="ex-equipment"
                    className={field}
                    name="equipment"
                    defaultValue={exercise?.equipment ?? ""}
                    placeholder="Barbell"
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="ex-how">
                  How to (optional)
                </label>
                <textarea
                  id="ex-how"
                  className={field}
                  name="howTo"
                  rows={2}
                  defaultValue={exercise?.howTo ?? ""}
                  placeholder="Brace before you unrack. Sit between your hips."
                />
                <p className="mt-2 text-xs text-faint">The client sees this while they train.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={submitButton}>
                  {exercise ? "Save exercise" : "Add exercise"}
                </button>
                {exercise ? (
                  <Link
                    href="/admin/library"
                    className="rounded-full bg-raised px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-text"
                  >
                    Cancel
                  </Link>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel title="All exercises">
            {shownExercises.length === 0 ? (
              <EmptyState>Nothing matches.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {shownExercises.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-raised px-4 py-3"
                  >
                    <Link
                      href={`/admin/library?exercise=${entry.id}`}
                      className="min-w-0 flex-1 hover:text-accent"
                    >
                      <span className="block truncate text-sm font-semibold">{entry.name}</span>
                      <span className="text-xs text-faint">
                        {[entry.muscleGroup, entry.equipment].filter(Boolean).join(" · ") || "No details"}
                      </span>
                    </Link>
                    {entry.archivedAt ? <Chip tone="amber">Archived</Chip> : null}
                    <form action={archiveExercise}>
                      <input type="hidden" name="id" value={entry.id} />
                      <button
                        type="submit"
                        aria-label={entry.archivedAt ? "Restore exercise" : "Archive exercise"}
                        className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-text"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ---------------------------------------------------------- meals */}
        <div className="min-w-0 space-y-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Salad} size="sm" />
            <h2 className="text-lg font-semibold">Meals</h2>
            <span className="text-sm text-faint">{shownMeals.length}</span>
          </div>

          <Panel title={meal ? `Edit ${meal.name}` : "New meal"}>
            <form action={saveMeal} className="space-y-4" key={meal?.id ?? "new-meal"}>
              {meal ? <input type="hidden" name="id" value={meal.id} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="me-name">
                    Name
                  </label>
                  <input
                    id="me-name"
                    className={field}
                    name="name"
                    required
                    defaultValue={meal?.name ?? ""}
                    placeholder="Chicken and rice bowl"
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="me-tag">
                    Tag
                  </label>
                  <select id="me-tag" className={field} name="tag" defaultValue={meal?.tag ?? "lunch"}>
                    {TAGS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ["calories", "kcal", meal?.calories],
                    ["protein", "Protein g", meal?.proteinG],
                    ["carbs", "Carbs g", meal?.carbsG],
                    ["fat", "Fat g", meal?.fatG],
                  ] as const
                ).map(([name, label, value]) => (
                  <div key={name}>
                    <label className={fieldLabel} htmlFor={`me-${name}`}>
                      {label}
                    </label>
                    <input
                      id={`me-${name}`}
                      className={field}
                      type="number"
                      name={name}
                      defaultValue={value ?? ""}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-faint">
                Per single serving. A client&rsquo;s portion scales these.
              </p>

              <IngredientRows ingredients={meal?.ingredients ?? []} />

              <div>
                <label className={fieldLabel} htmlFor="me-method">
                  Method — one step per line
                </label>
                <textarea
                  id="me-method"
                  className={field}
                  name="method"
                  rows={5}
                  defaultValue={meal?.method.join("\n") ?? ""}
                  placeholder={"Get the rice on — it takes the longest.\nFry the chicken until golden."}
                />
                <p className="mt-2 text-xs text-faint">
                  No amounts in the steps — every quantity belongs in the ingredient list, where it scales
                  with the client&rsquo;s portion.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className={submitButton}>
                  {meal ? "Save meal" : "Add meal"}
                </button>
                {meal ? (
                  <Link
                    href="/admin/library"
                    className="rounded-full bg-raised px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-text"
                  >
                    Cancel
                  </Link>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel title="All meals">
            {shownMeals.length === 0 ? (
              <EmptyState>Nothing matches.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {shownMeals.map((entry) => {
                  const suspect = entry.method.filter(looksLikeQuantity).length;
                  const unitless = entry.ingredients.filter(needsUnit).length;
                  return (
                    <li key={entry.id} className="rounded-2xl bg-raised px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/admin/library?meal=${entry.id}`}
                          className="min-w-0 flex-1 hover:text-accent"
                        >
                          <span className="block truncate text-sm font-semibold">{entry.name}</span>
                          <span className="text-xs text-faint">
                            {entry.tag}
                            {entry.calories ? ` · ${entry.calories} kcal` : ""}
                            {entry.proteinG ? ` · ${entry.proteinG}g protein` : ""} ·{" "}
                            {entry.ingredients.length} ingredients ·{" "}
                            {entry.method.length > 0 ? `${entry.method.length} steps` : "no method"}
                          </span>
                        </Link>
                        {entry.archivedAt ? <Chip tone="amber">Archived</Chip> : null}
                        <form action={archiveMeal}>
                          <input type="hidden" name="id" value={entry.id} />
                          <button
                            type="submit"
                            aria-label={entry.archivedAt ? "Restore meal" : "Archive meal"}
                            className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-text"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </form>
                      </div>

                      {unitless > 0 ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          {unitless} ingredient{unitless === 1 ? "" : "s"} have an amount but no unit — the
                          shopping list cannot scale them until that is fixed.
                        </p>
                      ) : null}

                      {suspect > 0 ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          {suspect} method step{suspect === 1 ? "" : "s"} look like they carry an amount —
                          move it to the ingredients so it scales.
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
