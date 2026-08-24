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

      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {process.map((step, i) => (
          <Reveal as="li" key={step.title} delay={i * 70}>
            <div className="h-full rounded-[var(--radius-sheet)] bg-surface p-6">
              <span className="text-sm font-bold text-accent">0{i + 1}</span>
              <h3 className="mt-3 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
