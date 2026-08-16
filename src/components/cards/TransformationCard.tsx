import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { MetricDelta, Transformation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { MediaFrame } from "@/components/ui/MediaFrame";

const directionIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

function Metric({ metric }: { metric: MetricDelta }) {
  const Icon = directionIcon[metric.direction];
  return (
    <div className="rounded-xl bg-raised px-3 py-2.5">
      <p className="text-[11px] tracking-wide text-faint uppercase">{metric.label}</p>
      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-text">
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            metric.direction === "flat" ? "text-faint" : "text-accent",
          )}
        />
        {metric.value}
      </p>
    </div>
  );
}

export function TransformationCard({
  transformation,
  className,
}: {
  transformation: Transformation;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface",
        className,
      )}
    >
      <MediaFrame
        visual={transformation.visual}
        caption={transformation.name}
        className="h-32 rounded-none border-0 border-b border-line"
      >
        <div className="absolute top-3 left-3">
          <Chip tone="accent">{transformation.weeks} weeks</Chip>
        </div>
      </MediaFrame>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-faint">
          {transformation.name}, {transformation.age}
        </p>
        <h3 className="mt-1 text-lg leading-snug text-balance">{transformation.headline}</h3>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {transformation.metrics.map((metric) => (
            <Metric key={metric.label} metric={metric} />
          ))}
        </div>

        <blockquote className="mt-4 flex-1 border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-muted italic">
          “{transformation.quote}”
        </blockquote>

        <Link
          href={`/programmes/${transformation.programmeSlug}`}
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
        >
          See the programme
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
