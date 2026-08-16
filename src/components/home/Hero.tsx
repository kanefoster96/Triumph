import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { headlineStats, site } from "@/lib/data/site";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const proofPoints = ["No lock-in contracts", "Studio & online", "Plans built from an assessment"];

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient light — cheap, no image payload. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[46rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
      />
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-30" />

      <Container className="relative pt-12 pb-16 sm:pt-20 sm:pb-24">
        <Reveal>
          <Chip tone="accent" size="md">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Taking 3 new clients for September
          </Chip>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.95] text-balance uppercase sm:text-7xl lg:text-8xl">
            Get strong.
            <br />
            <span className="text-accent">Stay strong.</span>
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Personal training in {site.location} and online. Structured programmes, weekly check-ins, and a
            coach who watches every rep — built for people who are done starting over.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/contact" size="lg" className="sm:w-auto">
              Book a free consult
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/programmes" size="lg" variant="secondary">
              <Play className="h-4 w-4" />
              See the programmes
            </Button>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
            {proofPoints.map((point) => (
              <li key={point} className="inline-flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={300}>
          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4">
            {headlineStats.map((stat) => (
              <div key={stat.label} className="bg-surface px-5 py-6">
                <dt className="text-xs tracking-[0.14em] text-faint uppercase">{stat.label}</dt>
                <dd className="mt-2 font-display text-4xl leading-none font-extrabold">
                  {stat.value}
                  {stat.suffix ? <span className="text-accent">{stat.suffix}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </div>
  );
}
