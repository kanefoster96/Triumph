import { ArrowRight } from "lucide-react";
import { getGoals } from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { GoalCard } from "@/components/cards/GoalCard";

/**
 * Snap-scrolling rail on mobile, grid on desktop — the carousel pattern the
 * app will use, without the JS a carousel usually needs.
 */
export async function GoalRail() {
  const goals = await getGoals();

  return (
    <section id="goals" className="py-24 sm:py-36">
      <Container>
        <SectionHeader
          eyebrow="What we build around"
          title="Whatever your goal."
          description="Fat loss, strength, or getting back into it. Same coaching, same price."
        />
      </Container>

      {/* Rail on small screens: bleeds to the edge like a native carousel. */}
      <div className="rail flex px-5 pb-2 sm:px-8 lg:hidden">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} className="w-[82vw] max-w-sm" />
        ))}
      </div>

      <Container className="hidden lg:block">
        <div className="grid gap-5 lg:grid-cols-3">
          {goals.map((goal, i) => (
            <Reveal key={goal.id} delay={(i % 3) * 70} className="h-full">
              <GoalCard goal={goal} className="h-full" />
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
