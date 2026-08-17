"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { UNITS, type Ingredient } from "@/lib/members/types";
import { field, fieldLabel } from "./ui";
import { cn } from "@/lib/utils";

interface Row {
  key: string;
  name: string;
  quantity: string;
  unit: string;
}

function toRow(ingredient: Ingredient, index: number): Row {
  return {
    key: `${ingredient.id}-${index}`,
    name: ingredient.name,
    quantity: ingredient.quantity === null ? "" : String(ingredient.quantity),
    unit: ingredient.unit ?? "",
  };
}

let seed = 0;
const blank = (): Row => ({ key: `new-${(seed += 1)}`, name: "", quantity: "", unit: "" });

/**
 * One row per ingredient, rather than a line of text to parse.
 *
 * The shopping list scales quantities by a client's multiplier and merges the
 * same ingredient across meals, and neither works on a number without a unit —
 * so the unit is required the moment a quantity is typed. "whole" is in the
 * list precisely so a banana has somewhere to go.
 */
export function IngredientRows({ ingredients }: { ingredients: Ingredient[] }) {
  const listId = useId();
  const [rows, setRows] = useState<Row[]>(() =>
    ingredients.length > 0 ? ingredients.map(toRow) : [blank()],
  );

  const update = (key: string, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div>
      <span className={fieldLabel}>Ingredients</span>

      <ul className="space-y-2">
        {rows.map((row, index) => {
          const unitRequired = row.quantity.trim() !== "";
          const missing = unitRequired && row.unit === "";

          return (
            <li key={row.key} className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor={`${listId}-name-${index}`}>
                  Ingredient {index + 1} name
                </label>
                <input
                  id={`${listId}-name-${index}`}
                  className={field}
                  name="ingName"
                  value={row.name}
                  onChange={(event) => update(row.key, { name: event.target.value })}
                  placeholder="Chicken breast"
                />
              </div>

              <div className="w-24">
                <label className="sr-only" htmlFor={`${listId}-qty-${index}`}>
                  Ingredient {index + 1} quantity
                </label>
                <input
                  id={`${listId}-qty-${index}`}
                  className={field}
                  type="number"
                  step="any"
                  min="0"
                  name="ingQuantity"
                  value={row.quantity}
                  onChange={(event) => update(row.key, { quantity: event.target.value })}
                  placeholder="150"
                />
              </div>

              <div className="w-32">
                <label className="sr-only" htmlFor={`${listId}-unit-${index}`}>
                  Ingredient {index + 1} unit
                </label>
                <select
                  id={`${listId}-unit-${index}`}
                  className={cn(field, missing && "border-amber")}
                  name="ingUnit"
                  required={unitRequired}
                  value={row.unit}
                  onChange={(event) => update(row.key, { unit: event.target.value })}
                >
                  <option value="">{unitRequired ? "Pick a unit" : "No unit"}</option>
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setRows((current) => current.filter((entry) => entry.key !== row.key))}
                aria-label={`Remove ingredient ${index + 1}`}
                className="rounded-full p-2.5 text-faint transition-colors hover:bg-raised hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setRows((current) => [...current, blank()])}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <Plus className="h-4 w-4" />
        Add ingredient
      </button>

      <p className="mt-2 text-xs text-faint">
        A quantity needs a unit so the shopping list can scale and merge it. Use <strong>whole</strong> for a
        banana or an egg.
      </p>
    </div>
  );
}
