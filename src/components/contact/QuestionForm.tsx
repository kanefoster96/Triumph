"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import { askQuestion } from "@/lib/members/actions";

const field =
  "h-12 w-full rounded-2xl bg-raised px-4 text-base text-text transition-colors placeholder:text-faint";
const label = "mb-2 block text-sm font-semibold text-text";

/**
 * One question, three fields.
 *
 * The form this replaced asked for a goal, an experience level and which
 * programme somebody was interested in — which is an application, and there is
 * already one of those. Somebody who wants to know whether Dean coaches
 * runners should be able to ask in about fifteen seconds.
 *
 * It goes into his requests inbox, in its own list. It used to say "Enquiry
 * sent" and send nothing at all.
 */
export function QuestionForm({ sent, failed }: { sent: boolean; failed: boolean }) {
  if (sent) {
    return (
      <div className="rounded-[var(--radius-sheet)] bg-accent/10 p-6 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-7 w-7 text-accent" />
        </span>
        <h2 className="mt-5 text-2xl">Got it</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Dean reads these himself and usually replies within a working day.
        </p>
      </div>
    );
  }

  return (
    <form
      action={askQuestion}
      className="space-y-5 rounded-[var(--radius-sheet)] bg-surface p-6 sm:p-7"
    >
      <div>
        <h2 className="text-2xl">Ask a question</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Anything you want to know before you start. No account needed, and it is not an
          application.
        </p>
      </div>

      {failed ? (
        <p className="inline-flex items-start gap-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Fill in your name, a real email and your question.
        </p>
      ) : null}

      <div>
        <label className={label} htmlFor="q-name">
          Your name
        </label>
        <input id="q-name" className={field} name="name" required autoComplete="name" />
      </div>

      <div>
        <label className={label} htmlFor="q-email">
          Email
        </label>
        <input
          id="q-email"
          className={field}
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className={label} htmlFor="q-body">
          Your question
        </label>
        <textarea
          id="q-body"
          name="body"
          required
          rows={5}
          maxLength={600}
          placeholder="Do you coach runners? I train around shift work — does that still work?"
          className="w-full resize-y rounded-2xl bg-raised px-4 py-3 text-base text-text transition-colors placeholder:text-faint"
        />
      </div>

      <SendButton />

      <p className="text-xs leading-relaxed text-faint">
        Want a plan rather than an answer?{" "}
        <a href="/join" className="font-semibold text-accent hover:underline">
          Request a free consultation
        </a>{" "}
        instead.
      </p>
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      Send my question
    </button>
  );
}
