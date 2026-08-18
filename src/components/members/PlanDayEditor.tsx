"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Scale, TriangleAlert, X, Zap } from "lucide-react";
import type { Exercise, Meal, MealTag, PlanDay } from "@/lib/members/types";
import { field, fieldLabel } from "./ui";
import { NumberStepper } from "./NumberStepper";
import { PickerSheet, type PickerOption } from "./PickerSheet";
import { useIsPhone } from "./useIsPhone";
import { cn } from "@/lib/utils";

const SLOTS: MealTag[] = ["breakfast", "lunch", "dinner", "snack"];

/**
 * The portion sizes a meal can be planned at.
 *
 * Written as fractions because that is how someone thinks about food — half a
 * portion, one and a half. The word "multiplier" never appears in front of a
 * client, and there is no reason for Dean to see it either.
 *
 * Quarter steps rather than halves so scaling a day to a calorie target has
 * somewhere to land: with four sizes the nearest fit to 1,850 kcal was often
 * two hundred out, which is not a plan, it is a rounding error.
 */
const PORTIONS: Array<{ value: number; label: string }> = [
  { value: 0.5, label: "½" },
  { value: 0.75, label: "¾" },
  { value: 1, label: "1" },
  { value: 1.25, label: "1¼" },
  { value: 1.5, label: "1½" },
  { value: 1.75, label: "1¾" },
  { value: 2, label: "2" },
  { value: 2.5, label: "2½" },
  { value: 3, label: "3" },
];

const STEPS = PORTIONS.map((portion) => portion.value);

/** The planned portion nearest a wanted one — never off the end of the scale. */
function nearestPortion(wanted: number): number {
  return STEPS.reduce((best, step) =>
    Math.abs(step - wanted) < Math.abs(best - wanted) ? step : best,
  );
}

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
  /** Collapsed to one line until it is being worked on. */
  open: boolean;
  /** The "3 × 8 @ 60kg" shorthand, before it is turned into set rows. */
  quickSets: string;
  quickReps: string;
  quickWeight: string;
}

interface MealRow {
  key: string;
  slot: MealTag;
  mealId: string;
  multiplier: number;
}

let seed = 0;
const nextKey = () => `row-${(seed += 1)}`;

function toExerciseRows(day: PlanDay | null): ExerciseRow[] {
  return (day?.exercises ?? []).map((exercise) => ({
    key: nextKey(),
    exerciseId: exercise.exerciseId,
    notes: exercise.notes ?? "",
    // Already built, so it starts shut — the list of what is in the day is
    // what Dean opens this for, not eight sets of number fields at once.
    open: false,
    // Seeded from what is already there, so re-filling starts from the truth.
    quickSets: String(exercise.sets.length || 3),
    quickReps: exercise.sets[0]?.targetReps === null ? "" : String(exercise.sets[0]?.targetReps ?? ""),
    quickWeight:
      exercise.sets[0]?.targetWeightKg === null ? "" : String(exercise.sets[0]?.targetWeightKg ?? ""),
    sets: exercise.sets.map((set) => ({
      key: nextKey(),
      weight: set.targetWeightKg === null ? "" : String(set.targetWeightKg),
      reps: set.targetReps === null ? "" : String(set.targetReps),
    })),
  }));
}

function toMealRows(day: PlanDay | null): MealRow[] {
  return (day?.meals ?? []).map((slot) => ({
    key: nextKey(),
    slot: slot.slot,
    mealId: slot.meal.id,
    multiplier: slot.multiplier,
  }));
}

