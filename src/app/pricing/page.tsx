import type { Metadata } from "next";
import { Check, MapPin, Sparkles } from "lucide-react";
import { getFaqs, getPlans } from "@/lib/services/content";
import { site } from "@/lib/data/site";
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
    "Online coaching with Dean Foster is £120 a month — meal plan, training plan, check-ins and adjustments included. In-person sessions available in Newcastle upon Tyne.",
};

export default async function PricingPage() {
  const [plans, faqs] = await Promise.all([getPlans(), getFaqs()]);

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="One price, everything included"
        description="No joining fee, no tiers, no minimum term. Cancel any time with a week's notice."
      />

      <Section className="pt-0 sm:pt-0">
        <div className="mx-auto grid max-w-4xl items-start gap-6 md:grid-cols-2">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 70} className="h-full">
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-[var(--radius-sheet)] p-7",
                  plan.popular ? "bg-accent text-accent-ink" : "border border-line bg-surface text-text",
                )}
              >
                {plan.popular ? (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold whitespace-nowrap text-accent">
                    <Sparkles className="h-3.5 w-3.5" />
                    The main thing
                  </span>
                ) : null}

                <h2 className="text-xl">{plan.name}</h2>
                <p
                  className={cn(
                    "mt-2 min-h-[4.5rem] text-sm leading-relaxed",
                    plan.popular ? "text-accent-ink/75" : "text-muted",
                  )}
                >
                  {plan.description}
                </p>

                <p className="mt-4 flex items-baseline gap-1.5">
                  {plan.cadence === "session" ? (
                    <span className={cn("text-sm", plan.popular ? "text-accent-ink/70" : "text-faint")}>
                      from
                    </span>
                  ) : null}
                  <span className="font-display text-5xl font-bold tracking-tight">
                    {formatPrice(plan.price)}
                  </span>
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

                {!plan.popular ? (
                  <p className="mt-6 inline-flex items-center gap-2 text-xs text-faint">
                    <MapPin className="h-3.5 w-3.5" />
                    {site.inPersonArea} only
                  </p>
                ) : null}

                <Button
                  href="/contact"
                  variant={plan.popular ? "onAccent" : "secondary"}
                  fullWidth
                  className="mt-6"
                >
                  {plan.ctaLabel}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-faint">
          Not sure it is right for you? The consult is free and there is no obligation afterwards.
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
