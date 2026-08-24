import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Transformation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { MediaFrame } from "@/components/ui/MediaFrame";

export function TransformationCard({
  transformation,
  className,
}: {
  transformation: Transformation;
  className?: string;
}) {
  const { name, age, weeks, before, after, visual, headline, metrics, quote, goalSlug } =
    transformation;

  return (
    <article
      className={cn("lit flex flex-col rounded-[var(--radius-sheet)] bg-surface p-6", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-faint">
          {name}, {age}
        </p>
        <Chip tone="accent">{weeks} weeks</Chip>
      </div>

      {/*
       * The same shot twice, months apart. Both frames stay empty until a real
       * photo exists — see the note in `transformations.ts`.
       */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MediaFrame
          visual={visual}
          src={before}
          alt={before ? `${name} before coaching` : ""}
          caption="Before"
          tone="raised"
          className="aspect-[4/5]"
        />
        <MediaFrame
          visual={visual}
          src={after}
          alt={after ? `${name} after ${weeks} weeks` : ""}
          caption="After"
          tone="raised"
          className="aspect-[4/5]"
        />
      </div>

      <h3 className="mt-5 text-lg leading-snug text-balance">{headline}</h3>

      {/*
       * A run of figures rather than a grid of boxes: the same proof in a
       * third of the height, which is what makes room for the photos.
       */}
      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-baseline gap-1.5">
            <dt className="text-faint">{metric.label}</dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                metric.direction === "flat" ? "text-text" : "text-accent",
              )}
            >
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>

      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted">
        “{quote}”
      </blockquote>

      <Link
        href={`/coaching/${goalSlug}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
      >
        See the goal
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
