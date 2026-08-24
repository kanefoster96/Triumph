import { getSocialProof } from "@/lib/services/content";
import { Avatar } from "@/components/members/Avatar";
import { Rating } from "@/components/ui/Rating";
import { CountUp } from "@/components/ui/CountUp";

/**
 * Who is already training, right under the buttons.
 *
 * This replaced a pair of big figures — "80+ clients helped" and "5/5 star
 * rating" — which said the same two things at four times the height and
 * without showing anybody. Faces, then the rating those faces gave, then the
 * number: proof reads better as people than as statistics.
 *
 * Nobody here is invented. The faces are the review authors, so real reviews
 * make this real, and a photo dropped into `public/clients` lights one up
 * with no change here. Until then they are initials, which is the normal
 * state rather than a gap.
 */
export async function HeroProof() {
  const { people, rating, reviews, clients } = await getSocialProof();

  return (
    <div className="mt-9 flex flex-col items-center gap-3.5">
      {/*
       * Overlapped, each carrying a ring in the page's own colour. That is a
       * gap rather than an outline — without it the circles merge into one
       * shape where they cross.
       */}
      {/*
       * The overlap is what it is because these are initials, not faces. A
       * photo fills its circle and can be covered by a third; two letters sit
       * in the middle of one, and past about ten pixels the next avatar eats
       * them — "AB" reads as "AE".
       */}
      <div className="flex -space-x-2.5">
        {people.map((person) => (
          <Avatar key={person.name} name={person.name} src={person.photo} size="md" className="ring-2 ring-ink" />
        ))}
      </div>

      <Rating value={Math.round(rating)} />

      <p className="text-sm text-muted">
        <span className="font-semibold text-text">
          {rating} out of 5
        </span>{" "}
        from {reviews} reviews · join{" "}
        <span className="font-semibold text-text">
          <CountUp value={clients.value} />
          {clients.suffix}
        </span>{" "}
        people training with Dean
      </p>
    </div>
  );
}
