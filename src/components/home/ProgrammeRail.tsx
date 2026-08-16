import { ArrowRight } from "lucide-react";
import { getProgrammes } from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProgrammeCard } from "@/components/cards/ProgrammeCard";

/**
 * Snap-scrolling rail on mobile, grid on desktop — the carousel pattern the
 * app will use, without the JS a carousel usually needs.
 */
export async function ProgrammeRail() {
  const programmes = await getProgrammes();

  return (
    <section id="programmes" className="py-16 sm:py-24">
      <Container>
        <SectionHeader
          eyebrow="Programmes"
          title="Pick the block that matches the goal"
          description="Every programme is a complete plan with a start, a finish and a test at the end. Not a rolling membership that never goes anywhere."
          action={
            <Button href="/programmes" variant="outline" size="sm">
              All programmes
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      </Container>

      {/* Rail on small screens: bleeds to the edge like a native carousel. */}
      <div className="rail flex px-5 pb-2 sm:px-8 lg:hidden">
        {programmes.map((programme) => (
          <ProgrammeCard key={programme.id} programme={programme} className="w-[82vw] max-w-sm" />
        ))}
      </div>

      <Container className="hidden lg:block">
        <div className="grid gap-5 lg:grid-cols-3">
          {programmes.map((programme, i) => (
            <Reveal key={programme.id} delay={i * 70} className="h-full">
              <ProgrammeCard programme={programme} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
