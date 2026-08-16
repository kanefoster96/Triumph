import { ArrowRight } from "lucide-react";
import { getProgrammes } from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProgrammeCard } from "@/components/cards/ProgrammeCard";

/**
 * Snap-scrolling rail on mobile, grid on desktop — the carousel pattern the
 * app will use, without the JS a carousel usually needs.
 */
export async function ProgrammeRail() {
  const programmes = await getProgrammes();

  return (
    <section id="goals" className="py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="What we build around"
          title="One coaching package, built for your goal"
          description="These are not separate products with separate prices. They are the goals I most often build plans around — all delivered through the same monthly coaching."
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
            <Reveal key={programme.id} delay={(i % 3) * 70} className="h-full">
              <ProgrammeCard programme={programme} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Container>

      <Container className="mt-12 text-center">
        <Button href="/coaching" variant="secondary">
          How coaching works
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Container>
    </section>
  );
}
