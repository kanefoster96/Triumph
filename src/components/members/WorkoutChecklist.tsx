"use client";

import { Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveWorkoutNote, setWorkoutComplete, toggleWorkoutItem } from "@/lib/members/actions";
import type { Workout } from "@/lib/members/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Today's workout as a tick-list.
 *
 * Ticks apply optimistically so the gym floor feels instant, then reconcile
 * with the server. Dean sees the result on his side as soon as it lands.
 */
export function WorkoutChecklist({ workout, readOnly = false }: { workout: Workout; readOnly?: boolean }) {
  const [items, setItems] = useState(workout.items);
  const [note, setNote] = useState(workout.clientNote ?? "");
  const [savedNote, setSavedNote] = useState(workout.clientNote ?? "");
  const [pending, startTransition] = useTransition();

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length && items.length > 0;

  function toggle(id: string, done: boolean) {
    if (readOnly) return;
    setItems((current) => current.map((i) => (i.id === id ? { ...i, done } : i)));
    startTransition(() => toggleWorkoutItem(id, done));
  }

  function saveNote() {
    setSavedNote(note);
    startTransition(() => saveWorkoutNote(workout.id, note));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-semibold text-text">
            {doneCount} of {items.length}
          </span>{" "}
          done
        </p>
        {workout.completedAt ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            <Check className="h-4 w-4" />
            Completed
          </span>
        ) : null}
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id, !item.done)}
              disabled={readOnly}
              aria-pressed={item.done}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors duration-200",
                item.done ? "bg-accent/10" : "bg-raised",
                readOnly ? "cursor-default" : "hover:bg-overlay",
              )}
            >
              <span
                className={cn(
                  // An empty box is the one place a line still earns its keep:
                  // there is nothing else to see when the set is not done.
                  "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors",
                  item.done ? "border-accent bg-accent text-accent-ink" : "border-muted/40",
                )}
              >
                {item.done ? <Check className="h-4 w-4" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-semibold", item.done && "text-muted line-through")}>
                  {item.label}
                </span>
                {item.target ? <span className="mt-0.5 block text-xs text-faint">{item.target}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <label htmlFor={`note-${workout.id}`} className="mb-2 block text-xs font-semibold text-faint">
          {readOnly ? "Their note" : "Your note"}
        </label>
        <textarea
          id={`note-${workout.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          readOnly={readOnly}
          rows={3}
          placeholder={
            readOnly ? "They have not left a note yet." : "How did it feel? What weights did you use?"
          }
          className="w-full resize-y rounded-2xl bg-raised px-4 py-3 text-sm text-text transition-colors placeholder:text-faint"
        />
        {!readOnly ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" variant="secondary" onClick={saveNote} disabled={note === savedNote || pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {note === savedNote ? "Note saved" : "Save note"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={workout.completedAt ? "secondary" : "primary"}
              onClick={() => startTransition(() => setWorkoutComplete(workout.id, !workout.completedAt))}
            >
              {workout.completedAt ? "Mark not done" : allDone ? "Finish workout" : "Mark as done"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
