import { ArrowRight, Check } from "lucide-react";
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
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <MediaFrame
            visual="strength"
            src={coach.photo}
            alt={coach.name}
            caption="Coach photo goes here"
            className="aspect-[4/5] w-full max-w-md"
          />
        </Reveal>

        <div>
          <Reveal>
            <p className="mb-4 text-xs font-semibold tracking-[0.16em] text-accent uppercase">Your coach</p>
            <h2 className="text-3xl text-balance sm:text-4xl">{coach.headline}</h2>
          </Reveal>

          <Reveal delay={70}>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
              {coach.bio.slice(0, 2).map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {coach.credentials.map((credential) => (
                <li key={credential} className="flex items-start gap-2.5 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
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
            <Button href="/about" variant="secondary" className="mt-8">
              More about {coach.name.split(" ")[0]}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
