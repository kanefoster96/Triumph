import type { ScheduleSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";

function Availability({ slot }: { slot: ScheduleSlot }) {
  if (slot.spots === 0) return <Chip>Full</Chip>;
  if (slot.spots <= 2) return <Chip tone="heat">{slot.spots} left</Chip>;
  return <Chip tone="success">{slot.spots} spaces</Chip>;
}

/** Weekly timetable grouped by day — reads as a native list view. */
export function ScheduleList({ slots }: { slots: ScheduleSlot[] }) {
  const days = [...new Set(slots.map((s) => s.day))];

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day}>
          <h3 className="mb-2 text-xs font-semibold tracking-[0.18em] text-faint uppercase">{day}</h3>
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {slots
              .filter((slot) => slot.day === day)
              .map((slot) => (
                <li key={slot.id} className="flex items-center gap-4 px-4 py-3.5">
                  <span
                    className={cn(
                      "font-display text-lg font-bold tabular-nums",
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
                  <Availability slot={slot} />
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
