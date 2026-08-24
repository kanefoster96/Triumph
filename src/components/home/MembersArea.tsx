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
        title="See exactly where you stand, every single day"
        description="Your own app tracks your food, training and progress — so you always know you&rsquo;re on target, and Dean sees it too."
      />

      <Reveal>
        <MemberTour features={tour} />
      </Reveal>
    </Section>
  );
}
