import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { getCurrentProfile, getLastEfforts, getWorkoutFor, today } from "@/lib/members/service";
import { finishWorkout, logSet, skipExercise, startWorkout } from "@/lib/members/actions";
import { Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** 5 down to 1, most positive first — the order they are shown in. */
const FEELINGS = [
  { value: 5, emoji: "💪", label: "Strong" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 3, emoji: "😐", label: "OK" },
  { value: 2, emoji: "😮‍💨", label: "Hard" },
  { value: 1, emoji: "👎", label: "Bad" },
];

function weightLabel(kg: number | null) {
  if (kg === null) return "—";
  return kg === 0 ? "Bodyweight" : `${kg}kg`;
}

export default async function StartWorkoutPage({ searchParams }: PageProps<"/app/workouts/start">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : today();
  const step = Math.max(0, Number(typeof params.i === "string" ? params.i : 0) || 0);

  const workout = await getWorkoutFor(profile.id, date);
  if (!workout) {
    return (
      <>
        <ScreenTitle title="Nothing to do" subtitle="No workout planned for this day." />
        <Panel>
          <Link href="/app/workouts" className="text-sm font-semibold text-accent">
            Back to workouts
          </Link>
        </Panel>
      </>
    );
  }

  // The plan generates the day; touching it is what turns it into a record.
  if (workout.fromPlan) {
    return (
      <>
        <ScreenTitle title={workout.title} subtitle={workout.coachNotes ?? undefined} />
        <Panel title="Ready when you are">
          <ul className="mb-5 space-y-2">
            {workout.items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-semibold">{item.label}</span>
                <span className="text-faint tabular-nums">
                  {item.sets.length} × {item.sets[0]?.targetReps ?? "—"}
                </span>
              </li>
            ))}
          </ul>
          <form action={startWorkout}>
            <input type="hidden" name="date" value={date} />
            <button type="submit" className={submitButton}>
              Start workout
            </button>
          </form>
        </Panel>
      </>
    );
  }

  const efforts = await getLastEfforts(profile.id);
  const items = workout.items;
  const onFinish = step >= items.length;
  const item = items[Math.min(step, items.length - 1)];
  const last = item.exerciseId ? efforts.get(item.exerciseId) : undefined;

  const href = (index: number) => `/app/workouts/start?date=${date}&i=${index}`;

  if (onFinish) {
    const doneCount = items.filter((i) => i.done).length;
    return (
      <>
        <ScreenTitle title="How did that go?" subtitle={`${doneCount} of ${items.length} finished`} />
        <Panel>
          <form action={finishWorkout} className="space-y-5">
            <input type="hidden" name="workoutId" value={workout.id} />

            <fieldset>
              <legend className={fieldLabel}>How did it feel?</legend>
              <div className="flex flex-wrap gap-2">
                {FEELINGS.map((feeling) => (
                  <label key={feeling.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="feeling"
                      value={feeling.value}
                      aria-label={feeling.label}
                      defaultChecked={feeling.value === 4}
                      className="peer sr-only"
                    />
                    <span className="inline-flex flex-col items-center gap-1 rounded-2xl border border-line px-4 py-3 text-2xl transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                      {feeling.emoji}
                      <span className="text-xs font-semibold text-muted">{feeling.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label className={fieldLabel} htmlFor="finish-note">
                Anything to tell Dean? (optional)
              </label>
              <textarea
                id="finish-note"
                className={field}
                name="note"
                rows={3}
                placeholder="Knee felt tight on the squats, dropped the last set."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className={submitButton}>
                Finish workout
              </button>
              <Link
                href={href(items.length - 1)}
                className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-text"
              >
                Back
              </Link>
            </div>
          </form>
        </Panel>
      </>
    );
  }

  return (
    <>
      <ScreenTitle
        title={item.label}
        subtitle={[item.muscleGroup, item.equipment].filter(Boolean).join(" · ") || undefined}
        action={
          <span className="text-sm text-faint tabular-nums">
            {step + 1} of {items.length}
          </span>
        }
      />

      {item.howTo ? (
        <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-sheet)] border border-line bg-surface p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-muted">{item.howTo}</p>
        </div>
      ) : null}

      {last ? (
        <div className="mb-5 rounded-[var(--radius-sheet)] border border-line bg-surface p-4">
          <p className={fieldLabel}>Last time</p>
          <p className="text-sm text-muted">
            {last.sets.map((set) => `${weightLabel(set.weightKg)} × ${set.reps ?? "—"}`).join("  ·  ")}
            {last.feeling ? `  ·  ${FEELINGS.find((f) => f.value === last.feeling)?.emoji ?? ""}` : ""}
          </p>
        </div>
      ) : null}

      <Panel title={item.skippedReason ? `Skipped — ${item.skippedReason}` : "Sets"}>
        <ul className="space-y-3">
          {item.sets.map((set, index) => (
            <li
              key={set.id}
              className={cn(
                "rounded-2xl border p-4",
                set.doneAt ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-ink",
              )}
            >
              <form action={logSet} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="setId" value={set.id} />

                <span className="w-14 shrink-0">
                  <span className={fieldLabel}>Set</span>
                  <span className="font-display text-lg font-bold tabular-nums">{index + 1}</span>
                </span>

                <div className="w-24">
                  <label className={fieldLabel} htmlFor={`w-${set.id}`}>
                    kg
                  </label>
                  <input
                    id={`w-${set.id}`}
                    className={field}
                    type="number"
                    step="0.5"
                    name="weight"
                    defaultValue={set.actualWeightKg ?? set.targetWeightKg ?? ""}
                  />
                </div>

                <div className="w-24">
                  <label className={fieldLabel} htmlFor={`r-${set.id}`}>
                    reps
                  </label>
                  <input
                    id={`r-${set.id}`}
                    className={field}
                    type="number"
                    name="reps"
                    defaultValue={set.actualReps ?? set.targetReps ?? ""}
                  />
                </div>

                <button
                  type="submit"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                    set.doneAt
                      ? "border border-accent/40 text-accent"
                      : "bg-accent text-accent-ink hover:bg-accent-strong",
                  )}
                >
                  <Check className="h-4 w-4" />
                  {set.doneAt ? "Logged" : "Done"}
                </button>

                <span className="text-xs text-faint">
                  target {weightLabel(set.targetWeightKg)} × {set.targetReps ?? "—"}
                </span>
              </form>
            </li>
          ))}
        </ul>

        <form action={skipExercise} className="mt-5 flex flex-wrap items-end gap-3">
          <input type="hidden" name="itemId" value={item.id} />
          <div className="min-w-0 flex-1">
            <label className={fieldLabel} htmlFor={`skip-${item.id}`}>
              Skip this one
            </label>
            <input
              id={`skip-${item.id}`}
              className={field}
              name="reason"
              placeholder="Rack was taken / shoulder sore"
            />
          </div>
          <button
            type="submit"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-text"
          >
            Skip
          </button>
        </form>
      </Panel>

      <nav className="mt-5 flex items-center justify-between gap-4">
        {step > 0 ? (
          <Link
            href={href(step - 1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {items.map((entry, index) => (
            <span
              key={entry.id}
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                index === step ? "bg-accent" : entry.done ? "bg-muted" : "bg-line",
              )}
            />
          ))}
        </div>

        <Link
          href={href(step + 1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent"
        >
          {step === items.length - 1 ? "Finish" : "Next"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      {item.done ? (
        <p className="mt-4 text-center">
          <Chip tone="accent">All sets logged</Chip>
        </p>
      ) : null}
    </>
  );
}
