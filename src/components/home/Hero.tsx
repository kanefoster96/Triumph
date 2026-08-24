import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { HeroProof, LiveMembers } from "./HeroProof";

const proofPoints = [
  "Weekly check-ins with Dean",
  "Track it all in your app",
  "No contract, cancel any time",
];

export function Hero() {
  return (
    <Container className="pt-14 pb-20 text-center sm:pt-24 sm:pb-28">
      <Reveal>
        {/* The badge says something true and different every day rather than a
            slogan that is the same on every visit. It renders nothing when
            there is nobody in, and the hero simply starts at the headline. */}
        <LiveMembers />
      </Reveal>

      <Reveal delay={60}>
        <h1 className="mx-auto mt-8 max-w-3xl text-4xl leading-[1.05] text-balance sm:text-6xl">
          {/*
           * Two tones of white, not white and cyan. Cyan on the headline
           * spends the accent on something nobody can press — it belongs to
           * the button, the section labels and the links, which is what makes
           * it mean "this one" when it does appear.
           */}
          Meals &amp; workouts
          <br />
          <span className="text-muted">you can track.</span>
        </h1>
      </Reveal>

      <Reveal delay={120}>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          A plan built by a personal trainer around your goals, with meals and workouts that are
          simple to log. If you want someone keeping you accountable and results that last, book a
          free consult.
        </p>
      </Reveal>

      <Reveal delay={180}>
        <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button href="/join" size="lg">
            Let&rsquo;s get started
          </Button>
          <Button href="/contact" size="lg" variant="secondary">
            Ask a question
          </Button>
        </div>
      </Reveal>

      <Reveal delay={240}>
        <HeroProof />
      </Reveal>

      <Reveal delay={300}>
        <ul className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3">
          {proofPoints.map((point) => (
            <li key={point} className="inline-flex items-center gap-2 text-sm text-muted">
              <Check className="h-4 w-4 text-accent" />
              {point}
            </li>
          ))}
        </ul>
      </Reveal>

    </Container>
  );
}
