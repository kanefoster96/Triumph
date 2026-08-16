import type { Metadata } from "next";
import { getProgrammes } from "@/lib/services/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBanner } from "@/components/home/CtaBanner";
import { ProgrammeFilter } from "@/components/programmes/ProgrammeFilter";

export const metadata: Metadata = {
  title: "Programmes",
  description:
    "Structured training blocks for strength, fat loss, hybrid performance and returning from injury — in the studio or online.",
};

export default async function ProgrammesPage() {
  const programmes = await getProgrammes();

  return (
    <>
      <PageHeader
        eyebrow="Programmes"
        title="Blocks with a start, a finish and a test"
        description="Each programme is a complete plan rather than an open-ended membership. Pick the one that matches your goal — or book a consult and I will tell you which fits."
      />

      <div className="py-10 sm:py-16">
        <Container>
          <ProgrammeFilter programmes={programmes} />
        </Container>
      </div>

      <Container className="pb-8">
        <Reveal className="rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-xl">Not sure which one?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Most people land on Foundation or Lean &amp; Strong. If you already train three times a week and
            your lifts have stopped moving, it is the Strength Block. If something hurts, start with Rebuild —
            we can always switch once you are loading pain-free.
          </p>
        </Reveal>
      </Container>

      <CtaBanner />
    </>
  );
}
