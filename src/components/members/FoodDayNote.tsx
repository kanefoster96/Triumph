"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, MessageSquare } from "lucide-react";
import { saveFoodDayFeedback } from "@/lib/members/actions";

/**
 * "Any notes for me about your meals today?"
 *
 * Collapsed to a line, because most days there is nothing to say. When there
 * is, it is the note Dean most often acts on — a meal somebody does not like,
 * one that takes too long on a weeknight, an ingredient that never makes it
 * into the trolley are three different fixes — and it lands on the day itself,
 * where he is looking when he changes it.
 */
export function FoodDayNote({ date, existing }: { date: string; existing: string | null }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(existing ?? "");
  const [saved, setSaved] = useState(existing ?? "");
  const [saving, startSaving] = useTransition();

  function save() {
    const data = new FormData();
    data.set("date", date);
    data.set("note", note);
    startSaving(async () => {
      await saveFoodDayFeedback(data);
      setSaved(note);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-ink px-4 py-3 text-left transition-colors hover:border-accent/40"
      >
        <MessageSquare className="h-4 w-4 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {saved ? "Your note to me" : "Any notes for me about your meals today?"}
          </span>
          {saved ? <span className="block truncate text-xs text-faint">{saved}</span> : null}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-ink p-4">
      <p className="text-sm font-semibold">Any notes for me about your meals today?</p>
      <textarea
        rows={3}
        maxLength={400}
        autoFocus
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ran out of time for lunch, had a sandwich instead."
        className="w-full resize-y rounded-2xl border border-line bg-surface px-4 py-3 text-base text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || note.trim() === saved.trim()}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:bg-raised disabled:text-faint sm:flex-none"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {note.trim() !== "" && note.trim() === saved.trim() ? "Sent" : "Send this to Dean"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:text-text"
        >
          Close
        </button>
      </div>
    </div>
  );
}
