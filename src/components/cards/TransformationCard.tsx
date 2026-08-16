import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MetricDelta, Transformation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";

function Metric({ metric }: { metric: MetricDelta }) {
  return (
    <div className="rounded-xl border border-line bg-ink px-3 py-2.5">
      <p className="text-[11px] tracking-wide text-faint uppercase">{metric.label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold",
          metric.direction === "flat" ? "text-text" : "text-accent",
        )}
      >
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
        "flex flex-col rounded-[var(--radius-sheet)] border border-line bg-surface p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-faint">
          {transformation.name}, {transformation.age}
        </p>
        <Chip tone="accent">{transformation.weeks} weeks</Chip>
      </div>

      <h3 className="mt-3 text-lg leading-snug text-balance">{transformation.headline}</h3>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {transformation.metrics.map((metric) => (
          <Metric key={metric.label} metric={metric} />
        ))}
      </div>

      <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-muted">
        “{transformation.quote}”
      </blockquote>

      <Link
        href={`/programmes/${transformation.programmeSlug}`}
        className="mt-5 inline-flex items-center gap-1.5 border-t border-line pt-4 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
      >
        See the programme
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
