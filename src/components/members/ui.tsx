import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared form styling for the admin editors. */
export const field =
  "w-full rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none";
export const fieldLabel =
  "mb-2 block text-xs font-semibold tracking-[0.14em] text-faint uppercase";
export const submitButton =
  "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint";

/** Page heading for a member or admin screen. */
export function ScreenTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  /** A node rather than a string so a screen can hide its blurb on a phone. */
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[var(--radius-sheet)] border border-line bg-surface", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-faint">{children}</p>;
}

/** Calories logged against the day's target. */
export function CalorieBar({ total, target }: { total: number; target: number | null }) {
  const pct = target ? Math.min(100, Math.round((total / target) * 100)) : 0;
  const over = target ? total > target : false;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-3xl font-bold tracking-tight">
          {total.toLocaleString("en-GB")}
          {target ? (
            <span className="text-base font-normal text-faint">
              {" "}
              / {target.toLocaleString("en-GB")} kcal
            </span>
          ) : (
            <span className="text-base font-normal text-faint"> kcal</span>
          )}
        </p>
        {target ? (
          <span className={cn("text-sm font-semibold", over ? "text-amber" : "text-accent")}>
            {over ? `${(total - target).toLocaleString("en-GB")} over` : `${(target - total).toLocaleString("en-GB")} left`}
          </span>
        ) : null}
      </div>

      {target ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", over ? "bg-amber" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Sparkline-style weight history. Deliberately plain — it is a trend, not a chart. */
export function WeightTrend({ entries }: { entries: Array<{ loggedFor: string; weightKg: number }> }) {
  const points = [...entries].reverse().slice(-30);
  if (points.length < 2) return <EmptyState>Log a couple of days to see the trend.</EmptyState>;

  const values = points.map((p) => p.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const path = points
    .map((point, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - ((point.weightKg - min) / range) * 100;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const change = values[values.length - 1] - values[0];

  return (
    <div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-28 w-full"
        role="img"
        aria-label={`Weight trend over the last ${points.length} entries`}
      >
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-3 flex items-center justify-between text-xs text-faint">
        <span>{min.toFixed(1)}kg low</span>
        <span className={cn("font-semibold", change <= 0 ? "text-accent" : "text-amber")}>
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}kg over {points.length} entries
        </span>
        <span>{max.toFixed(1)}kg high</span>
      </div>
    </div>
  );
}
