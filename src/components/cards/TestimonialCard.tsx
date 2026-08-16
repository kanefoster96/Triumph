import type { Testimonial } from "@/lib/types";
import { cn, initials, relativeDate } from "@/lib/utils";
import { Rating } from "@/components/ui/Rating";

export function TestimonialCard({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-raised text-sm font-bold text-accent">
          {initials(testimonial.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{testimonial.name}</p>
          <p className="truncate text-xs text-faint">
            {testimonial.handle} · {testimonial.role}
          </p>
        </div>
        <Rating value={testimonial.rating} className="ml-auto shrink-0" />
      </div>

      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted">
        “{testimonial.body}”
      </blockquote>

      <figcaption className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-faint">
        <span className="font-medium text-accent">{testimonial.programme}</span>
        <span>{relativeDate(testimonial.date)}</span>
      </figcaption>
    </figure>
  );
}
