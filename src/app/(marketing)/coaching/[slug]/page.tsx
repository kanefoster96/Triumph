import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Target, UserRound } from "lucide-react";
import {
  getCoachingPrice,
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

export async function generateMetadata({ params }: PageProps<"/coaching/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const programme = await getProgramme(slug);
  if (!programme) return { title: "Not found" };
  return { title: programme.name, description: programme.summary };
}

export default async function ProgrammePage({ params }: PageProps<"/coaching/[slug]">) {
  const { slug } = await params;
  const [programme, price] = await Promise.all([getProgramme(slug), getCoachingPrice()]);
  if (!programme) notFound();

  const results = await getTransformationsByProgramme(slug);

  return (
    <>
      <Container className="pt-8 pb-12 sm:pt-10 sm:pb-16">
        <Link
          href="/coaching"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          All of it
        </Link>

        <Reveal className="mt-10 text-center">
          <div className="flex justify-center">
            <IconTile visual={programme.visual} size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Chip tone="accent">Online coaching</Chip>
            <Chip>{programme.level}</Chip>
            {programme.popular ? <Chip tone="amber">Most common</Chip> : null}
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] text-balance sm:text-5xl">
            {programme.name}
          </h1>
          <p className="mt-4 text-lg font-medium text-accent">{programme.tagline}</p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">{programme.summary}</p>

          <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button href="/contact" size="lg">
              Book a free consult
            </Button>
            <Button href="/pricing" size="lg" variant="secondary">
              {formatPrice(price.amount)}/month — what&rsquo;s included
            </Button>
          </div>
        </Reveal>
      </Container>

      <Section tone="raised">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
          <Reveal>
            <h2 className="text-xl sm:text-2xl">Who it&rsquo;s for</h2>
            <ul className="mt-5 space-y-3">
              {programme.whoFor.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-ink p-4 text-sm leading-relaxed text-muted"
                >
                  <UserRound className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={70}>
            <h2 className="text-xl sm:text-2xl">A typical week</h2>
            <ul className="mt-5 space-y-3">
              {programme.typicalWeek.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-ink p-4 text-sm leading-relaxed text-muted"
                >
                  <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-faint">
              Yours will differ — this is written around your days, not a fixed template.
            </p>
          </Reveal>

          <Reveal delay={140}>
            <h2 className="text-xl sm:text-2xl">What you get out of it</h2>
            <ul className="mt-5 space-y-3">
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
          </Reveal>
        </div>
      </Section>

      {results.length > 0 ? (
        <Section>
          <SectionHeader
            eyebrow="Results"
            title={`Clients working on ${programme.name.toLowerCase()}`}
            description="Same coaching, different starting points."
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
