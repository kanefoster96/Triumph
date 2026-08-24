import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Target, UserRound } from "lucide-react";
import {
  getCoachingPrice,
  getGoal,
  getGoalSlugs,
  getTransformationsByGoal,
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
  const slugs = await getGoalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/coaching/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const goal = await getGoal(slug);
  if (!goal) return { title: "Not found" };
  return { title: goal.name, description: goal.summary };
}

export default async function GoalPage({ params }: PageProps<"/coaching/[slug]">) {
  const { slug } = await params;
  const [goal, price] = await Promise.all([getGoal(slug), getCoachingPrice()]);
  if (!goal) notFound();

  const results = await getTransformationsByGoal(slug);

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
            <IconTile visual={goal.visual} size="lg" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Chip tone="accent">Online coaching</Chip>
            {goal.popular ? <Chip tone="amber">Most common</Chip> : null}
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] text-balance sm:text-5xl">
            {goal.name}
          </h1>
          <p className="mt-4 text-lg font-medium text-accent">{goal.tagline}</p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">{goal.summary}</p>

          <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button href="/join" size="lg">Request a free consultation</Button>
            <Button href="/pricing" size="lg" variant="secondary">
              {formatPrice(price.amount)}/month — what&rsquo;s included
            </Button>
          </div>
        </Reveal>
      </Container>

      <Section tone="raised">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
          <Reveal>
            <h2 className="text-xl sm:text-2xl">Is this you?</h2>
            <ul className="mt-5 space-y-3">
              {goal.whoFor.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-raised p-4 text-sm leading-relaxed text-muted"
                >
                  <UserRound className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={70}>
            <h2 className="text-xl sm:text-2xl">How I help</h2>
            <ul className="mt-5 space-y-3">
              {goal.howIHelp.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-raised p-4 text-sm leading-relaxed text-muted"
                >
                  <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-faint">
              Yours will differ — all of it is written around your week, not a fixed template.
            </p>
          </Reveal>

          <Reveal delay={140}>
            <h2 className="text-xl sm:text-2xl">What you&rsquo;ll achieve</h2>
            <ul className="mt-5 space-y-3">
              {goal.outcomes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-raised p-4 text-sm leading-relaxed text-muted"
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
            title="People who started here"
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
