import { ArrowRight, Replace, Trash2 } from "lucide-react";
import { removeSwap, swapIngredient } from "@/lib/members/actions";
import { UNITS, formatAmount, type IngredientSwap, type Meal, type PlanMealSlot } from "@/lib/members/types";
import { scaleMeal } from "@/lib/members/service";
import { field, fieldLabel } from "./ui";

/**
 * What is actually in a client's day, and how to change one thing in it.
 *
 * Dean could pick a meal and pick a portion; he could not see what the meal
 * was made of without opening the library, where the recipe is shared and
 * editing it changes everyone's. So "she does not want salmon" meant either
 * replacing the whole meal or changing it for four other people.
 *
 * The ingredients listed here are the library's, not the swapped ones, so the
 * swap always names the line it replaces — otherwise swapping cod for chicken
 * would record "replace cod", which the recipe has never heard of.
 */
export function MealBreakdown({
  clientId,
  date,
  dateLabel,
  slots,
  library,
  swaps,
  fromReview = false,
}: {
  clientId: string;
  date: string;
  dateLabel: string;
  slots: PlanMealSlot[];
  /** The unswapped meals, by id. */
  library: Map<string, Meal>;
  swaps: IngredientSwap[];
  /** Came in from the weekly review, so a save goes back to it. */
  fromReview?: boolean;
}) {
  if (slots.length === 0) {
    return <p className="text-sm text-faint">No meals on this day yet.</p>;
  }

  const swapFor = (mealId: string, name: string) => {
    const key = name.trim().toLowerCase();
    const matches = swaps.filter((s) => s.replaces.trim().toLowerCase() === key);
    return matches.find((s) => s.mealId === mealId) ?? matches.find((s) => s.mealId === null) ?? null;
  };

  return (
    <div className="space-y-4">
      {slots.map((slot) => {
        const original = library.get(slot.meal.id) ?? slot.meal;
        const scaled = scaleMeal(original, slot.multiplier);
        // `slot.meal` already has the client's swaps applied, and applySwaps
        // keeps each ingredient's id — so this is how the amount Dean sees is
        // the amount they will actually get, not the recipe's.
        const asPlanned = new Map(
          scaleMeal(slot.meal, slot.multiplier).ingredients.map((i) => [i.id, i]),
        );

        return (
          <div key={slot.id} className="rounded-2xl border border-line bg-ink p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">
                <span className="text-faint">{slot.slot}</span> · {original.name}
              </p>
              <p className="text-xs text-faint tabular-nums">
                {scaled.calories ?? "—"} kcal · {scaled.proteinG ?? 0}g protein
              </p>
            </div>

            <ul className="mt-3 divide-y divide-line">
              {scaled.ingredients.map((ingredient) => {
                const swap = swapFor(original.id, ingredient.name);

                return (
                  <li key={ingredient.id} className="py-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="min-w-0 text-sm">
                        {swap ? (
                          <span className="inline-flex flex-wrap items-center gap-1.5">
                            <span className="text-faint line-through">{ingredient.name}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 text-accent" />
                            <span className="font-semibold text-accent">
                              {swap.name ?? "removed"}
                            </span>
                          </span>
                        ) : (
                          ingredient.name
                        )}
                      </span>
                      <span className="shrink-0 text-sm text-muted tabular-nums">
                        {(() => {
                          const shown = asPlanned.get(ingredient.id);
                          if (!shown) return "—";
                          return formatAmount(shown.quantity, shown.unit);
                        })()}
                      </span>
                    </div>

                    {swap ? (
                      <form action={removeSwap} className="mt-2">
                        <input type="hidden" name="swapId" value={swap.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-danger"
                        >
                          <Trash2 className="h-3 w-3" />
                          Put {ingredient.name.toLowerCase()} back
                          {swap.onlyOn ? " (this date only)" : ` (from ${swap.effectiveFrom})`}
                        </button>
                      </form>
                    ) : (
                      <details className="mt-1 group">
                        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent">
                          <Replace className="h-3 w-3" />
                          Swap this out
                        </summary>

                        <form
                          action={swapIngredient}
                          className="mt-3 space-y-3 rounded-xl border border-line bg-surface p-3"
                        >
                          <input type="hidden" name="clientId" value={clientId} />
                          <input type="hidden" name="replaces" value={ingredient.name} />
                          <input type="hidden" name="from" value={date} />
                          {fromReview ? <input type="hidden" name="review" value="1" /> : null}

                          <div>
                            <label className={fieldLabel} htmlFor={`swap-${slot.id}-${ingredient.id}`}>
                              Use instead
                            </label>
                            <input
                              id={`swap-${slot.id}-${ingredient.id}`}
                              className={field}
                              name="name"
                              placeholder="Something else"
                            />
                            <p className="mt-1.5 text-xs text-faint">
                              Leave it empty to take {ingredient.name.toLowerCase()} out altogether.
                            </p>
                          </div>

                          <div className="flex items-end gap-2">
                            <div className="w-24">
                              <label className={fieldLabel} htmlFor={`swapq-${slot.id}-${ingredient.id}`}>
                                Amount
                              </label>
                              <input
                                id={`swapq-${slot.id}-${ingredient.id}`}
                                className={field}
                                type="number"
                                step="any"
                                min="0"
                                inputMode="decimal"
                                name="quantity"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <label className={fieldLabel} htmlFor={`swapu-${slot.id}-${ingredient.id}`}>
                                Unit
                              </label>
                              <select
                                id={`swapu-${slot.id}-${ingredient.id}`}
                                className={field}
                                name="unit"
                                defaultValue=""
                              >
                                <option value="">Same as before</option>
                                {UNITS.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <p className="text-xs text-faint">
                            Per serving, so their portion still scales it. Leave both alone to keep
                            the same amount.
                          </p>

                          <fieldset>
                            <legend className={fieldLabel}>Where</legend>
                            <div className="mt-2 space-y-1.5">
                              <label className="flex items-center gap-2.5 text-sm text-muted">
                                <input
                                  type="radio"
                                  name="mealId"
                                  value={original.id}
                                  defaultChecked
                                  className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                                />
                                Just in {original.name}
                              </label>
                              <label className="flex items-center gap-2.5 text-sm text-muted">
                                <input
                                  type="radio"
                                  name="mealId"
                                  value=""
                                  className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                                />
                                Any meal with {ingredient.name.toLowerCase()} in it
                              </label>
                            </div>
                          </fieldset>

                          {/* Same two choices, and the same words, as editing a
                              plan day — this is the same decision. */}
                          <fieldset>
                            <legend className={fieldLabel}>How far does this reach?</legend>
                            <div className="mt-2 space-y-1.5">
                              <label className="flex items-center gap-2.5 text-sm text-muted">
                                <input
                                  type="radio"
                                  name="scope"
                                  value="forward"
                                  defaultChecked
                                  className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                                />
                                From {dateLabel} onwards
                              </label>
                              <label className="flex items-center gap-2.5 text-sm text-muted">
                                <input
                                  type="radio"
                                  name="scope"
                                  value="date"
                                  className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                                />
                                Just {dateLabel}
                              </label>
                            </div>
                          </fieldset>

                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
                          >
                            Save the swap
                          </button>
                        </form>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
