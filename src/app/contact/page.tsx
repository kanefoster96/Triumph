import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getProgrammes, getSchedule } from "@/lib/services/content";
import { site } from "@/lib/data/site";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { ScheduleList } from "@/components/contact/ScheduleList";

export const metadata: Metadata = {
  title: "Book a consult",
  description:
    "Book a free twenty-minute consult with Triumph personal training in Manchester, or enquire about online coaching.",
};

const details = [
  { icon: MapPin, label: "Studio", value: site.studio },
  { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
  { icon: Phone, label: "Phone", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
  { icon: Clock, label: "Reply time", value: "Within one working day" },
];

export default async function ContactPage() {
  const [programmes, schedule] = await Promise.all([getProgrammes(), getSchedule()]);

  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Book a free consult"
        description="Twenty minutes to talk through where you are, where you want to be, and whether I am the right coach to get you there. No cost, no obligation."
      />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <Reveal>
            <Suspense
              fallback={
                <div className="h-[32rem] animate-pulse rounded-[var(--radius-card)] border border-line bg-surface" />
              }
            >
              <EnquiryForm programmes={programmes} />
            </Suspense>
          </Reveal>

          <div className="space-y-8">
            <Reveal delay={80}>
              <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-1">
                {details.map((detail) => (
                  <li key={detail.label} className="flex items-start gap-3 bg-surface px-5 py-4">
                    <detail.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="text-[11px] tracking-[0.14em] text-faint uppercase">{detail.label}</p>
                      {detail.href ? (
                        <a href={detail.href} className="text-sm font-medium transition-colors hover:text-accent">
                          {detail.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium">{detail.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={140}>
              <h2 className="mb-4 text-xl">This week at the studio</h2>
              <ScheduleList slots={schedule} />
              <p className="mt-4 text-xs text-faint">
                Availability updates weekly. Online coaching has no fixed times — you train when it suits.
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </>
  );
}
