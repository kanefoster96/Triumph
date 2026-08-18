"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Monitor } from "lucide-react";
import { submitApplication } from "@/lib/members/actions";
import { GOAL_LABELS, type GoalType } from "@/lib/members/types";
import { cn } from "@/lib/utils";

const field =
  "h-12 w-full rounded-2xl border border-line bg-ink px-4 text-base text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none";
const label = "mb-2 block text-sm font-semibold text-text";

const STEPS = ["You", "Your goal", "Confirm"] as const;

const GOALS: GoalType[] = ["muscle", "lose", "fitness", "other"];

/**
 * Applying to train, one question at a time.
 *
 * A single long form is the wrong shape on a phone: it opens on a wall of
 * fields, and the person filling it in cannot tell how much is left. Three
 * screens, one idea each, with the step you are on stated at the top — and
 * every Next puts you back at the top of the page, because arriving halfway
 * down the next question reads as though the form is broken.
 *
 * State lives here rather than in the URL because it is one sitting of four
 * fields; the whole thing posts once, at the end.
 */
export function JoinWizard() {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("fitness");
  const [goalOther, setGoalOther] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /*
   * Back to the top on every move. Arriving halfway down the next question —
   * wherever the last one happened to leave you — reads as though the form is
   * broken.
   *
   * "instant" on purpose: the page sets `scroll-behavior: smooth`, and a
   * half-second glide up while the new step is already on screen is the
   * animation getting in the way of the answer.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const goalLabel = goalType === "other" ? goalOther.trim() || "Something else" : GOAL_LABELS[goalType];

  const canContinue = step === 0 ? fullName.trim().length > 1 : true;
  const canSubmit = email.trim().includes("@") && password.length >= 6;

  return (
    <div>
      {/* Where you are. Three dots would be prettier and say less. */}
      <ol className="flex items-center gap-2">
        {STEPS.map((name, index) => (
          <li key={name} className="flex flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1 rounded-full transition-colors",
                index <= step ? "bg-accent" : "bg-line",
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold",
                index === step ? "text-accent" : "text-faint",
              )}
            >
              {name}
            </span>
          </li>
        ))}
      </ol>

      <form action={submitApplication} className="mt-7">
        {/* Every answer travels with the submit, whichever step it was given
            on — the steps are a way of asking, not three separate forms. */}
        <input type="hidden" name="fullName" value={fullName} />
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <input type="hidden" name="currentWeightKg" value={currentWeight} />
        <input type="hidden" name="goalWeightKg" value={goalWeight} />
        <input type="hidden" name="goalType" value={goalType} />
        <input type="hidden" name="goalOther" value={goalOther} />

        {step === 0 ? (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl">First, who are you?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Just a name to put to the plan. Everything else comes after.
              </p>
            </div>

            <div>
              <label className={label} htmlFor="join-name">
                Your full name
              </label>
              <input
                id="join-name"
                className={field}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Alex Morgan"
                autoComplete="name"
                autoFocus
              />
            </div>

            <div>
              <label className={label} htmlFor="join-photo">
                A photo, if you like{" "}
                <span className="font-normal text-faint">— optional</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-raised text-sm font-semibold text-muted">
                  {avatarUrl.trim() ? (
                    /* A pasted link can point anywhere, so this stays a plain
                       img rather than next/image — no remote host list to keep
                       in step with whatever somebody types. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (fullName.trim()[0] ?? "?").toUpperCase()
                  )}
                </span>
                <input
                  id="join-photo"
                  className={cn(field, "flex-1")}
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://…"
                  inputMode="url"
                />
              </div>
              <p className="mt-2 text-xs text-faint">
                A link for now — uploading from your phone arrives with the rest of the storage.
                Leave it empty and your initials do the job.
              </p>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl">What are you after?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                None of this is binding and none of it is required — it is what Dean reads before he
                builds anything.
              </p>
            </div>

            <div>
              <label className={label} htmlFor="join-weight">
                What you weigh now{" "}
                <span className="font-normal text-faint">— if you know it</span>
              </label>
              <input
                id="join-weight"
                className={field}
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={currentWeight}
                onChange={(event) => setCurrentWeight(event.target.value)}
                placeholder="kg"
              />
            </div>

            <div>
              <span className={label}>What you are aiming at</span>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setGoalType(goal)}
                    aria-pressed={goalType === goal}
                    className={cn(
                      "min-h-14 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                      goalType === goal
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line bg-ink text-muted hover:border-accent/40",
                    )}
                  >
                    {GOAL_LABELS[goal]}
                  </button>
                ))}
              </div>
            </div>

            {goalType === "other" ? (
              <div>
                <label className={label} htmlFor="join-other">
                  Tell him what
                </label>
                <input
                  id="join-other"
                  className={field}
                  value={goalOther}
                  onChange={(event) => setGoalOther(event.target.value)}
                  placeholder="Back to five-a-side without wrecking my knee"
                  maxLength={120}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <label className={label} htmlFor="join-goal-weight">
                  A weight you have in mind{" "}
                  <span className="font-normal text-faint">— optional</span>
                </label>
                <input
                  id="join-goal-weight"
                  className={field}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={goalWeight}
                  onChange={(event) => setGoalWeight(event.target.value)}
                  placeholder="kg"
                />
              </div>
            )}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl">Online coaching, then</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Everything is coached online — your training and your food, planned for you and
                adjusted as you go.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-[var(--radius-sheet)] border border-accent/40 bg-accent/[0.06] p-4">
              <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p className="text-sm leading-relaxed text-muted">
                <span className="font-semibold text-text">Online personal training.</span> No gym to
                get to and no fixed time to be there. Dean builds your week; you follow it wherever
                you train.
              </p>
            </div>

            <dl className="divide-y divide-line rounded-[var(--radius-sheet)] border border-line bg-surface px-4">
              {(
                [
                  ["Name", fullName.trim() || "—"],
                  ["Weight now", currentWeight ? `${currentWeight}kg` : "Not said"],
                  ["Goal", goalLabel],
                  [
                    "Goal weight",
                    goalType === "other" ? "—" : goalWeight ? `${goalWeight}kg` : "Not said",
                  ],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-faint">{key}</dt>
                  <dd className="min-w-0 truncate text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-4 rounded-[var(--radius-sheet)] border border-line bg-surface p-4">
              <p className="text-sm font-semibold">And an account, so you can see your plan</p>
              <div>
                <label className={label} htmlFor="join-email">
                  Email
                </label>
                <input
                  id="join-email"
                  className={field}
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className={label} htmlFor="join-password">
                  Password
                </label>
                <input
                  id="join-password"
                  className={field}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
              {/* Said on the page, not only in the code: nothing about this is
                  a real account system yet. */}
              <p className="text-xs text-faint">
                Demo mode — no database is connected, so your password is not stored and signing
                back in only needs your email. Real accounts arrive with Supabase.
              </p>
            </div>
          </section>
        ) : null}

        {/* Thumb-high and full width, in the order you read them. */}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row-reverse">
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={!canContinue}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <SubmitButton disabled={!canSubmit} />
          )}

          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent sm:flex-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      Send my application
    </button>
  );
}
