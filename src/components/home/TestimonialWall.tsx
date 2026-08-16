import { getTestimonials } from "@/lib/services/content";
import { Container, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialCard } from "@/components/cards/TestimonialCard";

export async function TestimonialWall() {
  const testimonials = await getTestimonials();

  return (
    <section className="bg-surface/60 py-16 sm:py-24">
      <Container>
        <SectionHeader
          eyebrow="Reviews"
          title="4.9 out of 5, across 96 reviews"
          description="Collected after clients finish a block — not on their first-week high."
          align="center"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <Reveal key={testimonial.id} delay={(i % 3) * 70} className="h-full">
              <TestimonialCard testimonial={testimonial} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
