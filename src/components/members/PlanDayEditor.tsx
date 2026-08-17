"use client";

import { useId, useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { Exercise, Meal, MealTag, PlanDay } from "@/lib/members/types";
import { field, fieldLabel } from "./ui";
import { cn } from "@/lib/utils";

const SLOTS: MealTag[] = ["breakfast", "lunch", "dinner", "snack"];
/**
 * The portion sizes a meal can be planned at.
 *
 * Written as fractions because that is how someone thinks about food — half a
 * portion, one and a half. The word "multiplier" never appears in front of a
 * client, and there is no reason for Dean to see it either.
 */
const PORTIONS: Array<{ value: number; label: string }> = [
  { value: 0.5, label: "\u00bd" },
  { value: 1, label: "1" },
  { value: 1.5, label: "1\u00bd" },
  { value: 2, label: "2" },
];

interface SetRow {
  key: string;
  weight: string;
  reps: string;
}

interface ExerciseRow {
  key: string;
  exerciseId: string;
  notes: string;
  sets: SetRow[];
}

interface MealRow {
  key: string;
  slot: MealTag;
  mealId: string;
  multiplier: number;
}

let seed = 0;
const nextKey = () => `row-${(seed += 1)}`;

function toExerciseRows(day: PlanDay): ExerciseRow[] {
  return day.exercises.map((exercise) => ({
    key: nextKey(),
    exerciseId: exercise.exerciseId,
    notes: exercise.notes ?? "",
    sets: exercise.sets.map((set) => ({
      key: nextKey(),
      weight: set.targetWeightKg === null ? "" : String(set.targetWeightKg),
      reps: set.targetReps === null ? "" : String(set.targetReps),
    })),
  }));
}

function toMealRows(day: PlanDay): MealRow[] {
  return day.meals.map((slot) => ({
    key: nextKey(),
    slot: slot.slot,
    mealId: slot.meal.id,
    multiplier: slot.multiplier,
  }));
}

/**
 * The training half of a day.
 *
 * Exercises are chosen from the library and submitted as IDs, so a plan can
 * never point at a name that does not exist, and a rename in the library
 * reaches every day that uses it. Sets are number fields because sets differ —
 * 10 / 8 / 6 up a ladder is the normal case.
 */
export function ExercisePlanner({ day, exercises }: { day: PlanDay; exercises: Exercise[] }) {
  const domId = useId();
  // Seeded once. Any caller that can swap `day` underneath this component
  // must give it a `key` tied to that day, or the previous day's exercises
  // stay in the form and get saved onto the new one.
  const [rows, setRows] = useState<ExerciseRow[]>(() => toExerciseRows(day));

  const update = (key: string, patch: Partial<ExerciseRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const updateSet = (rowKey: string, setKey: string, patch: Partial<SetRow>) =>
    setRows((current) =>
      current.map((row) =>
        row.key === rowKey
          ? { ...row, sets: row.sets.map((set) => (set.key === setKey ? { ...set, ...patch } : set)) }
          : row,
      ),
    );

  return (
    <div className="space-y-3">
      <span className={fieldLabel}>Exercises</span>

      {rows.length === 0 ? (
        <p className="text-sm text-faint">No exercises yet — a day with none is a rest day.</p>
      ) : null}

      {rows.map((row, index) => (
        <div key={row.key} className="rounded-2xl border border-line bg-ink p-4">
          {/* One hidden count per exercise lets the flat set fields below be
              split back into the right groups on the server. */}
          <input type="hidden" name="setCount" value={row.sets.length} />

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor={`${domId}-ex-${index}`}>
                Exercise {index + 1}
              </label>
              <select
                id={`${domId}-ex-${index}`}
                className={field}
                name="exerciseId"
                required
                value={row.exerciseId}
                onChange={(event) => update(row.key, { exerciseId: event.target.value })}
              >
                <option value="">Pick an exercise…</option>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                    {exercise.muscleGroup ? ` — ${exercise.muscleGroup}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setRows((current) => current.filter((entry) => entry.key !== row.key))}
              aria-label={`Remove exercise ${index + 1}`}
              className="rounded-full p-2.5 text-faint transition-colors hover:bg-raised hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {row.sets.map((set, setIndex) => (
              <li key={set.key} className="flex flex-wrap items-end gap-2">
                <span className="w-12 shrink-0 text-xs font-semibold text-faint">Set {setIndex + 1}</span>
                <div className="min-w-0 flex-1 sm:w-32 sm:flex-none">
                  <label className="sr-only" htmlFor={`${domId}-w-${index}-${setIndex}`}>
                    Set {setIndex + 1} weight in kg
                  </label>
                  <input
                    id={`${domId}-w-${index}-${setIndex}`}
                    className={field}
                    type="number"
                    step="0.5"
                    min="0"
                    name="setWeight"
                    value={set.weight}
                    onChange={(event) => updateSet(row.key, set.key, { weight: event.target.value })}
                    placeholder="kg"
                  />
                </div>
                <div className="min-w-0 flex-1 sm:w-24 sm:flex-none">
                  <label className="sr-only" htmlFor={`${domId}-r-${index}-${setIndex}`}>
                    Set {setIndex + 1} reps
                  </label>
                  <input
                    id={`${domId}-r-${index}-${setIndex}`}
                    className={field}
                    type="number"
                    min="0"
                    name="setReps"
                    value={set.reps}
                    onChange={(event) => updateSet(row.key, set.key, { reps: event.target.value })}
                    placeholder="reps"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) =>
                      current.map((entry) =>
                        entry.key === row.key
                          ? { ...entry, sets: entry.sets.filter((s) => s.key !== set.key) }
                          : entry,
                      ),
                    )
                  }
                  aria-label={`Remove set ${setIndex + 1}`}
                  className="rounded-full p-2.5 text-faint transition-colors hover:bg-raised hover:text-danger"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={() =>
                setRows((current) =>
                  current.map((entry) =>
                    entry.key === row.key
                      ? {
                          ...entry,
                          sets: [
                            ...entry.sets,
                            {
                              key: nextKey(),
                              // A new set starts where the last one left off.
                              weight: entry.sets.at(-1)?.weight ?? "",
                              reps: entry.sets.at(-1)?.reps ?? "",
                            },
                          ],
                        }
                      : entry,
                  ),
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-text"
            >
              <Plus className="h-3.5 w-3.5" />
              Add set
            </button>
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor={`${domId}-n-${index}`}>
                Note on exercise {index + 1}
              </label>
              <input
                id={`${domId}-n-${index}`}
                className={field}
                name="exerciseNotes"
                value={row.notes}
                onChange={(event) => update(row.key, { notes: event.target.value })}
                placeholder="Note (optional)"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setRows((current) => [
            ...current,
            { key: nextKey(), exerciseId: "", notes: "", sets: [{ key: nextKey(), weight: "", reps: "" }] },
          ])
        }
        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <Plus className="h-4 w-4" />
        Add exercise
      </button>
    </div>
  );
}

/**
 * The food half of a day.
 *
 * Meals are tapped from the library, never typed, and the day's total climbs
 * as they are added so Dean can see a target being met rather than working it
 * out. A multiplier scales the meal's calories, macros and, later, its share
 * of the shopping list.
 */
export function MealPlanner({
  day,
  meals,
  calorieTarget,
  lockTargets = false,
}: {
  day: PlanDay;
  meals: Meal[];
  calorieTarget: number | null;
  /**
   * Show the targets rather than offer them. Dean sets what the client is
   * aiming at in either mode; a self-planning client fills the day to hit it,
   * they do not get to move the goalposts.
   */
  lockTargets?: boolean;
}) {
  const domId = useId();
  const [rows, setRows] = useState<MealRow[]>(() => toMealRows(day));
  const [target, setTarget] = useState(calorieTarget === null ? "" : String(calorieTarget));

  const byId = useMemo(() => new Map(meals.map((meal) => [meal.id, meal])), [meals]);

  const totals = rows.reduce(
    (sum, row) => {
      const meal = byId.get(row.mealId);
      if (!meal) return sum;
      return {
        calories: sum.calories + (meal.calories ?? 0) * row.multiplier,
        protein: sum.protein + (meal.proteinG ?? 0) * row.multiplier,
      };
    },
    { calories: 0, protein: 0 },
  );

  const targetValue = Number(target) || 0;
  const pct = targetValue > 0 ? Math.min(100, Math.round((totals.calories / targetValue) * 100)) : 0;
  const over = targetValue > 0 && totals.calories > targetValue;

  const update = (key: string, patch: Partial<MealRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const addMeal = (slot: MealTag) => {
    const first = meals.find((meal) => meal.tag === slot) ?? meals[0];
    if (!first) return;
    setRows((current) => [...current, { key: nextKey(), slot, mealId: first.id, multiplier: 1 }]);
  };

  return (
    <div className="space-y-4">
      {lockTargets ? (
        <div className="rounded-2xl border border-line bg-ink p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
            What Dean has you aiming at
          </p>
          <p className="mt-1.5 text-sm text-muted">
            {targetValue > 0 ? `${targetValue.toLocaleString("en-GB")} kcal` : "No calorie target"}
            {day.proteinTarget ? ` \u00b7 ${day.proteinTarget}g protein` : ""}
          </p>
          <input type="hidden" name="calorieTarget" value={target} />
          <input type="hidden" name="proteinTarget" value={day.proteinTarget ?? ""} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabel} htmlFor="pf-kcal">
              Calorie target
            </label>
            <input
              id="pf-kcal"
              className={field}
              type="number"
              name="calorieTarget"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="pf-protein">
              Protein target (g)
            </label>
            <input
              id="pf-protein"
              className={field}
              type="number"
              name="proteinTarget"
              defaultValue={day.proteinTarget ?? ""}
            />
          </div>
        </div>
      )}

      {/* The number Dean is aiming at, moving as meals go on. */}
      <div className="rounded-2xl border border-line bg-ink p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-display text-2xl font-bold tabular-nums">
            {Math.round(totals.calories).toLocaleString("en-GB")}
            {targetValue > 0 ? (
              <span className="text-base font-normal text-faint">
                {" "}
                / {targetValue.toLocaleString("en-GB")} kcal
              </span>
            ) : (
              <span className="text-base font-normal text-faint"> kcal</span>
            )}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {Math.round(totals.protein)}g protein
            {targetValue > 0 ? ` · ${Math.round((totals.calories / targetValue) * 100)}%` : ""}
          </p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised">
          <div
            className={cn("h-full rounded-full transition-[width]", over ? "bg-amber" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((row, index) => {
          const meal = byId.get(row.mealId);
          return (
            /*
             * The meal is the thing being chosen, so it gets the width. Side
             * by side with the slot, the portion and the calories it was down
             * to about 34px on a phone — a picker showing none of the names it
             * is picking between.
             */
            <li
              key={row.key}
              className="rounded-2xl border border-line bg-ink p-3 sm:flex sm:flex-wrap sm:items-end sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0"
            >
              <input type="hidden" name="mealSlot" value={row.slot} />

              <div className="flex items-end gap-2 sm:order-2 sm:min-w-0 sm:flex-1">
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor={`${domId}-meal-${index}`}>
                    Meal {index + 1}
                  </label>
                  <select
                    id={`${domId}-meal-${index}`}
                    className={field}
                    name="mealId"
                    required
                    value={row.mealId}
                    onChange={(event) => update(row.key, { mealId: event.target.value })}
                  >
                    {/* Name only — the calories for the chosen portion are
                        shown beside the row, so repeating them here just cost
                        the name the width it needed. */}
                    {meals.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="w-16 shrink-0 pb-3 text-right text-xs text-faint tabular-nums sm:order-4 sm:w-20">
                  {meal?.calories ? `${Math.round(meal.calories * row.multiplier)} kcal` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((entry) => entry.key !== row.key))}
                  aria-label={`Remove meal ${index + 1}`}
                  className="shrink-0 rounded-full p-2.5 text-faint transition-colors hover:bg-raised hover:text-danger sm:order-5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex items-end gap-2 sm:order-1 sm:mt-0">
                <div className="min-w-0 flex-1 sm:w-32 sm:flex-none">
                  <label className="sr-only" htmlFor={`${domId}-slot-${index}`}>
                    Slot for meal {index + 1}
                  </label>
                  <select
                    id={`${domId}-slot-${index}`}
                    className={field}
                    value={row.slot}
                    onChange={(event) => update(row.key, { slot: event.target.value as MealTag })}
                  >
                    {SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0 flex-1 sm:order-3 sm:w-40 sm:flex-none">
                  <label className="sr-only" htmlFor={`${domId}-mult-${index}`}>
                    Portion for meal {index + 1}
                  </label>
                  <select
                    id={`${domId}-mult-${index}`}
                    className={field}
                    name="mealMultiplier"
                    value={row.multiplier}
                    onChange={(event) => update(row.key, { multiplier: Number(event.target.value) })}
                  >
                    {PORTIONS.map((portion) => (
                      <option key={portion.value} value={portion.value}>
                        Portion: {portion.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => addMeal(slot)}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-4 w-4" />
            {slot}
          </button>
        ))}
      </div>

      <p className="text-xs text-faint">
        {lockTargets
          ? "Add meals until the bar reaches your target. Portion sets how much of it you are having."
          : "Leave the list empty for a target-only day. Portion carries through to calories, macros and the shopping list."}
      </p>
    </div>
  );
}
