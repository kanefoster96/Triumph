"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { field, fieldLabel, submitButton } from "./ui";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface PlanAssignerProps {
  clientId: string;
  today: string;
  plans: Array<{ id: string; name: string }>;
  action: (formData: FormData) => void;
  /** Wording differs slightly between a workout and a day of food. */
  noun: string;
  emptyHint: string;
}

/**
 * Pick a plan, pick the days it lands on.
 *
 * Ticking weekdays is the "repeat weekly" behaviour: tick Mon/Wed/Fri over
 * four weeks and it fills twelve days in one go. Individual days stay
 * editable afterwards.
 */
export function PlanAssigner({ clientId, today, plans, action, noun, emptyHint }: PlanAssignerProps) {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 27));
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  // Mirrors the server's cap, so the count shown is the count applied.
  const preview = (() => {
    const start = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

    let count = 0;
    const cursor = new Date(start);
    while (cursor <= end && count < 30) {
      if (weekdays.length === 0 || weekdays.includes(cursor.getUTCDay())) count += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return count;
  })();

  if (plans.length === 0) {
    return <p className="text-sm text-faint">{emptyHint}</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="clientId" value={clientId} />

      <div>
        <label className={fieldLabel} htmlFor={`plan-${noun}`}>
          Plan
        </label>
        <select id={`plan-${noun}`} name="planId" className={field} required>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={fieldLabel} htmlFor={`from-${noun}`}>
            From
          </label>
          <input
            id={`from-${noun}`}
            className={field}
            type="date"
            name="from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`to-${noun}`}>
            To
          </label>
          <input
            id={`to-${noun}`}
            className={field}
            type="date"
            name="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {noun === "workout" ? (
        <div>
          <label className={fieldLabel} htmlFor="suggested-time">
            Suggested time (optional)
          </label>
          <input id="suggested-time" className={field} type="time" name="suggestedTime" />
          <p className="mt-2 text-xs text-faint">
            Leave empty and it is simply a workout to complete that day, whenever suits them.
          </p>
        </div>
      ) : null}

      <fieldset>
        <legend className={fieldLabel}>On these days</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const on = weekdays.includes(day.value);
            return (
              <label
                key={day.value}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  on
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line bg-ink text-muted hover:border-accent/50 hover:text-text",
                )}
              >
                <input
                  type="checkbox"
                  name="weekdays"
                  value={day.value}
                  checked={on}
                  onChange={() =>
                    setWeekdays((current) =>
                      current.includes(day.value)
                        ? current.filter((v) => v !== day.value)
                        : [...current, day.value],
                    )
                  }
                  className="sr-only"
                />
                {day.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center gap-2.5 text-sm text-muted">
        <input type="checkbox" name="overwrite" className="h-4 w-4 accent-[var(--color-accent)]" />
        Replace days that already have {noun === "food" ? "a plan" : "a workout"}
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className={submitButton} disabled={preview === 0}>
          Assign to {preview} {preview === 1 ? "day" : "days"}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-faint">
          <CalendarRange className="h-3.5 w-3.5" />
          Up to 30 days at a time
        </span>
      </div>
    </form>
  );
}
