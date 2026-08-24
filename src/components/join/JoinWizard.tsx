"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Loader2 } from "lucide-react";
import { submitApplication } from "@/lib/members/actions";
import { GOAL_LABELS, type GoalType } from "@/lib/members/types";
import { cn } from "@/lib/utils";

const field =
  "h-12 w-full rounded-2xl bg-raised px-4 text-base text-text transition-colors placeholder:text-faint";
const label = "mb-2 block text-sm font-semibold text-text";
/** Both wizard controls. 44px tall, sized by their own words. */
const pill =
  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";

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
export function JoinWizard({
  demo,
  signedIn = false,
  name = "",
}: {
  demo: boolean;
  /** They already have an account, so there is no second one to make. */
  signedIn?: boolean;
  name?: string;
}) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(name);
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("fitness");
  const [goalOther, setGoalOther] = useState("");
  /** null until they answer — Next waits for it. */
  const [hasGym, setHasGym] = useState<boolean | null>(null);
  const [gymName, setGymName] = useState("");
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

  const goalLabel =
    goalType === "other"
      ? goalOther.trim() || "Something else"
      : GOAL_LABELS[goalType];

  /*
   * The gym question is the one answer that decides whether the coaching can
   * work at all — every workout Dean writes is a gym workout — so step one
   * does not move until it has been given, and "yes" is not an answer without
   * the gym it refers to.
   */
  const gymAnswered = hasGym === false || (hasGym === true && gymName.trim().length > 1);
  const canContinue = step === 0 ? fullName.trim().length > 1 && gymAnswered : true;
  const canSubmit =
    signedIn || (email.trim().includes("@") && password.length >= 6);

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
        <input type="hidden" name="currentWeightKg" value={currentWeight} />
        <input type="hidden" name="goalWeightKg" value={goalWeight} />
        <input type="hidden" name="goalType" value={goalType} />
        <input type="hidden" name="goalOther" value={goalOther} />
        <input type="hidden" name="hasGym" value={hasGym === null ? "" : hasGym ? "yes" : "no"} />
        <input type="hidden" name="gymName" value={hasGym ? gymName : ""} />

        {step === 0 ? (
          <section className="space-y-6">
            <h2 className="text-2xl">First, who are you?</h2>

            <div>
              <label className={label} htmlFor="join-name">
                Your full name
              </label>
              <input
                id="join-name"
                className={field}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                autoFocus
              />
            </div>

            <div>
              <span className={label}>Do you have a gym membership?</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Yes", true],
                  ["No", false],
                ].map(([text, value]) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setHasGym(value as boolean)}
                    aria-pressed={hasGym === value}
                    className={cn(
                      "min-h-14 rounded-2xl px-4 text-sm font-semibold transition-colors",
                      hasGym === value
                        ? "bg-accent/15 text-accent"
                        : "bg-raised text-muted hover:bg-overlay",
                    )}
                  >
                    {text as string}
                  </button>
                ))}
              </div>
            </div>

            {hasGym === true ? (
              <div>
                <label className={label} htmlFor="join-gym">
                  Which gym
                </label>
                <input
                  id="join-gym"
                  className={field}
                  value={gymName}
                  onChange={(event) => setGymName(event.target.value)}
                  maxLength={80}
                  autoFocus
                />
              </div>
            ) : null}

            {/* Said here rather than at the end: somebody without a gym should
                find out what they are signing up to before they have filled
                in three screens, not after. */}
            {hasGym === false ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-sheet)] bg-amber/10 p-4">
                <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <p className="text-sm leading-relaxed text-muted">
                  <span className="font-semibold text-text">
                    You will need access to a gym.
                  </span>{" "}
                  Your sessions are built around gym equipment, so you will
                  need a membership to train the plan as written. Dean can wait
                  until you have one.
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-6">
            <h2 className="text-2xl">What are you after?</h2>

            <div>
              <label className={label} htmlFor="join-weight">
                What you weigh now{" "}
                <span className="font-normal text-faint">— kg, if you know it</span>
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
                      "min-h-14 rounded-2xl px-4 text-sm font-semibold transition-colors",
                      goalType === goal
                        ? "bg-accent/15 text-accent"
                        : "bg-raised text-muted hover:bg-overlay",
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
                  maxLength={120}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <label className={label} htmlFor="join-goal-weight">
                  A weight you have in mind{" "}
                  <span className="font-normal text-faint">— kg, optional</span>
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
                />
              </div>
            )}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-6">
            {/*
             * This used to promise "no gym to get to", which is the opposite
             * of what step one now asks for. Online is about there being no
             * fixed appointment to keep, not about training without equipment.
             */}
            <h2 className="text-2xl">Check it over</h2>

            <dl className="divide-y divide-line rounded-[var(--radius-sheet)] bg-surface px-4">
              {(
                [
                  ["Name", fullName.trim() || "—"],
                  [
                    "Weight now",
                    currentWeight ? `${currentWeight}kg` : "Not said",
                  ],
                  ["Goal", goalLabel],
                  [
                    "Goal weight",
                    goalType === "other"
                      ? "—"
                      : goalWeight
                        ? `${goalWeight}kg`
                        : "Not said",
                  ],
                  ["Gym", hasGym ? gymName.trim() || "Yes" : "Not yet"],
                ] as const
              ).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <dt className="text-sm text-faint">{key}</dt>
                  <dd className="min-w-0 truncate text-sm font-semibold">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Applying is also how most people get an account. Somebody who
                already has one is not asked to make a second. */}
            {signedIn ? null : (
              <div className="space-y-4 rounded-[var(--radius-sheet)] bg-surface p-4">
                <p className="text-sm font-semibold">
                  And an account, so you can see your plan
                </p>
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
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="join-password">
                    Password{" "}
                    <span className="font-normal text-faint">
                      — at least 6 characters
                    </span>
                  </label>
                  <input
                    id="join-password"
                    className={field}
                    type="password"
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {demo ? (
                  <p className="text-xs text-faint">
                    Demo mode — no database is connected, so your password is
                    not stored and signing back in only needs your email.
                  </p>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {/*
         * Two pills on one line, back on the left and forward on the right,
         * the way the steps run.
         *
         * They used to be full-width and stacked, which made going back look
         * like the main thing to do — and `flex-1` inside a *column* sets
         * flex-basis on the height, so it beat the `h-12` and left Next half
         * the height of Back. Neither grows now.
         */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className={cn(pill, "bg-raised text-muted hover:bg-overlay hover:text-text")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            // Holds the right-hand pill on the right on the first step.
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={!canContinue}
              className={cn(
                pill,
                "bg-accent text-accent-ink hover:bg-accent-strong",
                "disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint",
              )}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <SubmitButton disabled={!canSubmit} />
          )}
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
      className={cn(
        pill,
        "bg-accent text-accent-ink hover:bg-accent-strong",
        "disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint",
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      Finish
    </button>
  );
}
