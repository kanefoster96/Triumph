"use client";

import { useEffect, useRef, useState } from "react";
import type { Feature } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";
import { AppScreen } from "./AppScreen";

/** Long enough to read as a swap, short enough not to be a wait. */
const FADE_MS = 180;

/**
 * Pick a members'-area screen and see it.
 *
 * One tablist, two shapes: a snapping rail on a phone, where stacking four
 * rows would push the preview off the bottom of the screen, and a column
 * beside the preview once there is room. Rendering it twice would put two sets
 * of tabs in the accessibility tree, so the layout changes rather than the
 * markup.
 *
 * On the rail the swipe itself chooses the screen — the card that lands in the
 * middle is the one previewed, and the preview sits in the same column beneath
 * it so the two read as one object. Arrow keys and taps do the same thing.
 */
export function MemberTour({ features }: { features: Feature[] }) {
  const [active, setActive] = useState(0);
  /** Lags `active` by one fade, so the old screen leaves before the new arrives. */
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);

  const rail = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swap = useRef<number | undefined>(undefined);
  const ticking = useRef(false);

  useEffect(() => () => window.clearTimeout(swap.current), []);

  /** True only while the tablist is actually a scrolling rail. */
  const isRail = () => {
    const node = rail.current;
    return !!node && node.scrollWidth > node.clientWidth + 1;
  };

  function reveal(next: number) {
    if (next === active) return;
    setActive(next);

    // Someone who has asked for less motion gets the screen, not the fade.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(next);
      return;
    }

    setFading(true);
    window.clearTimeout(swap.current);
    swap.current = window.setTimeout(() => {
      setShown(next);
      setFading(false);
    }, FADE_MS);
  }

  /** Tap or arrow key: choose it, and bring it to the middle of the rail. */
  function pick(next: number) {
    reveal(next);
    if (isRail()) {
      tabs.current[next]?.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
    }
  }

  /** Swipe: whichever card is nearest the middle is the one being looked at. */
  function onScroll() {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const node = rail.current;
      if (!node || !isRail()) return;
      const middle = node.getBoundingClientRect().left + node.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      tabs.current.forEach((tab, i) => {
        if (!tab) return;
        const box = tab.getBoundingClientRect();
        const distance = Math.abs(box.left + box.width / 2 - middle);
        if (distance < best) {
          best = distance;
          nearest = i;
        }
      });
      reveal(nearest);
    });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !back) return;
    event.preventDefault();
    const next = (active + (forward ? 1 : -1) + features.length) % features.length;
    pick(next);
    tabs.current[next]?.focus();
  }

  const preview = features[shown];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-14">
      <div
        ref={rail}
        role="tablist"
        aria-label="Members' area screens"
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        className={cn(
          // A rail below lg. The padding is half the leftover width, so the
          // first and last cards can still reach the middle.
          "no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:-mx-8",
          "px-[calc((100vw-17rem)/2)]",
          // A column above it.
          "lg:mx-0 lg:block lg:snap-none lg:space-y-3 lg:overflow-x-visible lg:px-0 lg:pb-0",
        )}
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
              onClick={() => pick(i)}
              className={cn(
                "flex h-20 w-[17rem] shrink-0 snap-center items-center gap-3 rounded-[var(--radius-sheet)] p-4 text-left transition-colors",
                "lg:h-auto lg:w-full lg:shrink lg:snap-align-none lg:items-start lg:gap-5 lg:p-5",
                open ? "bg-raised" : "bg-surface lg:bg-transparent lg:hover:bg-surface",
              )}
            >
              <IconTile feature={feature.icon} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
        aria-labelledby={`tour-tab-${features[active].id}`}
        className="lg:sticky lg:top-24"
      >
        {/* Same width as a card and centred like one, so the screen reads as
            belonging to the card above it rather than floating under it. */}
        <div
          className={cn(
            "mx-auto w-full max-w-[17rem] transition-opacity duration-200 ease-[var(--ease-out-app)]",
            fading ? "opacity-0" : "opacity-100",
          )}
        >
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
              {preview.preview ? <AppScreen preview={preview.preview} /> : null}
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-faint">
            A preview, not a screenshot — these screens are still being built.
          </p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted lg:hidden">{preview.body}</p>
      </div>
    </div>
  );
}
