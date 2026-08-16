import { getTestimonials } from "@/lib/services/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialCard } from "@/components/cards/TestimonialCard";

export async function TestimonialWall() {
  const testimonials = await getTestimonials();

  return (
    <Section tone="raised">
      <SectionHeader
        eyebrow="Reviews"
        title="Real feedback from real clients"
        description="Collected after clients finish a block — not on their first-week high."
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, i) => (
          <Reveal key={testimonial.id} delay={(i % 3) * 70} className="h-full">
            <TestimonialCard testimonial={testimonial} className="h-full" />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
