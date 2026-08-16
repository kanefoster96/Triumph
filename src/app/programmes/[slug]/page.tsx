import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Target } from "lucide-react";
import {
  getProgramme,
  getProgrammeSlugs,
  getTransformationsByProgramme,
} from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { TransformationCard } from "@/components/cards/TransformationCard";
import { CtaBanner } from "@/components/home/CtaBanner";
import { formatPrice } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = await getProgrammeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/programmes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const programme = await getProgramme(slug);
  if (!programme) return { title: "Programme not found" };
  return {
    title: programme.name,
    description: programme.summary,
  };
}

export default async function ProgrammePage({ params }: PageProps<"/programmes/[slug]">) {
  const { slug } = await params;
  const programme = await getProgramme(slug);
  if (!programme) notFound();

  const results = await getTransformationsByProgramme(slug);
  const totalSessions = programme.durationWeeks * programme.sessionsPerWeek;

  const facts = [
    { label: "Format", value: programme.format },
    { label: "Level", value: programme.level },
    { label: "Length", value: `${programme.durationWeeks} weeks` },
    { label: "Sessions", value: `${programme.sessionsPerWeek} per week` },
  ];

  return (
    <>
      <div className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-80 w-[32rem] rounded-full bg-accent/10 blur-[110px]"
        />
        <Container className="relative py-8 sm:py-14">
          <Link
            href="/programmes"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            All programmes
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14">
            <div>
              <div className="flex flex-wrap gap-2">
                <Chip tone="accent">{programme.format}</Chip>
                <Chip>{programme.level}</Chip>
                {programme.popular ? <Chip tone="heat">Most popular</Chip> : null}
              </div>

              <h1 className="mt-5 font-display text-4xl leading-[0.95] text-balance uppercase sm:text-6xl">
                {programme.name}
              </h1>
              <p className="mt-3 text-lg font-medium text-accent">{programme.tagline}</p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">{programme.summary}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href={`/contact?programme=${programme.slug}`} size="lg">
                  Enquire about {programme.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/pricing" size="lg" variant="secondary">
                  See pricing
                </Button>
              </div>
            </div>

            <MediaFrame
              visual={programme.visual}
              caption={programme.name}
              className="aspect-[4/3] w-full"
            >
              <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
                <div className="bg-ink/85 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] tracking-wide text-faint uppercase">From</p>
                  <p className="mt-0.5 font-display text-2xl font-extrabold">
                    {formatPrice(programme.priceFromPerWeek)}
                    <span className="text-sm font-normal text-faint">/week</span>
                  </p>
                </div>
                <div className="bg-ink/85 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] tracking-wide text-faint uppercase">Total sessions</p>
                  <p className="mt-0.5 font-display text-2xl font-extrabold">{totalSessions}</p>
                </div>
              </div>
            </MediaFrame>
          </div>
        </Container>
      </div>

      <Container className="py-10">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-surface px-5 py-4">
              <dt className="text-[11px] tracking-[0.14em] text-faint uppercase">{fact.label}</dt>
              <dd className="mt-1 text-base font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl">What is included</h2>
            <ul className="mt-6 space-y-3">
              {programme.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl bg-surface p-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-sm leading-relaxed text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="text-2xl sm:text-3xl">What you walk away with</h2>
            <ul className="mt-6 space-y-3">
              {programme.outcomes.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl bg-surface p-4">
                  <Target className="mt-0.5 h-5 w-5 shrink-0 text-heat" />
                  <span className="text-sm leading-relaxed text-muted">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-2">
              {programme.focus.map((focus) => (
                <Chip key={focus} tone="accent">
                  {focus}
                </Chip>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {results.length > 0 ? (
        <Section tone="raised">
          <SectionHeader
            eyebrow="Results"
            title={`People who ran ${programme.name}`}
            description="Same programme, different starting points."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {results.map((transformation, i) => (
              <Reveal key={transformation.id} delay={i * 70} className="h-full">
                <TransformationCard transformation={transformation} className="h-full" />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      <CtaBanner />
    </>
  );
}
