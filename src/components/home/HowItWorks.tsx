import { getProcess } from "@/lib/services/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export async function HowItWorks() {
  const process = await getProcess();

  return (
    <Section id="how-it-works">
      <SectionHeader
        eyebrow="How it works"
        title="Four steps."
        description="Same system, wherever you are in the UK."
      />

      {/* No box per step: the number is the marker, and the space between them
          does the separating a container was doing. */}
      <ol className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-10">
        {process.map((step, i) => (
          <Reveal as="li" key={step.title} delay={i * 70}>
            <span className="font-display text-2xl font-bold text-accent tabular-nums">
              0{i + 1}
            </span>
            <h3 className="mt-3 text-lg">{step.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.body}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
