import { getMemberArea } from "@/lib/services/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MemberTour } from "./MemberTour";

/**
 * A walk through the members' area, one screen at a time.
 *
 * Features still being built are labelled as such and the preview says out
 * loud that it is a drawing rather than a screenshot — the point is to show
 * somebody what they are signing up to, not to imply it already exists.
 */
export async function MembersArea() {
  const features = await getMemberArea();
  const tour = features.filter((feature) => feature.preview);

  return (
    <Section id="members">
      <SectionHeader
        eyebrow="Members' area"
        title="Your plan, your logs, and me — in one place"
        description="Everyone coaching with me gets a login. Have a look through the screens you get."
      />

      <Reveal>
        <MemberTour features={tour} />
      </Reveal>

      <Reveal delay={140}>
        <p className="mt-10 text-center text-sm text-faint">
          The members&rsquo; area is being built now. Coaching, plans and check-ins are running today —
          they arrive by email and message until the app is live.
        </p>
      </Reveal>
    </Section>
  );
}
