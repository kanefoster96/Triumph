import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DayMarker {
  /** A session with Dean. */
  session?: boolean;
  /** A workout the client does alone. */
  workout?: boolean;
  /** Shown in the corner of the cell. */
  count?: number;
}

interface MonthCalendarProps {
  /** YYYY-MM. */
  month: string;
  /** YYYY-MM-DD — the day whose detail is shown beneath. */
  selected: string;
  /** YYYY-MM-DD, outlined so "now" is always findable. */
  today: string;
  markers: Record<string, DayMarker>;
  /** Day links are appended to this path as ?month=&date=. */
  basePath: string;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shiftMonth(month: string, by: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * A month grid built entirely from links — no client JavaScript, so it works
 * on a slow phone and the selected day is shareable as a URL.
 */
export function MonthCalendar({ month, selected, today, markers, basePath }: MonthCalendarProps) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  // getUTCDay() is Sunday-first; the grid starts on Monday.
  const leading = (first.getUTCDay() + 6) % 7;
  const cells: Array<string | null> = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return `${month}-${day}`;
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const href = (params: { month?: string; date?: string }) => {
    const search = new URLSearchParams();
    search.set("month", params.month ?? month);
    if (params.date) search.set("date", params.date);
    return `${basePath}?${search.toString()}`;
  };

  const all = Object.values(markers);
  const hasSessions = all.some((m) => m.session);
  const hasWorkouts = all.some((m) => m.workout);

  const monthLabel = first.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href={href({ month: shiftMonth(month, -1) })}
          aria-label="Previous month"
          className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-text"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-base font-semibold">{monthLabel}</p>
        <Link
          href={href({ month: shiftMonth(month, 1) })}
          aria-label="Next month"
          className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-text"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-center text-[11px] font-semibold text-faint">
            {label}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`pad-${index}`} />;

          const marker = markers[date];
          const isSelected = date === selected;
          const isToday = date === today;

          return (
            <Link
              key={date}
              href={href({ date })}
              aria-current={isSelected ? "date" : undefined}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors",
                isSelected
                  ? "bg-accent font-bold text-accent-ink"
                  : isToday
                    ? "border border-accent/50 text-text hover:bg-raised"
                    : "text-muted hover:bg-raised",
              )}
            >
              <span>{Number(date.slice(-2))}</span>

              {marker ? (
                <span className="mt-1 flex items-center gap-0.5">
                  {marker.session ? (
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-accent-ink" : "bg-accent")}
                    />
                  ) : null}
                  {marker.workout ? (
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-accent-ink/60" : "bg-muted")}
                    />
                  ) : null}
                </span>
              ) : (
                <span className="mt-1 h-1.5" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Only legend what is actually on this calendar. An online client never
          has a session with Dean, so explaining that dot would be noise. */}
      {hasSessions || hasWorkouts ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-faint">
          {hasSessions ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Session with Dean
            </span>
          ) : null}
          {hasWorkouts ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              Workout to complete
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Shared helper so every screen derives the month/day the same way. */
export function resolveCalendarParams(
  params: { month?: string; date?: string },
  fallbackToday: string,
): { month: string; selected: string } {
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? (params.date as string) : fallbackToday;
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? (params.month as string) : selected.slice(0, 7);
  return { month, selected };
}
