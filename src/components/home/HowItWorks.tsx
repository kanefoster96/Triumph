import { ClipboardList, LineChart, MessagesSquare, Target } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconTile } from "@/components/ui/IconTile";

const steps = [
  {
    icon: MessagesSquare,
    title: "Free consult",
    body: "Twenty minutes, in person or on a call. Your history, your goal, and an honest answer about what it will take.",
  },
  {
    icon: ClipboardList,
    title: "Assessment",
    body: "Movement screen and baseline numbers. This is what your plan is built from — no templates, no guessing.",
  },
  {
    icon: Target,
    title: "Train the plan",
    body: "Coached sessions plus a written programme for the days you train alone. Every session logged.",
  },
  {
    icon: LineChart,
    title: "Review weekly",
    body: "We look at what actually happened and adjust. Small corrections every week beat a rewrite every quarter.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="raised">
      <SectionHeader
        eyebrow="How it works"
        title="Four steps, no mystery"
        description="The same process for every client, whether you train in the studio or on the other side of the world."
      />

      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <Reveal as="li" key={step.title} delay={i * 70}>
            <div className="h-full rounded-[var(--radius-sheet)] border border-line bg-ink p-6">
              <IconTile icon={step.icon} />
              <h3 className="mt-5 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
