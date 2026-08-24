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
        title={`${formatPrice(price.amount)} a month. Hit your targets, get ${formatPrice(price.amount / 2)} back.`}
        description="No tiers, no upsells, no contract. Hit every target in month one and get 50% back."
      />

      {/* One column: read as a list, the icon anchoring each row rather than
          sitting on a line of its own. Held to a readable measure so the body
          copy does not run the full width of the container. */}
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4">
        {included.map((feature, i) => (
          <Reveal key={feature.id} delay={(i % 3) * 70}>
            <div className="flex gap-5 rounded-[var(--radius-sheet)] bg-raised p-6">
              <IconTile feature={feature.icon} />
              <div className="min-w-0">
                <h3 className="text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