/** "4 sets · 8 reps · 70kg" — a built exercise in one line. */
function shapeOf(row: ExerciseRow): string {
  if (row.sets.length === 0) return "No sets";
  const reps = row.sets[0]?.reps;
  const top = row.sets.reduce((max, set) => Math.max(max, Number(set.weight) || 0), 0);
  const varied = row.sets.some((set) => set.reps !== reps);
  return [
    `${row.sets.length} ${row.sets.length === 1 ? "set" : "sets"}`,
    reps && !varied ? `${reps} ${Number(reps) === 1 ? "rep" : "reps"}` : varied ? "mixed reps" : null,
    top > 0 ? `${top}kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The training half of a day.
 *
 * Exercises are chosen from the library and submitted as IDs, so a plan can
 * never point at a name that does not exist, and a rename in the library
 * reaches every day that uses it. Sets are number fields because sets differ —
 * 10 / 8 / 6 up a ladder is the normal case.
 *
 * Each exercise is one line until it is opened, and on a phone only one is
 * open at a time. Five exercises of four sets is forty number fields, and
 * scrolling past all of them to reach the sixth was the reason the old editor
 * felt like a form rather than a plan.
 */
export function ExercisePlanner({
  day,
  exercises,
  lastEfforts = {},
}: {
  day: PlanDay | null;
  exercises: Exercise[];
  /** What they managed last time, by exercise id — a target set against something real. */
  lastEfforts?: Record<string, string>;
}) {
  const domId = useId();
  const phone = useIsPhone();
  // Seeded once. Any caller that can swap `day` underneath this component
  // must give it a `key` tied to that day, or the previous day's exercises
  // stay in the form and get saved onto the new one.
  const [rows, setRows] = useState<ExerciseRow[]>(() => toExerciseRows(day));

  const byId = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);

  const options: PickerOption[] = useMemo(
    () =>
      exercises.map((exercise) => ({
        id: exercise.id,
        label: exercise.name,
        hint: exercise.equipment ?? undefined,
        group: exercise.muscleGroup ?? "Other",
      })),
    [exercises],
  );

  const update = (key: string, patch: Partial<ExerciseRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  /*
   * One open at a time on a phone. Two expanded exercises is already more
   * than a screen, so the second one only ever pushed the first out of sight
   * while still costing the scroll to get past it.
   */
  const toggle = (key: string) =>
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? { ...row, open: !row.open }
          : phone
            ? { ...row, open: false }
            : row,
      ),
    );

  /** Turn "3 × 8 @ 60" into three identical set rows. */
  const fillSets = (rowKey: string) =>
    setRows((current) =>
      current.map((row) => {
        if (row.key !== rowKey) return row;
        const count = Math.min(10, Math.max(1, Number(row.quickSets) || row.sets.length || 1));
        return {
          ...row,
          sets: Array.from({ length: count }, () => ({
            key: nextKey(),
            weight: row.quickWeight,
            reps: row.quickReps,
          })),
        };
      }),
    );

  const updateSet = (rowKey: string, setKey: string, patch: Partial<SetRow>) =>
    setRows((current) =>
      current.map((row) =>
        row.key === rowKey
          ? { ...row, sets: row.sets.map((set) => (set.key === setKey ? { ...set, ...patch } : set)) }
          : row,
      ),
    );

  /** Up and down rather than drag: the same control works under a thumb. */
  const move = (index: number, by: number) =>
    setRows((current) => {
      const to = index + by;
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  return (
    <div className="space-y-3">
      <span className={fieldLabel}>Exercises</span>

      {rows.length === 0 ? (
        <p className="text-sm text-faint">No exercises yet — a day with none is a rest day.</p>
      ) : null}

      {rows.map((row, index) => {
        const library = byId.get(row.exerciseId);
        const last = lastEfforts[row.exerciseId];

        return (
          <div key={row.key} className="rounded-2xl border border-line bg-ink">
            {/* One hidden count per exercise lets the flat set fields below be
                split back into the right groups on the server. */}
            <input type="hidden" name="setCount" value={row.sets.length} />
            <input type="hidden" name="exerciseId" value={row.exerciseId} />
            <input type="hidden" name="exerciseNotes" value={row.notes} />

            <div className="flex items-center gap-1 p-2">
              <button
                type="button"
                onClick={() => toggle(row.key)}
                aria-expanded={row.open}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-raised"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      row.exerciseId ? "text-text" : "text-amber",
                    )}
                  >
                    {library?.name ?? (row.exerciseId ? "Removed exercise" : "Pick an exercise")}
                  </span>
                  <span className="block truncate text-xs text-faint">{shapeOf(row)}</span>
                </span>
                {row.open ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-faint" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-faint" />
                )}
              </button>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${library?.name ?? "exercise"} up`}
                  className="grid h-11 w-11 place-items-center rounded-full text-faint transition-colors enabled:hover:bg-raised enabled:hover:text-text disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Move ${library?.name ?? "exercise"} down`}
                  className="grid h-11 w-11 place-items-center rounded-full text-faint transition-colors enabled:hover:bg-raised enabled:hover:text-text disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((entry) => entry.key !== row.key))}
                  aria-label={`Remove ${library?.name ?? `exercise ${index + 1}`}`}
                  className="grid h-11 w-11 place-items-center rounded-full text-faint transition-colors hover:bg-raised hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {row.open ? (
              <div className="border-t border-line p-3">
                <PickerSheet
                  value={row.exerciseId}
                  options={options}
                  onChange={(exerciseId) => update(row.key, { exerciseId })}
                  title="Pick an exercise"
                  searchPlaceholder="Search exercises"
                  placeholder="Pick an exercise…"
                />

                {last ? (
                  <p className="mt-2 text-xs text-muted">Last {last}</p>
                ) : row.exerciseId ? (
                  <p className="mt-2 text-xs text-faint">Nothing logged yet.</p>
                ) : null}

                {/* Sets are usually the same thing three or four times, so the
                    fast path leads: say the shape once and stamp it. The rows
                    below stay editable for the odd set that differs. */}
                <div className="mt-3 rounded-xl border border-accent/25 bg-accent/[0.05] p-3">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                    <Zap className="h-3.5 w-3.5" />
                    Fill every set
                  </p>
                  {/* One per row on a phone: three steppers side by side is
                      six 44px buttons across 300px, which left the fields
                      themselves about a character wide. */}
                  <div className="mt-2.5 space-y-2 sm:grid sm:grid-cols-3 sm:gap-2 sm:space-y-0">
                    {(
                      [
                        ["sets", "quickSets", row.quickSets, 1, "3", undefined],
                        ["reps", "quickReps", row.quickReps, 1, "8", undefined],
                        ["weight", "quickWeight", row.quickWeight, 2.5, "0", "kg"],
                      ] as const
                    ).map(([label, key, value, step, placeholder, suffix]) => (
                      <div key={key} className="flex items-center gap-3 sm:block">
                        <span className="w-14 shrink-0 text-xs text-faint sm:mb-1 sm:block sm:w-auto sm:text-center sm:text-[11px]">
                          {label}
                        </span>
                        <NumberStepper
                          id={`${domId}-q${key}-${index}`}
                          label={`${label} for exercise ${index + 1}`}
                          value={value}
                          onChange={(next) => update(row.key, { [key]: next } as Partial<ExerciseRow>)}
                          step={step}
                          max={key === "quickSets" ? 10 : undefined}
                          placeholder={placeholder}
                          suffix={suffix}
                          className="min-w-0 flex-1"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => fillSets(row.key)}
                    className="mt-2.5 h-11 w-full rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
                  >
                    Apply to all sets
                  </button>
                </div>

                {row.sets.length === 0 ? (
                  <p className="mt-3 inline-flex items-start gap-2 text-xs text-amber">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    No sets on this one. Fine for bodyweight or an AMRAP finisher — it just gives
                    them nothing to log against.
                  </p>
                ) : null}

                <ul className="mt-3 space-y-2">
                  {row.sets.map((set, setIndex) => (
                    /*
                     * Stacked on a phone. Two steppers side by side is four
                     * 44px buttons and two fields across 300px; shrinking the
                     * buttons to fit would have undone the point of having
                     * them. The set's own number and its remove sit on the
                     * line above, where there is room for both.
                     */
                    <li
                      key={set.key}
                      className="rounded-xl border border-line/60 p-2 sm:flex sm:items-center sm:gap-2 sm:border-0 sm:p-0"
                    >
                      <div className="flex items-center justify-between sm:contents">
                        <span className="text-xs font-semibold text-faint tabular-nums sm:w-5 sm:shrink-0">
                          Set {setIndex + 1}
                        </span>
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
                          className="order-last grid h-11 w-11 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-raised hover:text-danger"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <NumberStepper
                        id={`${domId}-w-${index}-${setIndex}`}
                        name="setWeight"
                        label={`Set ${setIndex + 1} weight in kg`}
                        value={set.weight}
                        onChange={(weight) => updateSet(row.key, set.key, { weight })}
                        step={2.5}
                        placeholder="kg"
                        suffix="kg"
                        className="mt-1.5 min-w-0 sm:mt-0 sm:flex-1"
                      />
                      <NumberStepper
                        id={`${domId}-r-${index}-${setIndex}`}
                        name="setReps"
                        label={`Set ${setIndex + 1} reps`}
                        value={set.reps}
                        onChange={(reps) => updateSet(row.key, set.key, { reps })}
                        step={1}
                        placeholder="reps"
                        suffix="reps"
                        className="mt-1.5 min-w-0 sm:mt-0 sm:flex-1"
                      />
                    </li>
                  ))}
                </ul>

                <div className="mt-3 space-y-2">
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
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <Plus className="h-4 w-4" />
                    Add a set
                  </button>
                  <div>
                    <label className="sr-only" htmlFor={`${domId}-n-${index}`}>
                      Note on exercise {index + 1}
                    </label>
                    <input
                      id={`${domId}-n-${index}`}
                      className={field}
                      value={row.notes}
                      onChange={(event) => update(row.key, { notes: event.target.value })}
                      placeholder="Note (optional)"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() =>
          setRows((current) => [
            // On a phone only one is open at a time, so adding one shuts the rest.
            ...current.map((row) => (phone ? { ...row, open: false } : row)),
            {
              key: nextKey(),
              exerciseId: "",
              notes: "",
              // Nothing in it yet, so it opens on the field that needs filling.
              open: true,
              // Three sets is the common case, so a new exercise starts there
              // rather than at one and needing two more clicks.
              quickSets: "3",
              quickReps: "",
              quickWeight: "",
              sets: Array.from({ length: 3 }, () => ({ key: nextKey(), weight: "", reps: "" })),
            },
          ])
        }
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent sm:w-auto sm:px-5"
      >
        <Plus className="h-4 w-4" />
        Add an exercise
      </button>
    </div>
  );
}

