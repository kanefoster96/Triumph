"use client";

import { useRef, useState } from "react";
import type { Feature } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";
import { AppScreen } from "./AppScreen";

/**
 * Pick a members'-area screen and see it.
 *
 * One tablist, two shapes: a horizontal rail on a phone, where stacking four
 * rows would push the preview off the bottom of the screen, and a column
 * beside the preview once there is room. Rendering it twice would put two sets
 * of tabs in the accessibility tree, so the layout changes rather than the
 * markup.
 *
 * Arrow keys move between screens, and the description travels with whichever
 * preview it describes.
 */
export function MemberTour({ features }: { features: Feature[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: React.KeyboardEvent) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !back) return;
    event.preventDefault();
    const next = (active + (forward ? 1 : -1) + features.length) % features.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  const shown = features[active];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-14">
      <div
        role="tablist"
        aria-label="Members' area screens"
        onKeyDown={onKeyDown}
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:block lg:space-y-3 lg:overflow-x-visible lg:px-0 lg:pb-0"
      >
        {features.map((feature, i) => {
          const open = i === active;
          return (
            <button
              key={feature.id}
              ref={(node) => {
                tabs.current[i] = node;
              }}
              role="tab"
              id={`tour-tab-${feature.id}`}
              aria-selected={open}
              aria-controls="tour-panel"
              tabIndex={open ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-[var(--radius-sheet)] p-4 text-left transition-colors",
                "lg:w-full lg:shrink lg:items-start lg:gap-5 lg:p-5",
                open ? "bg-raised" : "bg-surface lg:bg-transparent lg:hover:bg-surface",
              )}
            >
              <IconTile feature={feature.icon} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base whitespace-nowrap lg:text-lg">{feature.title}</span>
                  {feature.comingSoon ? <Chip tone="amber">In build</Chip> : null}
                </span>
                {/* On a phone this sits under the preview instead, where there
                    is width for it. */}
                {open ? (
                  <span className="mt-2 hidden text-sm leading-relaxed text-muted lg:block">
                    {feature.body}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="tour-panel"
        aria-labelledby={`tour-tab-${shown.id}`}
        className="lg:sticky lg:top-24"
      >
        <div className="mx-auto w-full max-w-[17rem]">
          {/*
           * A screen sits *below* its bezel rather than above it, which is the
           * one place the tone ramp runs backwards on purpose: that recess is
           * what makes it read as a device instead of another card.
           */}
          <div className="rounded-[2.2rem] bg-raised p-2">
            {/* Fixed, not min-height: the screens differ by about 115px and
                the frame jumped every time you switched tab. */}
            <div className="h-[28.5rem] overflow-hidden rounded-[1.7rem] bg-ink p-3">
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-raised" />
              {shown.preview ? <AppScreen preview={shown.preview} /> : null}
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-faint">
            A preview, not a screenshot — these screens are still being built.
          </p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted lg:hidden">{shown.body}</p>
      </div>
    </div>
  );
}
