import Link from "next/link";
import { getFaqs } from "@/lib/services/content";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { ProgrammeRail } from "@/components/home/ProgrammeRail";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CoachIntro } from "@/components/home/CoachIntro";
import { ResultsRail } from "@/components/home/ResultsRail";
import { Feed } from "@/components/home/Feed";
import { TestimonialWall } from "@/components/home/TestimonialWall";
import { CtaBanner } from "@/components/home/CtaBanner";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Faq } from "@/components/ui/Faq";

export default async function HomePage() {
  const faqs = await getFaqs(5);

  return (
    <>
      <Hero />
      <Marquee />
      <ProgrammeRail />
      <HowItWorks />
      <CoachIntro />
      <ResultsRail />
      <Feed />
      <TestimonialWall />

      <Section>
        <SectionHeader
          eyebrow="Questions"
          title="The things everyone asks first"
          align="center"
        />
        <Faq items={faqs} className="mx-auto max-w-3xl" />
        <p className="mt-6 text-center text-sm text-muted">
          Still unsure?{" "}
          <Link href="/contact" className="font-semibold text-accent hover:underline">
            Ask me directly
          </Link>
          .
        </p>
      </Section>

      <CtaBanner />
    </>
  );
}
