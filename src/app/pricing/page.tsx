import type { Metadata } from "next";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { getFaqs, getPayAsYouGo, getPlans } from "@/lib/services/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Faq } from "@/components/ui/Faq";
import { CtaBanner } from "@/components/home/CtaBanner";
import { cn, formatCadence, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent personal training pricing — online, hybrid and private coaching. Month to month, no lock-in contracts.",
};

export default async function PricingPage() {
  const [plans, payg, faqs] = await Promise.all([getPlans(), getPayAsYouGo(), getFaqs()]);

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="One price, everything included"
        description="No joining fee, no gym membership on top, no minimum term. Pause any time with a week's notice."
      />

      <Section>
        <div className="grid items-start gap-5 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 80} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-[var(--radius-card)] border p-6 sm:p-7",
                  plan.popular
                    ? "border-accent/50 bg-gradient-to-b from-accent/[0.07] to-surface shadow-[0_30px_60px_-40px_rgba(211,255,78,0.5)]"
                    : "border-line bg-surface",
                )}
              >
                {plan.popular ? (
                  <div className="absolute -top-3 left-6">
                    <Chip tone="accent">
                      <Sparkles className="h-3 w-3" />
                      Most chosen
                    </Chip>
                  </div>
                ) : null}

                <h2 className="text-2xl">{plan.name}</h2>
                <p className="mt-2 min-h-[3.5rem] text-sm leading-relaxed text-muted">{plan.description}</p>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl leading-none font-extrabold">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-sm text-faint">{formatCadence(plan.cadence)}</span>
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  href="/contact"
                  variant={plan.popular ? "primary" : "secondary"}
                  fullWidth
                  className="mt-7"
                >
                  {plan.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-5 flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg">{payg.name}</h3>
              <p className="mt-1 max-w-xl text-sm text-muted">{payg.description}</p>
            </div>
            <div className="flex items-center gap-5">
              <p className="font-display text-3xl leading-none font-extrabold whitespace-nowrap">
                {formatPrice(payg.price)}
                <span className="ml-1 text-sm font-normal text-faint">{formatCadence(payg.cadence)}</span>
              </p>
              <Button href="/contact" variant="outline" size="sm">
                {payg.ctaLabel}
              </Button>
            </div>
          </div>
        </Reveal>

        <p className="mt-6 text-center text-sm text-faint">
          Corporate and small-group rates on request. Student and NHS discount available — just ask.
        </p>
      </Section>

      <Section tone="raised">
        <SectionHeader eyebrow="Questions" title="Before you commit" align="center" />
        <Faq items={faqs} className="mx-auto max-w-3xl" />
      </Section>

      <CtaBanner />
    </>
  );
}
