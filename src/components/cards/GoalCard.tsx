import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";

export function GoalCard({ goal, className }: { goal: Goal; className?: string }) {
  return (
    <Link
      href={`/coaching/${goal.slug}`}
      className={cn(
        "group flex flex-col rounded-[var(--radius-sheet)] bg-surface p-6",
        "transition-colors duration-200 hover:bg-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <IconTile visual={goal.visual} />
        {/* No level chip: a goal belongs to a person, and people do not
            arrive graded. */}
        {goal.popular ? <Chip tone="accent">Most common</Chip> : null}
      </div>

      <h3 className="mt-5 text-xl">{goal.name}</h3>
      <p className="mt-1.5 text-sm font-medium text-accent">{goal.tagline}</p>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{goal.summary}</p>

      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        See how it works
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
