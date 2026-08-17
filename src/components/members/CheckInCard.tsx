import Link from "next/link";
import { ArrowRight, MessageSquareText, RefreshCw, SlidersHorizontal } from "lucide-react";
import type { CheckInSummary, DayPlan, SessionPlan } from "@/lib/members/types";
import { recordCheckIn } from "@/lib/members/actions";
import { Chip } from "@/components/ui/Chip";
import { field, fieldLabel, submitButton } from "./ui";
import { cn, relativeDate } from "@/lib/utils";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const WEEK_OPTIONS = [1, 2, 3, 4];

function shortDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** A toggle that works without JavaScript — the checkbox drives the styling. */
function WeekdayChip({ value, label, checked }: { value: number; label: string; checked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name="weekdays"
        value={value}
        aria-label={label}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <span className="inline-flex rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
        {label}
      </span>
    </label>
  );
}

/** The shared tail of both forms: how far ahead, when to look again, the note. */
function DecisionFields({
  id,
  noteLabel,
  placeholder,
  weeksLabel,
}: {
  id: string;
  noteLabel: string;
  placeholder: string;
  weeksLabel: string;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={fieldLabel} htmlFor={`${id}-weeks`}>
            {weeksLabel}
          </label>
          <select id={`${id}-weeks`} name="weeks" className={field} defaultValue="4">
            {WEEK_OPTIONS.map((week) => (
              <option key={week} value={week}>
                {week} week{week === 1 ? "" : "s"}
              </option>
            ))}
            <option value="0">Don&rsquo;t plan anything yet</option>
          </select>
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`${id}-review`}>
            Review again in
          </label>
          <select id={`${id}-review`} name="reviewInDays" className={field} defaultValue="7">
            <option value="7">A week</option>
            <option value="14">A fortnight</option>
            <option value="28">Four weeks</option>
          </select>
        </div>
      </div>

      <div>
        <label className={fieldLabel} htmlFor={`${id}-note`}>
          {noteLabel}
        </label>
        <textarea
          id={`${id}-note`}
          name="note"
          className={field}
          rows={3}
          required
          placeholder={placeholder}
        />
        <p className="mt-2 text-xs text-faint">They see this on their dashboard as new from you.</p>
      </div>
    </>
  );
}

