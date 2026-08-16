import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import type { Programme } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";

export function ProgrammeCard({ programme, className }: { programme: Programme; className?: string }) {
  return (
    <Link
      href={`/programmes/${programme.slug}`}
      className={cn(
        "group flex flex-col rounded-[var(--radius-sheet)] border border-line bg-surface p-6",
        "transition-colors duration-200 hover:border-accent/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <IconTile visual={programme.visual} />
        <div className="flex flex-wrap justify-end gap-2">
          {programme.popular ? <Chip tone="accent">Most popular</Chip> : null}
          <Chip>{programme.format}</Chip>
        </div>
      </div>

      <h3 className="mt-5 text-xl">{programme.name}</h3>
      <p className="mt-1.5 text-sm font-medium text-accent">{programme.tagline}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{programme.summary}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-faint">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {programme.durationWeeks} weeks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {programme.sessionsPerWeek}× per week
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text">
          from {formatPrice(programme.priceFromPerWeek)}
          <span className="font-normal text-faint">/week</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          Details
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
