const words = [
  "Strength",
  "Fat loss",
  "Hybrid athletes",
  "Return from injury",
  "Postnatal",
  "Nutrition habits",
  "Online coaching",
  "Small group",
];

/** Ticker strip — breaks up the page and reads as motion, not decoration. */
export function Marquee() {
  return (
    <div className="relative flex overflow-hidden border-y border-line bg-surface/60 py-4">
      <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8" aria-hidden>
        {[...words, ...words].map((word, i) => (
          <span key={`${word}-${i}`} className="flex items-center gap-8">
            <span className="font-display text-xl font-bold tracking-wide text-faint uppercase sm:text-2xl">
              {word}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
      <span className="sr-only">{words.join(", ")}</span>
    </div>
  );
}
