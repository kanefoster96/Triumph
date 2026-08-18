"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { CalendarRange, Dumbbell, Loader2, Pencil, Salad, X } from "lucide-react";
import { useIsPhone } from "./useIsPhone";
import { cn } from "@/lib/utils";

/**
 * One day of a plan, saved in one press.
 *
 * The old editor was two panels with a Save button each, which meant a day was
 * routinely half-written: the training saved, the food still sitting in the
 * form. Training, food and how far the change reaches are three sections of
 * one form now, and the bar at the bottom commits all of it.
 *
 * On a phone it is a full-height sheet rather than a panel below the week: the
 * board is seven cards tall, so the editor started a screen and a half down
 * and Save was another four below that. As a sheet, the day's name is at the
 * top with a way out beside it and Save is pinned to the bottom edge, under
 * the thumb, wherever the content has been scrolled to.
 *
 * The two layouts are one form rendered in one of two places — never both, or
 * every field would be submitted twice.
 */
export function PlanDayForm({
  action,
  title,
  subtitle,
  defaultOpen = false,
  hidden,
  toolbar,
  training,
  food,
  scope,
}: {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  /** A word about the day itself — "Rest day", "3 exercises · 4 meals". */
  subtitle?: string;
  /** Opens the sheet on arrival, for a tap that came from a day card. */
  defaultOpen?: boolean;
  hidden: ReactNode;
  toolbar: ReactNode;
  training: ReactNode;
  food: ReactNode;
  scope: ReactNode;
}) {
  const phone = useIsPhone();
  const [open, setOpen] = useState(defaultOpen);
  const [dirty, setDirty] = useState(false);
  const [needsTitle, setNeedsTitle] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  /*
   * A day with exercises on it and no name reads as "Training" everywhere the
   * client sees it, which tells them nothing. Checked from the form itself
   * rather than by lifting the field's value up through three components —
   * everything here is a real input, so the form already knows.
   */
  const check = () => {
    setDirty(true);
    const data = form.current ? new FormData(form.current) : null;
    const hasExercises = (data?.getAll("exerciseId") ?? []).some((id) => String(id) !== "");
    const named = String(data?.get("title") ?? "").trim() !== "";
    const isRest = data?.get("isRest") === "on";
    setNeedsTitle(hasExercises && !named && !isRest);
  };

  // A half-built day is several minutes of work and the only copy of it is in
  // this form. Leaving with it unsaved should take a deliberate answer.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // The sheet scrolls; the page behind it must not.
  useEffect(() => {
    if (!phone || !open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phone, open]);

  /*
   * One form, rendered in one of two shapes. On a phone it is the flex column
   * that fills the sheet: the sections scroll and the save bar is the item
   * after them, so it sits on the bottom edge however far down the content
   * has been dragged. On a desktop it is an ordinary block in a panel and the
   * bar is sticky against the page's own scrolling.
   */
  const body = (
    <form
      ref={form}
      action={action}
      onInput={check}
      onChange={check}
      className={cn(phone && "flex min-h-0 flex-1 flex-col")}
    >
      {hidden}

      <div className={cn(phone && "min-h-0 flex-1 overflow-y-auto overscroll-contain")}>
        <Section icon={Dumbbell} title="Training" defaultOpen>
          {training}
        </Section>
        <Section icon={Salad} title="Food">
          {food}
        </Section>
        <Section icon={CalendarRange} title="How far this reaches" defaultOpen>
          {scope}
        </Section>
      </div>

      <SaveBar dirty={dirty} needsTitle={needsTitle} />
    </form>
  );

  if (phone) {
    return (
      <>
        {/* What the board shows in the editor's place: the day, and the way
            into it. Full width and thumb-high, not a link in a corner. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-sheet)] border border-line bg-surface px-5 py-3 text-left transition-colors hover:border-accent/40"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{title}</span>
            {subtitle ? <span className="block truncate text-xs text-faint">{subtitle}</span> : null}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-ink">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </span>
        </button>

        {open && typeof document !== "undefined"
          ? createPortal(
              <div className="fixed inset-0 z-50 flex flex-col bg-ink">
                <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold">{title}</h2>
                    {dirty ? (
                      <p className="text-xs font-semibold text-amber">Unsaved changes</p>
                    ) : subtitle ? (
                      <p className="truncate text-xs text-faint">{subtitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close the day"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-raised hover:text-text"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </header>

                {/* The whole-day tools sit above the form rather than inside
                    it: a form inside a form is invalid HTML and the browser
                    drops the inner one without a word. */}
                <div className="shrink-0 overflow-x-auto border-b border-line px-4 py-3">
                  <div className="flex items-center gap-2">{toolbar}</div>
                </div>
                {body}
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  return (
    <div className="rounded-[var(--radius-sheet)] border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {dirty ? (
          <span className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">
            Unsaved changes
          </span>
        ) : null}
      </header>

      {/* Outside the form on purpose. These are whole-day tools that post to
          actions of their own, and a form inside a form is invalid HTML — the
          browser drops the inner one and the button silently does nothing. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">{toolbar}</div>

      {body}
    </div>
  );
}

/**
 * A collapsible part of the day.
 *
 * `<details>` rather than state: the fields stay in the DOM when it is shut,
 * so a collapsed section still saves. Nothing inside is `required` for the
 * same reason — the browser cannot focus a hidden field to complain about it,
 * and would refuse to submit at all. What is missing is flagged in the UI and
 * dropped on the server instead.
 *
 * `min-h-0` and the scroll live here because in the phone sheet this is the
 * column that scrolls under a pinned save bar.
 */
function Section({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: typeof Dumbbell;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group shrink-0 border-b border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-raised">
        <Icon className="h-4 w-4 shrink-0 text-accent" />
        <span className="flex-1 text-sm font-semibold">{title}</span>
        <span className="text-xs font-semibold text-faint group-open:hidden">Show</span>
        <span className="hidden text-xs font-semibold text-faint group-open:inline">Hide</span>
      </summary>
      <div className="space-y-4 px-5 pt-1 pb-5">{children}</div>
    </details>
  );
}

function SaveBar({ dirty, needsTitle }: { dirty: boolean; needsTitle: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="sticky bottom-0 z-20 mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-[var(--radius-sheet)]">
      <p className={cn("text-xs", needsTitle ? "text-amber" : "text-faint")}>
        {needsTitle
          ? "Give the day a name — they see it as “Training” otherwise."
          : pending
            ? "Saving…"
            : dirty
              ? "Not saved yet."
              : "Training, food and how far it reaches."}
      </p>
      <button
        type="submit"
        disabled={pending || needsTitle}
        className={cn(
          "inline-flex h-11 min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors sm:flex-none",
          "bg-accent text-accent-ink hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint",
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save this day
      </button>
    </div>
  );
}
