import type { Testimonial } from "@/lib/types";
import { cn, relativeDate } from "@/lib/utils";
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
        "flex flex-col rounded-[var(--radius-sheet)] bg-surface p-6",
        className,
      )}
    >
      <Rating value={testimonial.rating} />

      <blockquote className="mt-5 flex-1 text-base leading-relaxed text-text">
        “{testimonial.body}”
      </blockquote>

      <figcaption className="mt-6">
        <p className="text-sm font-semibold">{testimonial.name}</p>
        <p className="mt-0.5 text-xs text-faint">
          {testimonial.programme} · {relativeDate(testimonial.date)}
        </p>
      </figcaption>
    </figure>
  );
}
