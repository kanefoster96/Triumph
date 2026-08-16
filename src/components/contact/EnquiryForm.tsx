"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { EnquiryDraft, EnquiryResult, Level, Programme } from "@/lib/types";
import { submitEnquiry, validateEnquiry } from "@/lib/services/enquiry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const goals = [
  "Lose fat",
  "Get stronger",
  "Build muscle",
  "Get fit for family life",
  "Run faster",
  "Feel better day to day",
];

const coachingTypes = ["Online coaching", "In person (Newcastle)", "Both"];

const levels: Level[] = ["Beginner", "Intermediate", "Advanced"];

const fieldClass =
  "w-full rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-text placeholder:text-faint " +
  "transition-colors duration-200 focus:border-accent focus:outline-none";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold tracking-[0.14em] text-faint uppercase">
      {children}
    </label>
  );
}

/**
 * Enquiry form.
 *
 * Validation and submission both live in `lib/services/enquiry`, so the React
 * Native version of this screen reuses the exact same logic and only swaps the
 * inputs for native ones.
 */
export function EnquiryForm({ programmes }: { programmes: Programme[] }) {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("programme") ?? "";

  const [goal, setGoal] = useState("");
  const [coachingType, setCoachingType] = useState(coachingTypes[0]);
  const [experience, setExperience] = useState<Level>("Beginner");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // The confirmation is shorter than the form, so submitting from halfway down
  // the page can leave it off-screen. Bring it to the user.
  useEffect(() => {
    if (result?.ok) successRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [result]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const draft: EnquiryDraft = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "") || undefined,
      goal,
      programmeSlug: String(form.get("programme") ?? "") || undefined,
      experience,
      coachingType,
      message: String(form.get("message") ?? "") || undefined,
    };

    const found = validateEnquiry(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    try {
      setResult(await submitEnquiry(draft));
    } finally {
      setPending(false);
    }
  }

  if (result?.ok) {
    return (
      <div
        ref={successRef}
        role="status"
        aria-live="polite"
        className="rounded-[var(--radius-sheet)] border border-accent/40 bg-accent/[0.06] p-8 text-center"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
        <h2 className="mt-4 text-2xl">Enquiry sent</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{result.message}</p>
        <p className="mt-4 inline-block rounded-full bg-raised px-4 py-1.5 font-mono text-xs text-faint">
          Ref {result.reference}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[var(--radius-sheet)] border border-line bg-surface p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <input id="name" name="name" autoComplete="name" placeholder="Alex Boateng" className={fieldClass} />
          {errors.name ? <p className="mt-1.5 text-xs text-danger">{errors.name}</p> : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            className={fieldClass}
          />
          {errors.email ? <p className="mt-1.5 text-xs text-danger">{errors.email}</p> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07700 900000"
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="programme">Goal you most relate to</Label>
          <select id="programme" name="programme" defaultValue={preselected} className={cn(fieldClass, "appearance-none")}>
            <option value="">Not sure yet</option>
            {programmes.map((programme) => (
              <option key={programme.slug} value={programme.slug}>
                {programme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
          What are you after?
        </legend>
        <div className="flex flex-wrap gap-2">
          {coachingTypes.map((option) => {
            const selected = coachingType === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setCoachingType(option)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,transform] duration-200 active:scale-95",
                  selected
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line bg-ink text-muted hover:border-accent/50 hover:text-text",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-3 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
          Main goal
        </legend>
        <div className="flex flex-wrap gap-2">
          {goals.map((option) => {
            const selected = goal === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setGoal(option)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,transform] duration-200 active:scale-95",
                  selected
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line bg-ink text-muted hover:border-accent/50 hover:text-text",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
        {errors.goal ? <p className="mt-2 text-xs text-danger">{errors.goal}</p> : null}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-3 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
          Training experience
        </legend>
        <div className="flex gap-1 rounded-full border border-line bg-ink p-1">
          {levels.map((level) => {
            const selected = experience === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={selected}
                onClick={() => setExperience(level)}
                className={cn(
                  "min-w-0 flex-1 truncate rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200",
                  selected ? "bg-accent text-accent-ink" : "text-muted hover:text-text",
                )}
              >
                {level}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <Label htmlFor="message">Anything I should know? (optional)</Label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Injuries, schedule, what you have tried before…"
          className={cn(fieldClass, "resize-y")}
        />
      </div>

      <Button type="submit" size="lg" fullWidth className="mt-7" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending
          </>
        ) : (
          <>
            Send enquiry
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="mt-4 text-center text-xs text-faint">
        I reply to every enquiry personally, usually within one working day.
      </p>
    </form>
  );
}
