import { Check, Sparkles } from "lucide-react";
import { headlineStats } from "@/lib/data/site";
import { getCoachingPrice } from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { formatPrice } from "@/lib/utils";

const proofPoints = ["Built for you, not downloaded", "Adjusted every week", "No contract"];

export async function Hero() {
  const price = await getCoachingPrice();

  return (
    <Container className="pt-14 pb-20 text-center sm:pt-24 sm:pb-28">
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          <Sparkles className="h-4 w-4" />
          Online coaching · {formatPrice(price.amount)}/month
        </span>
      </Reveal>

      <Reveal delay={60}>
        <h1 className="mx-auto mt-8 max-w-3xl text-4xl leading-[1.05] text-balance sm:text-6xl">
          A plan built around
          <br />
          <span className="text-accent">your life, not a template.</span>
        </h1>
      </Reveal>

      <Reveal delay={120}>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Online coaching with Dean Foster. Your meal plan, your training plan, regular check-ins and real
          adjustments as you go — never a copy-and-paste PDF.
        </p>
      </Reveal>

      <Reveal delay={180}>
        <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button href="/join" size="lg">
            Apply to train
          </Button>
          <Button href="/coaching" size="lg" variant="secondary">
            What&rsquo;s included
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
        <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 sm:mt-20 lg:grid-cols-4">
          {headlineStats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                {stat.value}
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
