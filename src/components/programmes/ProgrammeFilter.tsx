"use client";

import { useMemo, useState } from "react";
import type { Programme, TrainingFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProgrammeCard } from "@/components/cards/ProgrammeCard";

type Filter = "All" | TrainingFormat;
const filters: Filter[] = ["All", "1:1", "Hybrid", "Online", "Small group"];

/**
 * Segmented control + filtered grid.
 *
 * Filtering happens client-side over data the server already sent, so
 * switching tabs is instant — the responsiveness people expect from an app
 * rather than a page load per filter.
 */
export function ProgrammeFilter({ programmes }: { programmes: Programme[] }) {
  const [active, setActive] = useState<Filter>("All");

  const available = useMemo(
    () => filters.filter((f) => f === "All" || programmes.some((p) => p.format === f)),
    [programmes],
  );

  const visible = useMemo(
    () => (active === "All" ? programmes : programmes.filter((p) => p.format === active)),
    [active, programmes],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter programmes by format"
        className="no-scrollbar mx-auto mb-6 flex w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 sm:w-fit"
      >
        {available.map((filter) => {
          const selected = filter === active;
          return (
            <button
              key={filter}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(filter)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                selected ? "bg-accent text-accent-ink" : "text-muted hover:text-text",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <p className="mb-8 text-center text-sm text-faint">
        {visible.length} {visible.length === 1 ? "programme" : "programmes"}
        {active === "All" ? "" : ` · ${active}`}
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((programme) => (
          <ProgrammeCard key={programme.id} programme={programme} className="h-full" />
        ))}
      </div>
    </div>
  );
}
