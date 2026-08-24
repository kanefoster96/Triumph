"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import type { ClientNote } from "@/lib/members/types";
import { replyToNote } from "@/lib/members/actions";

/**
 * What the client said, and a way to answer it.
 *
 * Collapsed to a chip by default, because most days have nothing and a day
 * that does should not push the plan off the screen. Open, it is the note and
 * a reply box — the reply goes back on the thing they wrote it on, so they
 * read the answer under their own words rather than in a separate inbox.
 *
 * Adjusting the plan is not a button here on purpose: the day's editor is
 * already open around this, so "change it" is the next section down.
 */
export function DayNotes({
  clientId,
  notes,
  firstName,
}: {
  clientId: string;
  notes: ClientNote[];
  firstName: string;
}) {
  if (notes.length === 0) return null;

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <NoteCard key={note.id} clientId={clientId} note={note} firstName={firstName} />
      ))}
    </ul>
  );
}

const KIND: Record<ClientNote["kind"], string> = {
  workout: "After training",
  food: "About their food",
  weight: "With their weigh-in",
};

function NoteCard({
  clientId,
  note,
  firstName,
}: {
  clientId: string;
  note: ClientNote;
  firstName: string;
}) {
  const [replying, setReplying] = useState(false);
  const [sent, setSent] = useState(false);
  const [body, setBody] = useState("");
  const [sending, startSending] = useTransition();

  /*
   * Not a `<form>`. This renders inside the day's own form, and a form inside
   * a form is dropped by the browser without a word — the reply posted the day
   * instead and never reached anybody.
   */
  function send() {
    const data = new FormData();
    data.set("clientId", clientId);
    data.set("noteId", note.id);
    data.set("body", body);
    startSending(async () => {
      await replyToNote(data);
      setSent(true);
    });
  }

  return (
    <li className="rounded-2xl bg-raised p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-faint">
        <MessageSquare className="h-3.5 w-3.5 text-accent" />
        {KIND[note.kind]}
        {note.context ? <span className="truncate font-normal">· {note.context}</span> : null}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text">{note.body}</p>

      {sent ? (
        <p className="mt-3 text-xs font-semibold text-accent">Sent to {firstName}.</p>
      ) : replying ? (
        <div className="mt-3 space-y-2">
          <textarea
            rows={3}
            maxLength={600}
            autoFocus
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={`Reply to ${firstName}…`}
            className="w-full resize-y rounded-2xl bg-overlay px-4 py-3 text-base text-text transition-colors placeholder:text-faint"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={send}
              disabled={sending || body.trim() === ""}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:bg-raised disabled:text-faint sm:flex-none"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send the reply
            </button>
            <button
              type="button"
              onClick={() => setReplying(false)}
              className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setReplying(true)}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-overlay px-4 text-sm font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent"
        >
          <Send className="h-3.5 w-3.5" />
          Reply
        </button>
      )}
    </li>
  );
}
