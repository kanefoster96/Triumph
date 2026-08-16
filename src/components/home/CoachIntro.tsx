import { ArrowRight, BadgeCheck } from "lucide-react";
import { getCoach } from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";

export async function CoachIntro() {
  const coach = await getCoach();

  return (
    <Section id="coach">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <MediaFrame
            visual="strength"
            src={coach.photo}
            alt={coach.name}
            caption={coach.name.split(" ")[0]}
            className="aspect-[4/5] w-full max-w-md lg:aspect-[4/5]"
          >
            <div className="absolute right-4 bottom-4 left-4 rounded-2xl border border-line bg-ink/80 p-4 backdrop-blur">
              <p className="text-sm font-semibold">{coach.name}</p>
              <p className="text-xs text-faint">
                {coach.role} · Coaching since {coach.since}
              </p>
            </div>
          </MediaFrame>
        </Reveal>

        <div>
          <Reveal>
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              Your coach
            </p>
            <h2 className="text-3xl text-balance sm:text-4xl">{coach.headline}</h2>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted">
              {coach.bio.slice(0, 2).map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {coach.credentials.map((credential) => (
                <li key={credential} className="flex items-start gap-2 text-sm text-muted">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {credential}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-6 flex flex-wrap gap-2">
              {coach.specialties.map((specialty) => (
                <Chip key={specialty}>{specialty}</Chip>
              ))}
            </div>
          </Reveal>

          <Reveal delay={260}>
            <Button href="/about" variant="outline" className="mt-8">
              More about {coach.name.split(" ")[0]}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
