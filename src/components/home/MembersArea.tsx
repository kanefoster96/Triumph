import { getMemberArea } from "@/lib/services/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MemberTour } from "./MemberTour";

/**
 * A walk through the members' area, one screen at a time.
 *
 * The point is to show somebody what they are signing up to. Anything listed
 * here has to exist behind the login — see the note in `coaching.ts`.
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
    </Section>
  );
}
