import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, Mail, Monitor, Phone } from "lucide-react";
import { getProcess, getProgrammes } from "@/lib/services/content";
import { site } from "@/lib/data/site";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconTile } from "@/components/ui/IconTile";
import { EnquiryForm } from "@/components/contact/EnquiryForm";

export const metadata: Metadata = {
  title: "Book a free consult",
  description:
    "Get in touch with Dean Foster — online coaching anywhere in the UK.",
};

const details = [
  { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
  { icon: Phone, label: "Phone", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
  { icon: Monitor, label: "Coaching", value: "Online, anywhere in the UK" },
  { icon: Clock, label: "Reply time", value: "Within one working day" },
];

export default async function ContactPage() {
  const [programmes, process] = await Promise.all([getProgrammes(), getProcess()]);

  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Book a free consult"
        description="A short conversation about where you are, what you want, and whether I am the right coach to get you there. No cost, no obligation."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <Reveal className="min-w-0">
            <Suspense
              fallback={
                <div className="h-[32rem] animate-pulse rounded-[var(--radius-sheet)] border border-line bg-surface" />
              }
            >
              <EnquiryForm programmes={programmes} />
            </Suspense>
          </Reveal>

          <div className="min-w-0 space-y-10">
            <Reveal delay={70}>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {details.map((detail) => (
                  <li
                    key={detail.label}
                    className="flex items-center gap-4 rounded-[var(--radius-sheet)] border border-line bg-surface px-5 py-4"
                  >
                    <IconTile icon={detail.icon} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs text-faint">{detail.label}</p>
                      {detail.href ? (
                        <a
                          href={detail.href}
                          className="text-sm font-medium transition-colors hover:text-accent"
                        >
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
              <h2 className="mb-5 text-xl">What happens next</h2>
              <ol className="space-y-3">
                {process.map((step, i) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-[var(--radius-sheet)] border border-line bg-surface p-5"
                  >
                    <span className="text-sm font-bold text-accent">0{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </div>
      </Container>
    </>
  );
}
