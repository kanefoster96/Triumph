"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether we are on a phone-width screen.
 *
 * Most of the responsive work in here is CSS, which is where it belongs. This
 * is for the handful of places where the two layouts are genuinely different
 * components rather than the same one restyled — the day editor is a sheet on
 * a phone and a panel on a desktop, and rendering both would put two copies of
 * every field into the same form.
 *
 * `useSyncExternalStore` rather than an effect: reading `matchMedia` during
 * render would disagree with the server's first paint, and seeding it from an
 * effect is a cascading render that trips `react-hooks/set-state-in-effect`.
 *
 * The server snapshot is `false`, so the desktop layout is what gets rendered
 * into the HTML. That is the safe way round — it is the one that works without
 * JavaScript.
 */
const QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
