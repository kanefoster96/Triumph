import type { ScheduleSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";

function Availability({ slot }: { slot: ScheduleSlot }) {
  if (slot.spots === 0) return <Chip>Full</Chip>;
  if (slot.spots <= 2) return <Chip tone="amber">{slot.spots} left</Chip>;
  return <Chip tone="success">{slot.spots} spaces</Chip>;
}

/** Weekly timetable grouped by day — reads as a native list view. */
export function ScheduleList({ slots }: { slots: ScheduleSlot[] }) {
  const days = [...new Set(slots.map((s) => s.day))];

  return (
    <div className="min-w-0 space-y-6">
      {days.map((day) => (
        <div key={day}>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] text-faint uppercase">{day}</h3>
          <ul className="min-w-0 divide-y divide-line overflow-hidden rounded-[var(--radius-sheet)] border border-line bg-surface">
            {/* min-w-0 all the way down, or the nowrap title sets the row's
                minimum width and widens the whole grid column. */}
            {slots
              .filter((slot) => slot.day === day)
              .map((slot) => (
                <li key={slot.id} className="flex min-w-0 items-center gap-4 px-4 py-3.5">
                  <span
                    className={cn(
                      "shrink-0 text-lg font-bold tabular-nums",
                      slot.spots === 0 ? "text-faint" : "text-accent",
                    )}
                  >
                    {slot.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-semibold", slot.spots === 0 && "text-muted")}>
                      {slot.title}
                    </p>
                    <p className="truncate text-xs text-faint">
                      {slot.format} · {slot.location}
                    </p>
                  </div>
                  <span className="shrink-0"><Availability slot={slot} /></span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
