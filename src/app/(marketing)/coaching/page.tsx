import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { getCoachingPrice, getProgrammes } from "@/lib/services/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProgrammeCard } from "@/components/cards/ProgrammeCard";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MembersArea } from "@/components/home/MembersArea";
import { CtaBanner } from "@/components/home/CtaBanner";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Online coaching",
  description:
    "Online personal training with Dean Foster — a personalised meal plan, a training plan for your gym, regular check-ins and real adjustments. £120 a month, no contract.",
};

const comparison = {
  us: [
    "Built from your body, your gym and your week",
    "Calorie and protein targets set for you",
    "Adjusted regularly based on what you actually did",
    "A coach you can message when something comes up",
    "Changes when your life changes",
  ],
  them: [
    "The same PDF sent to a thousand people",
    "Generic targets, or none at all",
    "Never changes, whatever happens",
    "Nobody to ask",
    "Abandoned by week three",
  ],
};

export default async function CoachingPage() {
  const [programmes, price] = await Promise.all([getProgrammes(), getCoachingPrice()]);

  return (
    <>
      <PageHeader
        eyebrow="Online coaching"
        title="Coaching, not a downloadable plan"
        description={`${formatPrice(price.amount)} a month for a plan built around you and a coach who keeps changing it as you go. Wherever you train, whatever your week looks like.`}
      >
        <Button href="/join" size="lg">Request a free consultation</Button>
      </PageHeader>

      <WhatsIncluded />
      <HowItWorks />

      <Section tone="raised">
        <SectionHeader
          eyebrow="The difference"
          title="Why this is not a £20 plan"
          description="Both cost money. Only one of them knows who you are."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal className="h-full">
            <div className="h-full rounded-[var(--radius-sheet)] border border-accent/40 bg-accent/[0.05] p-7">
              <h3 className="text-lg">Coaching with Dean</h3>
              <ul className="mt-5 space-y-3.5">
                {comparison.us.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={70} className="h-full">
            <div className="h-full rounded-[var(--radius-sheet)] border border-line bg-ink p-7">
              <h3 className="text-lg text-muted">An off-the-shelf plan</h3>
              <ul className="mt-5 space-y-3.5">
                {comparison.them.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="What we build around"
          title="Whatever the goal is, the coaching is the same"
          description="Pick the one that sounds like you — or book a consult and we will work it out together."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((programme, i) => (
            <Reveal key={programme.id} delay={(i % 3) * 70} className="h-full">
              <ProgrammeCard programme={programme} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Section>

      <MembersArea />


      <CtaBanner />
    </>
  );
}
