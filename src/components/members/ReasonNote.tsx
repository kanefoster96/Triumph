"use client";

import { useRef, useState } from "react";

/**
 * The "what happened" box.
 *
 * The reason matters more than the prose, so the common answers are one tap
 * and the box stays editable underneath. Someone who simply forgot to buy the
 * eggs should be able to say so in a second, without composing a sentence
 * about it — that is what stops the honest answer being the awkward one.
 *
 * Tapping a starter fills the box rather than submitting, so nothing is sent
 * that they have not seen and can still change.
 */
const STARTERS = [
  "Didn't have the ingredients in",
  "Ran out of time",
  "Didn't fancy it",
  "Forgot",
  "Ate something else instead",
  "Not feeling great",
];

export function ReasonNote({ name = "note", id = "reason-note" }: { name?: string; id?: string }) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  function use(starter: string) {
    setValue(starter);
    box.current?.focus();
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold tracking-[0.14em] text-faint uppercase"
      >
        What happened?
      </label>
      <p className="mb-3 text-xs leading-relaxed text-muted">
        Pick one and add to it, or write your own.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {STARTERS.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => use(starter)}
            aria-pressed={value === starter}
            className={
              value === starter
                ? "rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                : "rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
            }
          >
            {starter}
          </button>
        ))}
      </div>

      <textarea
        ref={box}
        id={id}
        name={name}
        rows={3}
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Anything else I should know?"
        className="w-full rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
      />
    </div>
  );
}
