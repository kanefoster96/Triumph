import { getCoachingPrice, getEverything, getIncluded } from "@/lib/services/content";
import { Container, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconTile } from "@/components/ui/IconTile";
import { EverythingRail } from "./EverythingRail";
import { formatPrice } from "@/lib/utils";

/**
 * What the monthly price buys — the headline few, then the rest scrolling past.
 *
 * These used to be two sections back to back, one listing six things at length
 * and the other listing everything in three words each. Saying it twice was
 * most of why the page felt long.
 *
 * The three are not in cards. A container behind every one of them put six
 * boxes down the page and the spacing did the separating anyway; the icon is
 * enough of an anchor on its own.
 */
export async function WhatsIncluded({ limit }: { limit?: number }) {
  const [included, price, everything] = await Promise.all([
    getIncluded(),
    getCoachingPrice(),
    getEverything(),
  ]);
  // The landing page takes the headline three; the coaching page, which is
  // where somebody has gone looking for detail, gets all of them.
  const cards = limit ? included.slice(0, limit) : included;

  return (
    <section id="included" className="py-24 sm:py-36">
      <Container>
        <SectionHeader
          eyebrow="Online coaching"
          title="Everything you get."
          description={`${formatPrice(price.amount)} a month. No tiers, no upsells, no contract.`}
        />

        <div className="mx-auto grid max-w-4xl gap-12 sm:grid-cols-3 sm:gap-10">
          {cards.map((feature, i) => (
            <Reveal key={feature.id} delay={(i % 3) * 70} className="text-center sm:text-left">
              <IconTile feature={feature.icon} size="lg" className="mx-auto sm:mx-0" />
              <h3 className="mt-5 text-lg">{feature.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{feature.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>

      <div className="mt-20 sm:mt-28">
        <EverythingRail items={everything} />
      </div>
    </section>
  );
}
