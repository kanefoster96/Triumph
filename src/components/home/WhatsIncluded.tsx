import { getCoachingPrice, getIncluded } from "@/lib/services/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconTile } from "@/components/ui/IconTile";
import { formatPrice } from "@/lib/utils";

export async function WhatsIncluded() {
  const [included, price] = await Promise.all([getIncluded(), getCoachingPrice()]);

  return (
    <Section id="included" tone="raised">
      <SectionHeader
        eyebrow="Online coaching"
        title="Everything below, for one monthly price"
        description={`${formatPrice(price.amount)} a month. No tiers, no upsells, no add-ons you find out about later.`}
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {included.map((feature, i) => (
          <Reveal key={feature.id} delay={(i % 3) * 70} className="h-full">
            <div className="h-full rounded-[var(--radius-sheet)] border border-line bg-ink p-6">
              <IconTile feature={feature.icon} />
              <h3 className="mt-5 text-lg">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
