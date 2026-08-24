import { ArrowRight, Check } from "lucide-react";
import { getCoach } from "@/lib/services/content";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Avatar } from "@/components/members/Avatar";

/**
 * Dean, straight after the hero.
 *
 * Every section below this one calls him by name, so he gets introduced
 * before the page starts assuming you know who he is. Deliberately short —
 * who he is, why he is worth listening to, and a way in. The long version is
 * `/about`.
 *
 * The avatar carries `coach.photo` when there is one and falls back to his
 * initials, so this reads as finished without a photo and improves the moment
 * one exists.
 */
export async function CoachIntro() {
  const coach = await getCoach();
  const firstName = coach.name.split(" ")[0];

  return (
    <Section id="coach" className="pt-4 sm:pt-6">
      <Reveal>
        <div className="mx-auto max-w-2xl rounded-[var(--radius-sheet)] bg-surface p-7 sm:p-9">
          <div className="flex items-center gap-4 sm:gap-5">
            <Avatar name={coach.name} src={coach.photo} size="xl" ring />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-accent">Meet your online coach</p>
              <h2 className="mt-1 text-2xl sm:text-3xl">{coach.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {coach.role} · Coaching since {coach.since}
              </p>
            </div>
          </div>

          <p className="mt-6 text-base leading-relaxed text-muted">{coach.intro}</p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {coach.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2.5 text-sm text-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {highlight}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/join" size="lg">
              Work with {firstName}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/about" size="lg" variant="secondary">
              More about {firstName}
            </Button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            Coaching is online, anywhere in the UK · Free consult first · Hit every target in month
            one and you get 50% back
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
