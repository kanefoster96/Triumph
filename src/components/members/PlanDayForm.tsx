"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CalendarRange, Dumbbell, Loader2, Salad } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One day of a plan, saved in one press.
 *
 * The old editor was two panels with a Save button each, which meant a day was
 * routinely half-written: the training saved, the food still sitting in the
 * form. Training, food and how far the change reaches are three sections of
 * one form now, and the bar at the bottom commits all of it.
 *
 * The bar is sticky rather than parked at the end of a long page — on a phone
 * the Save button was several screens below the thing being edited, and a
 * button you have to go looking for is a button that gets forgotten.
 */
export function PlanDayForm({
  action,
  title,
  hidden,
  toolbar,
  training,
  food,
  scope,
}: {
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  hidden: ReactNode;
  toolbar: ReactNode;
  training: ReactNode;
  food: ReactNode;
  scope: ReactNode;
}) {
  const [dirty, setDirty] = useState(false);

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

      <form action={action} onInput={() => setDirty(true)} onChange={() => setDirty(true)}>
        {hidden}

        <Section icon={Dumbbell} title="Training" defaultOpen>
          {training}
        </Section>
        <Section icon={Salad} title="Food">
          {food}
        </Section>
        <Section icon={CalendarRange} title="How far this reaches" defaultOpen>
          {scope}
        </Section>

        <SaveBar dirty={dirty} />
      </form>
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
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-raised">
        <Icon className="h-4 w-4 shrink-0 text-accent" />
        <span className="flex-1 text-sm font-semibold">{title}</span>
        <span className="text-xs font-semibold text-faint group-open:hidden">Show</span>
        <span className="hidden text-xs font-semibold text-faint group-open:inline">Hide</span>
      </summary>
      <div className="space-y-4 px-5 pt-1 pb-5">{children}</div>
    </details>
  );
}

function SaveBar({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-[var(--radius-sheet)] border-t border-line bg-surface px-5 py-3">
      <p className="text-xs text-faint">
        {pending ? "Saving…" : dirty ? "Not saved yet." : "Training, food and how far it reaches."}
      </p>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
          "bg-accent text-accent-ink hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint",
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save this day
      </button>
    </div>
  );
}
