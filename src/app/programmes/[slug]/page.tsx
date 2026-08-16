import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Target } from "lucide-react";
import {
  getProgramme,
  getProgrammeSlugs,
  getTransformationsByProgramme,
} from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconTile } from "@/components/ui/IconTile";
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
    { label: "Total sessions", value: `${totalSessions}` },
    { label: "From", value: `${formatPrice(programme.priceFromPerWeek)}/week` },
  ];

  return (
    <>
      <Container className="pt-8 pb-12 sm:pt-10 sm:pb-16">
        <Link
          href="/programmes"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          All programmes
        </Link>

        <Reveal className="mt-10 text-center">
          <div className="flex justify-center">
            <IconTile visual={programme.visual} size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Chip tone="accent">{programme.format}</Chip>
            <Chip>{programme.level}</Chip>
            {programme.popular ? <Chip tone="amber">Most popular</Chip> : null}
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] text-balance sm:text-5xl">
            {programme.name}
          </h1>
          <p className="mt-4 text-lg font-medium text-accent">{programme.tagline}</p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">{programme.summary}</p>

          <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button href={`/contact?programme=${programme.slug}`} size="lg">
              Enquire about {programme.name}
            </Button>
            <Button href="/pricing" size="lg" variant="secondary">
              See pricing
            </Button>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 rounded-[var(--radius-sheet)] border border-line bg-surface p-7 sm:grid-cols-3 lg:grid-cols-6">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[11px] tracking-[0.12em] text-faint uppercase">{fact.label}</dt>
                <dd className="mt-1.5 text-base font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>

      <Section tone="raised">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl">What is included</h2>
            <ul className="mt-6 space-y-3">
              {programme.includes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-ink p-4 text-sm leading-relaxed text-muted"
                >
                  <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={70}>
            <h2 className="text-2xl sm:text-3xl">What you walk away with</h2>
            <ul className="mt-6 space-y-3">
              {programme.outcomes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-ink p-4 text-sm leading-relaxed text-muted"
                >
                  <Target className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  {item}
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
        <Section>
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
