import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getCoach, getPosts } from "@/lib/services/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { PostCard } from "@/components/cards/PostCard";
import { CtaBanner } from "@/components/home/CtaBanner";

export const metadata: Metadata = {
  title: "About Dean",
  description:
    "Dean Foster started training to be fit enough to enjoy family life. Now he coaches others online, with in-person sessions in Newcastle upon Tyne.",
};

const principles = [
  {
    title: "Nothing is copy-and-pasted",
    body: "Every plan is written from your starting point. If it could be sent to someone else unchanged, it is not coaching.",
  },
  {
    title: "It has to fit your real week",
    body: "Your job, your kids and your sleep are inputs to the plan, not excuses to work around it. A perfect plan you cannot follow is worth nothing.",
  },
  {
    title: "Measure something",
    body: "Weight, load, reps, steps, how the week felt. If nothing is written down, we are both guessing at the next adjustment.",
  },
  {
    title: "Honesty over upsells",
    body: "If you need a physio, a doctor, or just eight hours of sleep, I will say so rather than sell you more coaching.",
  },
];

export default async function AboutPage() {
  const [coach, posts] = await Promise.all([getCoach(), getPosts(2)]);

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={coach.name}
        description={`${coach.role} · ${coach.location} · Coaching since ${coach.since}`}
      />

      <Section className="pt-0 sm:pt-0">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <MediaFrame
              visual="strength"
              src={coach.photo}
              alt={coach.name}
              caption="Photo of Dean goes here"
              className="aspect-[4/5] w-full"
            />
            <ul className="mt-6 space-y-2.5">
              {coach.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2.5 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {highlight}
                </li>
              ))}
            </ul>

            {coach.qualifications.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-sm font-semibold">Qualifications</h2>
                <ul className="mt-3 space-y-2.5">
                  {coach.qualifications.map((qualification) => (
                    <li key={qualification} className="flex items-start gap-2.5 text-sm text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {qualification}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>

          <div>
            <Reveal>
              <p className="font-display text-2xl leading-snug font-bold tracking-tight text-balance sm:text-3xl">
                {coach.headline}
              </p>
            </Reveal>

            <Reveal delay={70}>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
                {coach.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <h2 className="mt-10 text-xl">What I most often help with</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {coach.specialties.map((specialty) => (
                  <Chip key={specialty} size="md">
                    {specialty}
                  </Chip>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section tone="raised">
        <SectionHeader
          eyebrow="How I coach"
          title="Four things I will not budge on"
          description="If these do not sound like you, we will both know early — and that is fine."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {principles.map((principle, i) => (
            <Reveal key={principle.title} delay={(i % 2) * 70} className="h-full">
              <div className="h-full rounded-[var(--radius-sheet)] border border-line bg-ink p-6">
                <h3 className="text-lg">{principle.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{principle.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Coaching notes"
          title="How I think about training"
          description="The opinions that shape every plan I write."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 70} className="h-full">
              <PostCard post={post} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
