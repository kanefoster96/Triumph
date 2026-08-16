import { ArrowRight } from "lucide-react";
import { getTransformations } from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TransformationCard } from "@/components/cards/TransformationCard";

export async function ResultsRail() {
  const transformations = await getTransformations(4);

  return (
    <section className="border-y border-line bg-surface/40 py-20 sm:py-28">
      <Container>
        <SectionHeader
          eyebrow="Results"
          title="Real numbers from real clients"
          description="No dramatic lighting, no before-and-after taken an hour apart. Just what changed, over how long."
        />
      </Container>

      <div className="rail flex px-5 pb-2 sm:px-8 lg:hidden">
        {transformations.map((transformation) => (
          <TransformationCard
            key={transformation.id}
            transformation={transformation}
            className="w-[84vw] max-w-sm"
          />
        ))}
      </div>

      <Container className="hidden lg:block">
        <div className="grid gap-5 lg:grid-cols-2">
          {transformations.map((transformation, i) => (
            <Reveal key={transformation.id} delay={i * 70} className="h-full">
              <TransformationCard transformation={transformation} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Container>

      <Container className="mt-12 text-center">
        <Button href="/results" variant="secondary">
          All client results
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Container>
    </section>
  );
}
