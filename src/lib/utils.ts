/** Tiny class-name joiner — avoids a dependency for what is a one-liner. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function formatPrice(value: number, currency = "£"): string {
  return `${currency}${value.toLocaleString("en-GB")}`;
}

export function formatCadence(cadence: "week" | "month" | "session"): string {
  return cadence === "session" ? "per session" : `per ${cadence}`;
}

/** "3 days ago" — kept relative so the feed reads like an app timeline. */
export function relativeDate(iso: string, now: Date = new Date()): string {
  const then = new Date(`${iso}T00:00:00Z`);
  const days = Math.round((now.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return then.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function compactNumber(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${value}`;
}