export function CheckInCard({
  summary,
  sessionPlans,
  dayPlans,
}: {
  summary: CheckInSummary;
  sessionPlans: SessionPlan[];
  dayPlans: DayPlan[];
}) {
  const { profile, flags, lastCheckIn, notes, trainingDays } = summary;
  const id = profile.id;
  const settled = flags.length === 0;
  const canContinue = trainingDays.length > 0;
  const patternLabel = trainingDays
    .map((day) => WEEKDAYS.find((w) => w.value === day)?.label)
    .filter(Boolean)
    .join(", ");

  const workoutLabel = summary.workoutsAssigned
    ? `${summary.workoutsCompleted}/${summary.workoutsAssigned}`
    : "—";

  return (
    <article className="rounded-[var(--radius-sheet)] border border-line bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <Link href={`/admin/clients/${id}`} className="text-base font-semibold hover:text-accent">
            {profile.fullName}
          </Link>
          <p className="mt-0.5 text-xs text-faint">
            {summary.plannedThrough
              ? `Planned through ${shortDate(summary.plannedThrough)}`
              : "Nothing assigned yet"}
            {profile.goal ? ` · ${profile.goal}` : ""}
          </p>
        </div>
        <Chip tone={settled ? "success" : "amber"}>{settled ? "On track" : "Needs a look"}</Chip>
      </header>

      <div className="space-y-5 p-5">
        {/* How the window actually went, in one line. */}
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className={fieldLabel}>Workouts</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{workoutLabel}</dd>
          </div>
          <div>
            <dt className={fieldLabel}>Food logged</dt>
            <dd className="font-display text-xl font-bold tabular-nums">
              {summary.foodLoggedDays}
              <span className="text-sm font-normal text-faint">/{summary.windowDays}</span>
            </dd>
          </div>
          <div>
            <dt className={fieldLabel}>Avg calories</dt>
            <dd className="font-display text-xl font-bold tabular-nums">
              {summary.averageCalories ? summary.averageCalories.toLocaleString("en-GB") : "—"}
              {summary.averageCalories && summary.calorieTarget ? (
                <span className="text-sm font-normal text-faint">
                  /{summary.calorieTarget.toLocaleString("en-GB")}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className={fieldLabel}>Weight</dt>
            <dd className="font-display text-xl font-bold tabular-nums">
              {summary.weightChangeKg === null
                ? "—"
                : `${summary.weightChangeKg > 0 ? "+" : ""}${summary.weightChangeKg.toFixed(1)}kg`}
            </dd>
          </div>
        </dl>

        {flags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {flags.map((flag) => (
              <Chip key={flag} tone="amber">
                {flag}
              </Chip>
            ))}
          </div>
        ) : null}

        {notes.length > 0 ? (
          <div className="rounded-2xl border border-line bg-ink p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
              <MessageSquareText className="h-3.5 w-3.5" />
              What they said
            </p>
            <ul className="mt-3 space-y-3">
              {notes.map((note) => (
                <li key={note.id}>
                  <p className="text-xs text-faint">
                    {shortDate(note.on)}
                    {note.context ? ` · ${note.context}` : ""}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text">{note.body}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {lastCheckIn ? (
          <p className="text-xs text-faint">
            Last check-in {relativeDate(lastCheckIn.createdAt.slice(0, 10)).toLowerCase()} ·{" "}
            {lastCheckIn.outcome === "adjusted" ? "adjusted" : "continued"}
            {lastCheckIn.weeksPlanned > 0 ? ` for ${lastCheckIn.weeksPlanned} weeks` : ""} ·{" "}
            <span className="text-muted">&ldquo;{lastCheckIn.note}&rdquo;</span>
          </p>
        ) : (
          <p className="text-xs text-faint">No check-in recorded yet.</p>
        )}

        {/* Both decisions are <details> so the board stays scannable and the
            whole screen still works with no JavaScript. */}
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          <details className="group rounded-2xl border border-line bg-ink">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-text marker:content-none">
              <RefreshCw className="h-4 w-4 text-accent" />
              Continue plan
              <ArrowRight className="ml-auto h-4 w-4 text-faint transition-transform group-open:rotate-90" />
            </summary>
            <form action={recordCheckIn} className="space-y-4 border-t border-line p-4">
              <input type="hidden" name="clientId" value={id} />
              <input type="hidden" name="outcome" value="continued" />
              {canContinue ? (
                <p className="text-sm text-muted">
                  Repeats the week they are already on — <strong>{patternLabel}</strong>. Days that already
                  have a workout are left alone, and their calorie target carries forward on its own.
                </p>
              ) : (
                <p className="text-sm text-amber">
                  Nothing to repeat — they have no workouts in the last fortnight. Use{" "}
                  <strong>Adjust plan</strong> to set one.
                </p>
              )}
              <DecisionFields
                id={`cont-${id}`}
                weeksLabel="Repeat forward"
                noteLabel="Note to them"
                placeholder="All good this week — same plan carrying on. I'll check in again next week."
              />
              <button type="submit" className={submitButton} disabled={!canContinue}>
                Continue and send note
              </button>
            </form>
          </details>

          <details className="group rounded-2xl border border-line bg-ink">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-text marker:content-none">
              <SlidersHorizontal className="h-4 w-4 text-accent" />
              Adjust plan
              <ArrowRight className="ml-auto h-4 w-4 text-faint transition-transform group-open:rotate-90" />
            </summary>
            <form action={recordCheckIn} className="space-y-4 border-t border-line p-4">
              <input type="hidden" name="clientId" value={id} />
              <input type="hidden" name="outcome" value="adjusted" />

              <div>
                <label className={fieldLabel} htmlFor={`adj-${id}-workout`}>
                  Workout plan
                </label>
                <select id={`adj-${id}-workout`} name="workoutPlanId" className={field} defaultValue="">
                  <option value="">Leave workouts as they are</option>
                  {sessionPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className={fieldLabel}>Training days</span>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <WeekdayChip
                      key={day.value}
                      value={day.value}
                      label={day.label}
                      // Start from the days they already train on, so a small
                      // change is a small edit rather than a fresh selection.
                      checked={
                        trainingDays.length > 0
                          ? trainingDays.includes(day.value)
                          : day.value >= 1 && day.value <= 5
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor={`adj-${id}-time`}>
                  Suggested time (optional)
                </label>
                <input id={`adj-${id}-time`} className={field} type="time" name="suggestedTime" />
              </div>

              <div>
                <label className={fieldLabel} htmlFor={`adj-${id}-food`}>
                  Food plan
                </label>
                <select id={`adj-${id}-food`} name="dayPlanId" className={field} defaultValue="">
                  <option value="">Leave food as it is</option>
                  {dayPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-faint">Applies to every day, not just training days.</p>
              </div>

              <DecisionFields
                id={`adj-${id}`}
                weeksLabel="Apply for"
                noteLabel="Note to them"
                placeholder="Dropping you to three days while the school run settles, and I've swapped the salmon out."
              />
              <button type="submit" className={submitButton}>
                Adjust and send note
              </button>
            </form>
          </details>
        </div>
      </div>
    </article>
  );
}

/** Small header stat for the board summary. */
export function BoardStat({ label, value, tone }: { label: string; value: number; tone?: "amber" }) {
  return (
    <div className="rounded-[var(--radius-sheet)] border border-line bg-surface px-5 py-4">
      <p className={fieldLabel}>{label}</p>
      <p className={cn("font-display text-2xl font-bold tabular-nums", tone === "amber" && "text-amber")}>
        {value}
      </p>
    </div>
  );
}
