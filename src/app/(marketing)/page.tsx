import Link from "next/link";
import { getFaqs } from "@/lib/services/content";
import { Hero } from "@/components/home/Hero";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { HowItWorks } from "@/components/home/HowItWorks";
import { GoalRail } from "@/components/home/GoalRail";
import { MembersArea } from "@/components/home/MembersArea";
import { EverythingYouGet } from "@/components/home/EverythingYouGet";
import { CoachIntro } from "@/components/home/CoachIntro";
import { ResultsRail } from "@/components/home/ResultsRail";
import { TestimonialWall } from "@/components/home/TestimonialWall";
import { CtaBanner } from "@/components/home/CtaBanner";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Faq } from "@/components/ui/Faq";

export default async function HomePage() {
  const faqs = await getFaqs(5);

  return (
    <>
      <Hero />
      <CoachIntro />
      <WhatsIncluded />
      <HowItWorks />
      <GoalRail />
      <MembersArea />
      <EverythingYouGet />
      <ResultsRail />
      <TestimonialWall />

      <Section>
        <SectionHeader title="Questions." />
        <Faq items={faqs} className="mx-auto max-w-3xl" />
        <p className="mt-8 text-center text-sm text-muted">
          Still unsure?{" "}
          <Link href="/contact" className="font-semibold text-accent hover:underline">
            Ask Dean directly
          </Link>
          .
        </p>
      </Section>

      <CtaBanner />
    </>
  );
}
