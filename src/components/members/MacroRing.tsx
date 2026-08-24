import { cn } from "@/lib/utils";

interface MacroRingProps {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  /** Shown under the number: "cal", or "of 1,950". */
  caption?: string;
  size?: number;
}

/** Calories per gram: protein and carbs are 4, fat is 9. */
const PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

const SEGMENTS = [
  { key: "carbs", label: "Carbs", token: "var(--color-accent)" },
  { key: "fat", label: "Fat", token: "var(--color-amber)" },
  { key: "protein", label: "Protein", token: "var(--color-success)" },
] as const;

/**
 * Calories in the middle, macros as a share of them around the outside.
 *
 * The split is by calories rather than grams — 30g of fat is a bigger share of
 * a day than 30g of carbs, and showing grams alone hides that. Drawn as arcs
 * on one circle, so it costs no JavaScript.
 */
export function MacroRing({ calories, proteinG, carbsG, fatG, caption = "cal", size = 116 }: MacroRingProps) {
  const grams = { protein: proteinG ?? 0, carbs: carbsG ?? 0, fat: fatG ?? 0 };
  const energy = {
    protein: grams.protein * PER_GRAM.protein,
    carbs: grams.carbs * PER_GRAM.carbs,
    fat: grams.fat * PER_GRAM.fat,
  };
  const total = energy.protein + energy.carbs + energy.fat;

  const radius = size / 2 - 9;
  const circumference = 2 * Math.PI * radius;

  // Each arc starts where the ones before it end, so the offset is the sum of
  // their shares rather than a running total mutated during render.
  const arcs = SEGMENTS.map((segment, index) => {
    const share = total > 0 ? energy[segment.key] / total : 0;
    const before = SEGMENTS.slice(0, index).reduce(
      (sum, earlier) => sum + (total > 0 ? energy[earlier.key] / total : 0),
      0,
    );
    return { ...segment, share, dash: share * circumference, offset: before * circumference };
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-raised)"
            strokeWidth={9}
          />
          {arcs.map((arc) =>
            arc.share > 0 ? (
              <circle
                key={arc.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.token}
                strokeWidth={9}
                strokeLinecap="butt"
                strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                strokeDashoffset={-arc.offset}
                // Start at twelve o'clock rather than three.
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-2xl leading-none font-bold tabular-nums">
              {calories === null ? "—" : Math.round(calories).toLocaleString("en-GB")}
            </p>
            <p className="mt-1 text-xs text-faint">{caption}</p>
          </div>
        </div>
      </div>

      <dl className="flex flex-1 flex-wrap gap-x-8 gap-y-3">
        {arcs.map((arc) => (
          <div key={arc.key} className="min-w-16">
            <dt className="text-xs font-semibold tracking-[0.14em]" style={{ color: arc.token }}>
              {total > 0 ? `${Math.round(arc.share * 100)}%` : "—"}
            </dt>
            <dd className="mt-0.5">
              <span className="font-display text-lg font-bold tabular-nums">
                {Math.round(grams[arc.key])}
                <span className="text-sm font-normal"> g</span>
              </span>
              <span className="block text-xs text-faint">{arc.label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** A compact macro line for lists, where the ring would be too much. */
export function MacroLine({
  proteinG,
  carbsG,
  fatG,
  className,
}: {
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  className?: string;
}) {
  return (
    <span className={cn("text-xs text-faint tabular-nums", className)}>
      {carbsG ?? 0}C · {fatG ?? 0}F · {proteinG ?? 0}P
    </span>
  );
}
