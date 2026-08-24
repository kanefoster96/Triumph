/** Rows, and how long each takes to travel its own length. */
const ROWS = 4;
const SECONDS = [64, 78, 58, 72];

/** Deal the list across rows so every row fills, whatever the list length. */
function deal(items: string[], rows: number): string[][] {
  const out: string[][] = Array.from({ length: rows }, () => []);
  items.forEach((item, i) => out[i % rows].push(item));
  return out;
}

function Row({ items, seconds, reversed }: { items: string[]; seconds: number; reversed: boolean }) {
  return (
    <div className="marquee overflow-hidden">
      <div
        className="marquee-track flex w-max gap-3 sm:gap-4"
        data-direction={reversed ? "right" : "left"}
        style={{ "--marquee-seconds": `${seconds}s` } as React.CSSProperties}
      >
        {/*
         * Twice, so sliding half the track's width lands the copy exactly
         * where the original was. The second pass is decorative — the first
         * already said it — so it is hidden from assistive tech.
         */}
        {[0, 1].map((pass) =>
          items.map((item) => (
            <span
              key={`${pass}-${item}`}
              aria-hidden={pass === 1}
              className="shrink-0 rounded-full bg-surface px-5 py-3 text-sm whitespace-nowrap text-text sm:px-6 sm:py-3.5 sm:text-base"
            >
              {item}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

/**
 * The rest of what the price buys, scrolling past.
 *
 * Rows alternate direction so the block reads as movement rather than a list
 * being dragged one way, and each runs at its own speed so they never line up
 * into a grid marching in step.
 *
 * Full-bleed on purpose: a row that stopped at the container edge would look
 * like it had ended rather than carried on.
 */
export function EverythingRail({ items }: { items: string[] }) {
  const rows = deal(items, ROWS);

  return (
    <div className="space-y-3 sm:space-y-4">
      {rows.map((row, i) => (
        <Row key={i} items={row} seconds={SECONDS[i]} reversed={i % 2 === 0} />
      ))}
    </div>
  );
}
