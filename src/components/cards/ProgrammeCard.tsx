import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import type { Programme } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { MediaFrame } from "@/components/ui/MediaFrame";

export function ProgrammeCard({ programme, className }: { programme: Programme; className?: string }) {
  return (
    <Link
      href={`/programmes/${programme.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface",
        "transition-[transform,border-color] duration-300 ease-[var(--ease-out-app)]",
        "hover:-translate-y-1 hover:border-accent/40 active:scale-[0.99]",
        className,
      )}
    >
      <MediaFrame
        visual={programme.visual}
        caption={programme.name}
        className="h-36 rounded-none border-0 border-b border-line"
      >
        <div className="absolute top-3 right-3 flex gap-2">
          {programme.popular ? <Chip tone="accent">Most popular</Chip> : null}
          <Chip>{programme.format}</Chip>
        </div>
      </MediaFrame>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl leading-tight">{programme.name}</h3>
          <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-faint transition-colors group-hover:text-accent" />
        </div>
        <p className="mt-1 text-sm font-medium text-accent">{programme.tagline}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{programme.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-faint">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {programme.durationWeeks} weeks
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {programme.sessionsPerWeek}× per week
          </span>
          <span className="ml-auto font-semibold text-text">
            from {formatPrice(programme.priceFromPerWeek)}
            <span className="font-normal text-faint">/wk</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
