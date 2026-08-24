"use client";

import { useEffect, useRef, useState } from "react";
import type { Feature } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconTile } from "@/components/ui/IconTile";
import { AppScreen } from "./AppScreen";

/**
 * Pick a members'-area screen and see it.
 *
 * Two rails kept in step: the cards and the screens are both native
 * scroll-snap carousels, so either can be swiped and the other follows pixel
 * for pixel rather than waiting for the gesture to end. Swiping the screens
 * takes the current one off to the left and brings the next in from the
 * right, which is the motion the cards were already making.
 *
 * Only the rail being touched may drive, or the two would shove each other
 * back and forth for as long as a finger was down.
 *
 * The cards are the tablist above `lg` as well, laid out as a column beside
 * the screens — rendering it twice would put two sets of tabs in the
 * accessibility tree, so the layout changes rather than the markup.
 */
type Rail = "cards" | "screens";

export function MemberTour({ features }: { features: Feature[] }) {
  const [active, setActive] = useState(0);

  const cards = useRef<HTMLDivElement>(null);
  const screens = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  /** The rail the finger is on. Anything else that scrolls is an echo of it. */
  const leader = useRef<HTMLDivElement | null>(null);
  const ticking = useRef(false);

  const last = features.length - 1;

  const scrolls = (node: HTMLDivElement | null): node is HTMLDivElement =>
    !!node && node.scrollWidth > node.clientWidth + 1;

  useEffect(() => {
    // The cards stop being a rail at `lg`, so a leader held across a resize
    // would lock the other one out.
    const drop = () => {
      leader.current = null;
    };
    window.addEventListener("resize", drop);
    return () => window.removeEventListener("resize", drop);
  }, []);

  /**
   * The same fraction along rather than the same pixels: the rails are
   * different widths, and the cards carry half a screen of padding either side
   * so the first and last can still reach the middle.
   */
  function mirror(from: HTMLDivElement, to: HTMLDivElement) {
    const fromEnd = from.scrollWidth - from.clientWidth;
    const toEnd = to.scrollWidth - to.clientWidth;
    if (fromEnd <= 0 || toEnd <= 0) return;
    to.scrollLeft = (from.scrollLeft / fromEnd) * toEnd;
  }

  function indexOf(node: HTMLDivElement) {
    const end = node.scrollWidth - node.clientWidth;
    if (end <= 0) return 0;
    return Math.round((node.scrollLeft / end) * last);
  }

  function onScroll(which: Rail) {
    const node = which === "cards" ? cards.current : screens.current;
    if (!node || (leader.current && leader.current !== node)) return;
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const other = which === "cards" ? screens.current : cards.current;
      if (scrolls(other)) mirror(node, other);
      const i = indexOf(node);
      setActive((current) => (current === i ? current : i));
    });
  }

  /** Tap or arrow key: drive the screens and let the cards follow them. */
  function goTo(next: number) {
    setActive(next);
    const node = screens.current;
    if (!scrolls(node)) return;
    leader.current = node;
    node.scrollTo({
      left: (next / last) * (node.scrollWidth - node.clientWidth),
      behavior: "smooth",
    });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !back) return;
    event.preventDefault();
    const next = (active + (forward ? 1 : -1) + features.length) % features.length;
    goTo(next);
    tabs.current[next]?.focus();
  }

  /** Whichever rail is touched leads, until another one is. */
  function claim(which: Rail) {
    leader.current = which === "cards" ? cards.current : screens.current;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-14">
      <div
        ref={cards}
        role="tablist"
        aria-label="Members' area screens"
        onKeyDown={onKeyDown}
        onScroll={() => onScroll("cards")}
        onPointerDown={() => claim("cards")}
        onWheel={() => claim("cards")}
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
              onClick={() => goTo(i)}
              className={cn(
                "flex h-20 w-[17rem] shrink-0 snap-center items-center gap-3 rounded-[var(--radius-sheet)] p-4 text-left transition-colors",
                "lg:h-auto lg:w-full lg:shrink lg:snap-align-none lg:items-start lg:gap-5 lg:p-5",
                open ? "bg-raised" : "bg-surface lg:bg-transparent lg:hover:bg-surface",
              )}
            >
              <IconTile feature={feature.icon} />
              <span className="min-w-0 flex-1">
                <span className="block text-base whitespace-nowrap lg:text-lg">{feature.title}</span>
                {/* On a phone this sits under the screens instead, where there
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
        {/* Same width as a card and centred like one, so the screens read as
            belonging to the card above them rather than floating underneath. */}
        <div className="mx-auto w-full max-w-[17rem]">
          <div
            ref={screens}
            onScroll={() => onScroll("screens")}
            onPointerDown={() => claim("screens")}
            onWheel={() => claim("screens")}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          >
            {features.map((feature, i) => (
              <div key={feature.id} aria-hidden={i !== active} className="w-full shrink-0 snap-center">
                {/*
                 * A screen sits *below* its bezel rather than above it, which
                 * is the one place the tone ramp runs backwards on purpose:
                 * that recess is what makes it read as a device rather than
                 * another card.
                 */}
                <div className="rounded-[2.2rem] bg-raised p-2">
                  {/* Fixed, not min-height: the screens differ by about 115px
                      and the frame jumped on every change. */}
                  <div className="h-[28.5rem] overflow-hidden rounded-[1.7rem] bg-ink p-3">
                    <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-raised" />
                    {feature.preview ? <AppScreen preview={feature.preview} /> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted lg:hidden">{features[active].body}</p>
      </div>
    </div>
  );
}
