import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { getFaqs, getPayAsYouGo, getPlans } from "@/lib/services/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
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
        title="Simple, honest pricing"
        description="No joining fee, no gym membership on top, no minimum term. Pause any time with a week's notice."
      />

      <Section className="pt-0 sm:pt-0">
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 70} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-[var(--radius-sheet)] p-7",
                  plan.popular
                    ? "bg-accent text-accent-ink"
                    : "border border-line bg-surface text-text",
                )}
              >
                {plan.popular ? (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold whitespace-nowrap text-accent">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most popular
                  </span>
                ) : null}

                <h2 className="text-xl">{plan.name}</h2>
                <p
                  className={cn(
                    "mt-2 min-h-[4rem] text-sm leading-relaxed",
                    plan.popular ? "text-accent-ink/75" : "text-muted",
                  )}
                >
                  {plan.description}
                </p>

                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold tracking-tight">{formatPrice(plan.price)}</span>
                  <span className={cn("text-sm", plan.popular ? "text-accent-ink/70" : "text-faint")}>
                    {formatCadence(plan.cadence)}
                  </span>
                </p>

                <ul className="mt-7 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={cn(
                        "flex items-start gap-3 text-sm",
                        plan.popular ? "text-accent-ink/90" : "text-muted",
                      )}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          plan.popular ? "text-accent-ink" : "text-accent",
                        )}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  href="/contact"
                  variant={plan.popular ? "onAccent" : "secondary"}
                  fullWidth
                  className="mt-8"
                >
                  {plan.ctaLabel}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-6 flex flex-col gap-5 rounded-[var(--radius-sheet)] border border-line bg-surface p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg">{payg.name}</h3>
              <p className="mt-1.5 max-w-xl text-sm text-muted">{payg.description}</p>
            </div>
            <div className="flex items-center gap-5">
              <p className="text-3xl font-bold tracking-tight whitespace-nowrap">
                {formatPrice(payg.price)}
                <span className="ml-1.5 text-sm font-normal text-faint">{formatCadence(payg.cadence)}</span>
              </p>
              <Button href="/contact" variant="secondary" size="sm">
                {payg.ctaLabel}
              </Button>
            </div>
          </div>
        </Reveal>

        <p className="mt-8 text-center text-sm text-faint">
          Corporate and small-group rates on request. Student and NHS discount available — just ask.
        </p>
      </Section>

      <Section tone="raised">
        <SectionHeader eyebrow="Questions" title="Before you commit" />
        <Faq items={faqs} className="mx-auto max-w-3xl" />
      </Section>

      <CtaBanner />
    </>
  );
}
