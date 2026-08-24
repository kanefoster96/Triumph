import { getMemberArea } from "@/lib/services/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconTile } from "@/components/ui/IconTile";
import { Chip } from "@/components/ui/Chip";

/**
 * Preview of the members' area. Features still being built are labelled as
 * such rather than presented as though they already exist.
 */
export async function MembersArea() {
  const features = await getMemberArea();

  return (
    <Section id="members">
      <SectionHeader
        eyebrow="Members' area"
        title="Your plan, your logs, and me — in one place"
        description="Everyone coaching with me gets a login. Your plan for the day, somewhere to record what you actually did, and a direct line to me."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {features.map((feature, i) => (
          <Reveal key={feature.id} delay={(i % 2) * 70} className="h-full">
            <div className="flex h-full gap-5 rounded-[var(--radius-sheet)] bg-surface p-6">
              <IconTile feature={feature.icon} />
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg">{feature.title}</h3>
                  {feature.comingSoon ? <Chip tone="amber">In build</Chip> : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={140}>
        <p className="mt-8 text-center text-sm text-faint">
          The members&rsquo; area is being built now. Coaching, plans and check-ins are running today —
          they arrive by email and message until the app is live.
        </p>
      </Reveal>
    </Section>
  );
}
