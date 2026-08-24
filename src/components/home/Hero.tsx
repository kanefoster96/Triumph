import { Check, Sparkles } from "lucide-react";
import { headlineStats } from "@/lib/data/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

const proofPoints = [
  "Weekly check-ins with Dean",
  "Track it all in your app",
  "No contract, cancel any time",
];

export function Hero() {
  return (
    <Container className="pt-14 pb-20 text-center sm:pt-24 sm:pb-28">
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          <Sparkles className="h-4 w-4" />
          Online training made easy
        </span>
      </Reveal>

      <Reveal delay={60}>
        <h1 className="mx-auto mt-8 max-w-3xl text-4xl leading-[1.05] text-balance sm:text-6xl">
          Meals &amp; workouts
          <br />
          <span className="text-accent">you can track.</span>
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
        <ul className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3">
          {proofPoints.map((point) => (
            <li key={point} className="inline-flex items-center gap-2 text-sm text-muted">
              <Check className="h-4 w-4 text-accent" />
              {point}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={300}>
        <dl className="mx-auto mt-16 grid max-w-lg grid-cols-2 gap-8 sm:mt-20">
          {headlineStats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                <CountUp value={stat.value} />
                {stat.suffix ? <span className="text-accent">{stat.suffix}</span> : null}
              </dd>
              <dt className="mt-2 text-sm text-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </Container>
  );
}
