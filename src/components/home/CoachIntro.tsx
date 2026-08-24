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
 * before the page starts assuming you know who he is. The long version is
 * `/about`.
 *
 * Three parts with air between them rather than one box holding all of it:
 * the face and the name on the page itself, a single container for what he
 * has to say, and the way in underneath it.
 */
export async function CoachIntro() {
  const coach = await getCoach();
  const firstName = coach.name.split(" ")[0];

  return (
    <Section id="coach" className="pt-4 sm:pt-6">
      <Reveal className="text-center">
        <Avatar name={coach.name} src={coach.photo} size="2xl" ring className="mx-auto" />
        <p className="mt-6 text-xs font-semibold text-accent">Meet your online coach</p>
        <h2 className="mt-2 text-3xl sm:text-4xl">{coach.name}</h2>
        <p className="mt-2 text-sm text-muted">
          {coach.role} · Coaching since {coach.since}
        </p>
      </Reveal>

      <Reveal delay={70}>
        <div className="mx-auto mt-10 max-w-2xl rounded-[var(--radius-sheet)] bg-surface p-7 sm:mt-12 sm:p-9">
          <p className="text-base leading-relaxed text-muted">{coach.intro}</p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {coach.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2.5 text-sm text-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={140}>
        {/* Equal widths stacked, so the pair reads as one block rather than two
            ragged pills; auto widths once they sit side by side. */}
        <div className="mx-auto mt-10 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button href="/join" size="lg">
            Work with {firstName}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/about" size="lg" variant="secondary">
            More about {firstName}
          </Button>
        </div>
        <p className="mt-5 text-center text-xs text-faint">
          Coaching is online, anywhere in the UK · Free consult first · No contract
        </p>
      </Reveal>
    </Section>
  );
}
