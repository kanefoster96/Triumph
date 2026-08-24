import { getSocialProof } from "@/lib/services/content";
import { getActiveMemberCount } from "@/lib/members/service";
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
 * state rather than a gap. The stars are averaged from those same reviews
 * rather than stated separately, so this and the wall of reviews further down
 * cannot disagree.
 */
export async function HeroProof() {
  const { people, rating, clients } = await getSocialProof();

  return (
    <div className="mt-9 flex flex-col items-center gap-3.5">
      {/*
       * The overlap is what it is because these are initials, not faces. A
       * photo fills its circle and can be covered by a third; two letters sit
       * in the middle of one, and past about ten pixels the next avatar eats
       * them — "AB" reads as "AE".
       */}
      <div className="flex -space-x-2.5">
        {people.map((person) => (
          <Avatar
            key={person.name}
            name={person.name}
            src={person.photo}
            size="md"
            className="ring-2 ring-ink"
          />
        ))}
      </div>

      <Rating value={Math.round(rating)} />

      <p className="text-sm text-muted">
        Join{" "}
        <span className="font-semibold text-text">
          <CountUp value={clients.value} />
          {clients.suffix} people
        </span>{" "}
        improving themselves daily
      </p>
    </div>
  );
}

/**
 * How many members were in today — the hero's badge.
 *
 * Zero is shown rather than hidden, but not as "0 members active today",
 * which reads as a dead site. Nobody in yet is the one morning where being
 * first is on offer, so the badge offers it.
 *
 * It still renders nothing when the count could not be had. That is not a
 * quiet day, it is a broken read, and inviting somebody to be first when we
 * have no idea who is already there would be making it up.
 */
export async function LiveMembers() {
  const active = await getActiveMemberCount();
  if (active === null) return null;

  if (active === 0) {
    return (
      <p className="lit inline-flex items-center gap-2.5 rounded-full bg-raised px-4 py-2 text-sm text-muted">
        <span className="grid h-2 w-2 place-items-center text-success">
          <span className="pulse-dot h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="font-semibold text-text">Be the first</span> in today
      </p>
    );
  }

  return (
    <p className="lit inline-flex items-center gap-2.5 rounded-full bg-raised px-4 py-2 text-sm text-muted">
      <span className="grid h-2 w-2 place-items-center text-success">
        <span className="pulse-dot h-2 w-2 rounded-full bg-success" />
      </span>
      <span className="font-semibold text-text">
        {active} member{active === 1 ? "" : "s"}
      </span>{" "}
      active today
    </p>
  );
}
