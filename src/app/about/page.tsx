import type { Metadata } from "next";
import { BadgeCheck, Quote } from "lucide-react";
import { getCoach, getPosts } from "@/lib/services/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { PostCard } from "@/components/cards/PostCard";
import { CtaBanner } from "@/components/home/CtaBanner";
import { site } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet the coach behind Triumph — qualifications, coaching philosophy, and how the studio in Manchester runs.",
};

const principles = [
  {
    title: "Boring beats clever",
    body: "The programme that works is the one you can repeat for twelve weeks. Novelty is for people who are not progressing.",
  },
  {
    title: "Measure something",
    body: "Load, reps, bodyweight, sleep, attendance. If nothing is written down, we are both guessing.",
  },
  {
    title: "Train the person in front of me",
    body: "Your job, your knees and your schedule are inputs to the plan, not excuses to work around it.",
  },
  {
    title: "Honesty over upsells",
    body: "If you need a physio, a dietitian, or just eight hours of sleep, I will say so instead of selling you more sessions.",
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

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <MediaFrame
              visual="strength"
              src={coach.photo}
              alt={coach.name}
              caption={coach.name.split(" ")[0]}
              className="aspect-[4/5] w-full"
            />
            <div className="mt-5 grid gap-2">
              {coach.credentials.map((credential) => (
                <p key={credential} className="flex items-start gap-2 text-sm text-muted">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {credential}
                </p>
              ))}
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Quote className="h-8 w-8 text-accent" />
              <p className="mt-4 font-display text-2xl leading-tight text-balance sm:text-3xl">
                {coach.headline}
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
                {coach.bio.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <h2 className="mt-10 text-xl">What I specialise in</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {coach.specialties.map((specialty) => (
                  <Chip key={specialty} tone="accent" size="md">
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
          eyebrow="Philosophy"
          title="Four things I will not budge on"
          description="If these do not sound like you, we will both know early — and that is fine."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((principle, i) => (
            <Reveal key={principle.title} delay={i * 70} className="h-full">
              <div className="h-full rounded-[var(--radius-card)] border border-line bg-ink p-6">
                <h3 className="text-lg">{principle.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{principle.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="The studio" title={site.studio} description="Private, well equipped, and never more than six people in it at once. Full racks, bars, dumbbells to 50kg, sled, bikes and a rower. Free parking on Bengal Street after 18:00." />
        <div className="grid gap-4 md:grid-cols-2">
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
