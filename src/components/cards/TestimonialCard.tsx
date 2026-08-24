import type { Testimonial } from "@/lib/types";
import { cn, relativeDate } from "@/lib/utils";
import { Rating } from "@/components/ui/Rating";
import { Avatar } from "@/components/members/Avatar";

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
        "lit flex flex-col rounded-[var(--radius-sheet)] bg-surface p-6",
        className,
      )}
    >
      <Rating value={testimonial.rating} />

      <blockquote className="mt-5 flex-1 text-base leading-relaxed text-text">
        “{testimonial.body}”
      </blockquote>

      {/* A face where there is one, initials where there is not — the same
          fallback the app uses, so a review without a photo does not read as
          a review with a broken one. */}
      <figcaption className="mt-6 flex items-center gap-3">
        <Avatar name={testimonial.name} src={testimonial.photo} size="md" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{testimonial.name}</span>
          <span className="mt-0.5 block text-xs text-faint">
            {testimonial.goal} · {relativeDate(testimonial.date)}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
