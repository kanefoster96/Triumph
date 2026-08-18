"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * A panel that comes up from the bottom of the screen.
 *
 * A centre modal is the wrong shape for a phone — it lands under the thumb's
 * reach and pushes its own actions to the top of the screen. This sits against
 * the bottom edge where the hand already is, and on a wide screen it stops
 * growing and centres rather than becoming a letterbox.
 *
 * Mounted only while open, never parked off-screen: a fixed overlay left in
 * the DOM interferes with the page's scrolling even at `visibility: hidden`,
 * and a full-viewport backdrop that is always applied is worse again.
 *
 * Rendered into the body rather than in place. A sheet is opened from inside
 * whatever it belongs to — a form, a card, an element with its own overflow —
 * and its own forms, stacking and clipping should not inherit any of that. A
 * form inside a form is invalid HTML, and that is exactly where this gets
 * used.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // The sheet scrolls; the page behind it must not, or a flick meant for the
    // list underneath drags the whole document instead.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[85dvh] w-full flex-col rounded-t-[var(--radius-sheet)] border border-line bg-surface sm:max-w-lg sm:rounded-[var(--radius-sheet)]"
      >
        {/* The grab handle is decoration, but it is the thing that says
            "this came up and can go back down" without any words. */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line sm:hidden" />

        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-xs text-faint">{description}</p> : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 shrink-0 rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* pb-[env(safe-area-inset-bottom)] keeps the last row clear of the
            home indicator on a phone, where the sheet sits on the edge. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
