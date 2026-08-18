"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A number you can nudge without the keyboard.
 *
 * Building a session on a phone was thirty taps into a numeric keypad that
 * covered half the screen, and every one of those numbers is a step away from
 * the one above it — 60, 62.5, 65. The buttons handle that case; the field is
 * still a field, so typing 82.5 straight in is one tap away.
 *
 * The buttons are `type="button"`: inside a form, a bare button submits it.
 */
export function NumberStepper({
  id,
  name,
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  placeholder,
  suffix,
  className,
}: {
  id: string;
  /** Submitted with the form. Omit for a control that only drives state. */
  name?: string;
  /** Read by screen readers; the visible label is the suffix or the context. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  suffix?: string;
  className?: string;
}) {
  const nudge = (by: number) => {
    const current = Number(value);
    const from = Number.isFinite(current) && value !== "" ? current : 0;
    const next = Math.min(max ?? Infinity, Math.max(min, from + by));
    // Trailing zeroes on a half-kilo step read as noise: 62.5, then 65.
    onChange(String(Number(next.toFixed(2))));
  };

  return (
    <div className={cn("flex items-stretch gap-1", className)}>
      <button
        type="button"
        onClick={() => nudge(-step)}
        aria-label={`${label}: down ${step}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors hover:border-accent hover:text-accent active:bg-raised"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="relative min-w-0 flex-1">
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-11 w-full rounded-xl border border-line bg-ink text-center text-sm font-semibold text-text tabular-nums transition-colors placeholder:font-normal placeholder:text-faint focus:border-accent focus:outline-none",
            suffix ? "pr-7 pl-2" : "px-2",
          )}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-faint">
            {suffix}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => nudge(step)}
        aria-label={`${label}: up ${step}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-muted transition-colors hover:border-accent hover:text-accent active:bg-raised"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