/**
 * The food half of a day.
 *
 * Meals are tapped from the library, never typed, and the day's total climbs
 * as they are added so Dean can see a target being met rather than working it
 * out. Portion scales the meal's calories, macros and its share of the
 * shopping list.
 */
export function MealPlanner({
  day,
  meals,
  calorieTarget,
  lockTargets = false,
}: {
  day: PlanDay | null;
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

  const options: PickerOption[] = useMemo(
    () =>
      meals.map((meal) => ({
        id: meal.id,
        label: meal.name,
        hint: meal.calories ? `${meal.calories} kcal · ${meal.proteinG ?? 0}g protein` : undefined,
        group: meal.tag,
      })),
    [meals],
  );

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

  /**
   * Every meal's portion moved together until the day lands on the target.
   *
   * Portions come in fixed steps, so the proportional answer has to be snapped
   * to one — and snapping every meal the same way tends to miss the same way
   * too. The second pass walks the largest meal one step at a time while that
   * keeps closing the gap, which is what gets a day from "roughly right" to
   * within a portion of the number Dean typed.
   */
  const scaleToTarget = () => {
    if (targetValue <= 0 || totals.calories <= 0) return;

    const kcal = (row: MealRow) => byId.get(row.mealId)?.calories ?? 0;
    const factor = targetValue / totals.calories;

    let next = rows.map((row) => ({ ...row, multiplier: nearestPortion(row.multiplier * factor) }));
    const totalOf = (list: MealRow[]) =>
      list.reduce((sum, row) => sum + kcal(row) * row.multiplier, 0);

    // Biggest meal first: one step on a 700 kcal dinner closes more of the gap
    // than one on a 120 kcal snack, and moves fewer things about.
    const order = next
      .map((row, index) => index)
      .sort((a, b) => kcal(next[b]) - kcal(next[a]));

    for (let pass = 0; pass < 3; pass += 1) {
      for (const index of order) {
        const row = next[index];
        if (kcal(row) === 0) continue;
        const step = totalOf(next) > targetValue ? -1 : 1;
        const at = STEPS.indexOf(row.multiplier);
        const to = STEPS[at + step];
        if (to === undefined) continue;

        const candidate = next.map((entry, i) => (i === index ? { ...entry, multiplier: to } : entry));
        if (Math.abs(totalOf(candidate) - targetValue) < Math.abs(totalOf(next) - targetValue)) {
          next = candidate;
        }
      }
    }

    setRows(next);
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
            {day?.proteinTarget ? ` · ${day.proteinTarget}g protein` : ""}
          </p>
          <input type="hidden" name="calorieTarget" value={target} />
          <input type="hidden" name="proteinTarget" value={day?.proteinTarget ?? ""} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabel} htmlFor={`${domId}-kcal`}>
              Calorie target
            </label>
            <input
              id={`${domId}-kcal`}
              className={field}
              type="number"
              inputMode="numeric"
              name="calorieTarget"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor={`${domId}-protein`}>
              Protein target (g)
            </label>
            <input
              id={`${domId}-protein`}
              className={field}
              type="number"
              inputMode="numeric"
              name="proteinTarget"
              defaultValue={day?.proteinTarget ?? ""}
            />
          </div>
        </div>
      )}

      {/* The number being aimed at, moving as meals go on. Pinned while the
          list is scrolled, because the list is what changes it. */}
      <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-line bg-ink p-4 px-4 shadow-lg shadow-black/20">
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

        {targetValue > 0 && rows.length > 0 ? (
          <button
            type="button"
            onClick={scaleToTarget}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-accent/50 bg-accent/10 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            <Scale className="h-4 w-4" />
            Scale the day to {targetValue.toLocaleString("en-GB")}
          </button>
        ) : null}
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
            <li key={row.key} className="rounded-2xl border border-line bg-ink p-2.5">
              <input type="hidden" name="mealSlot" value={row.slot} />

              <div className="flex items-center gap-2">
                <PickerSheet
                  name="mealId"
                  value={row.mealId}
                  options={options}
                  onChange={(mealId) => update(row.key, { mealId })}
                  title="Pick a meal"
                  searchPlaceholder="Search meals"
                  hideChosenHint
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 hover:border-0"
                />
                <span className="shrink-0 text-xs text-faint tabular-nums">
                  {meal?.calories ? `${Math.round(meal.calories * row.multiplier)} kcal` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((entry) => entry.key !== row.key))}
                  aria-label={`Remove ${meal?.name ?? `meal ${index + 1}`}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-raised hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <label className="sr-only" htmlFor={`${domId}-slot-${index}`}>
                  Slot for meal {index + 1}
                </label>
                <select
                  id={`${domId}-slot-${index}`}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 text-sm text-text capitalize transition-colors focus:border-accent focus:outline-none"
                  value={row.slot}
                  onChange={(event) => update(row.key, { slot: event.target.value as MealTag })}
                >
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>

                <label className="sr-only" htmlFor={`${domId}-mult-${index}`}>
                  Portion for meal {index + 1}
                </label>
                <select
                  id={`${domId}-mult-${index}`}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 text-sm text-text transition-colors focus:border-accent focus:outline-none"
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
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => addMeal(slot)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line text-sm font-semibold text-muted capitalize transition-colors hover:border-accent hover:text-accent sm:px-5"
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
