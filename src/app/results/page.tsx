import type { Metadata } from "next";
import { getTestimonials, getTransformations } from "@/lib/services/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TransformationCard } from "@/components/cards/TransformationCard";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { CtaBanner } from "@/components/home/CtaBanner";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Client results from Triumph Training — strength gains, fat loss and returns from injury, with the numbers and the timeframes.",
};

const summary = [
  { label: "Avg. strength gain per block", value: "+21%" },
  { label: "Avg. fat loss, 16 weeks", value: "9.4kg" },
  { label: "Clients past 12 months", value: "62" },
  { label: "Session attendance", value: "88%" },
];

export default async function ResultsPage() {
  const [transformations, testimonials] = await Promise.all([getTransformations(), getTestimonials()]);

  return (
    <>
      <PageHeader
        eyebrow="Results"
        title="The receipts"
        description="Every result below is a real client on a named programme, with the timeframe attached. Numbers are self-reported at testing weeks and rounded to something honest."
      />

      <Container className="pb-8">
        <Reveal>
          <dl className="grid grid-cols-2 gap-8 rounded-[var(--radius-sheet)] border border-line bg-surface p-8 text-center lg:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label}>
                <dd className="font-display text-3xl font-bold tracking-tight text-accent sm:text-4xl">{item.value}</dd>
                <dt className="mt-2 text-sm text-muted">{item.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>

      <Section>
        <SectionHeader
          eyebrow="Transformations"
          title="Twelve to twenty-four weeks of work"
          description="No overnight stories. These took the time they took."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {transformations.map((transformation, i) => (
            <Reveal key={transformation.id} delay={(i % 3) * 70} className="h-full">
              <TransformationCard transformation={transformation} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="raised">
        <SectionHeader eyebrow="In their words" title="What clients say afterwards" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <Reveal key={testimonial.id} delay={(i % 3) * 70} className="h-full">
              <TestimonialCard testimonial={testimonial} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
