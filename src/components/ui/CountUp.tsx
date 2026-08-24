"use client";

import { useEffect, useRef } from "react";

/**
 * A number that climbs to its value the first time it is scrolled into view.
 *
 * React renders the final figure once and never re-renders; the climb is
 * written straight onto the text node, which keeps a 60fps animation from
 * costing a render a frame. That also means a visitor with no JavaScript — or
 * one who hydrated having already scrolled past — reads the real number
 * rather than a zero.
 *
 * The drop to zero happens in an effect, under the `Reveal` wrapping these
 * stats, which is still faded out at that point, so the final value never
 * flashes first. `prefers-reduced-motion` skips the climb entirely.
 */
export function CountUp({
  value,
  durationMs = 1400,
  className,
}: {
  /** The figure to climb to, as authored — "80", "4.9". */
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const target = Number(value);
  // Match however precise the source was, so "4.9" counts in tenths.
  const decimals = value.split(".")[1]?.length ?? 0;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || Number.isNaN(target)) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof IntersectionObserver === "undefined") return;

    const format = (n: number) =>
      n.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    const settled = node.textContent;
    node.textContent = format(0);

    let frame = 0;
    let start: number | null = null;

    const step = (now: number) => {
      // The clock is read here rather than in render, which would be impure.
      start ??= now;
      const t = Math.min(1, (now - start) / durationMs);
      // Ease out cubic: quick off the mark, settles onto the number.
      node.textContent = format(target * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
      else node.textContent = settled; // exactly what React rendered
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.2 },
    );

    /*
     * Watch only once the page has stopped moving under us.
     *
     * At first paint the fallback font makes the document shorter, which on a
     * phone puts these stats inside the viewport when they belong well below
     * it. Observing then spends the whole climb off-screen, and the reader
     * scrolls down to a number that has already arrived.
     */
    let dropped = false;
    const arm = () => {
      if (!dropped) observer.observe(node);
    };
    document.fonts?.ready
      ? document.fonts.ready.then(() => requestAnimationFrame(arm))
      : arm();

    return () => {
      dropped = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      node.textContent = settled;
    };
  }, [target, decimals, durationMs]);

  // Anything non-numeric is copy, not a figure — leave it alone.
  if (Number.isNaN(target)) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={className}>
      {target.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
