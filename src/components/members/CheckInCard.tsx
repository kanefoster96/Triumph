import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  MessageSquareText,
  RefreshCw,
  Repeat,
  Salad,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import type { CheckInSummary } from "@/lib/members/types";
import { recordCheckIn } from "@/lib/members/actions";
import { commentsFor } from "@/lib/members/service";
import { Avatar } from "./Avatar";
import { Chip } from "@/components/ui/Chip";
import { CommentThread } from "./Comments";
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
function DecisionFields({
  id,
  noteLabel,
  placeholder,
  weeksLabel,
  hideWeeks = false,
}: {
  id: string;
  noteLabel: string;
  placeholder: string;
  weeksLabel: string;
  /**
   * Adjusting no longer writes weeks forward — Dean edits the repeating plan
   * himself, which covers every week until he changes it again. Asking "apply
   * for how long" would be asking about something that no longer happens.
   */
  hideWeeks?: boolean;
}) {
  return (
    <>
      <div className={cn("grid gap-4", !hideWeeks && "sm:grid-cols-2")}>
        {hideWeeks ? (
          <input type="hidden" name="weeks" value="0" />
        ) : (
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
        )}
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

export function CheckInCard({ summary }: { summary: CheckInSummary }) {
  const { profile, flags, lastCheckIn, notes, trainingDays, checkInComments } = summary;
  const missedDays = summary.missedDays;
  const earlier = summary.recentCheckIns.slice(1);
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
    <article
      id={`client-${id}`}
      className="scroll-mt-24 rounded-[var(--radius-sheet)] border border-line bg-surface"
    >
      <header className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4">
        {/* Thirty cards read as a list of names without this — the face is
            what tells him whose week he is about to judge. */}
        <Avatar name={profile.fullName} src={profile.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
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
            <dt className={fieldLabel}>Weight avg</dt>
            <dd className="font-display text-xl font-bold tabular-nums">
              {summary.averageWeightKg === null ? "—" : `${summary.averageWeightKg.toFixed(1)}kg`}
              {summary.weightChangeKg !== null ? (
                <span className="text-sm font-normal text-faint">
                  {" "}
                  {summary.weightChangeKg > 0 ? "+" : ""}
                  {summary.weightChangeKg.toFixed(1)}
                </span>
              ) : null}
            </dd>
            {summary.weightChangeKg !== null ? (
              <p className="mt-0.5 text-xs text-faint">vs previous {summary.windowDays} days</p>
            ) : null}
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

        {/* A day they finished with something outstanding. Amber rather than
            red: they turned up and closed the day out honestly, which is the
            behaviour worth keeping — the plan is what needs looking at. */}
        {missedDays.length > 0 ? (
          <div className="rounded-2xl border border-amber/30 bg-amber/[0.05] p-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-amber uppercase">
              <TriangleAlert className="h-3.5 w-3.5" />
              Finished, but missed something
            </p>
            <ul className="mt-3 space-y-3">
              {missedDays.map((day) => (
                <li key={day.onDate}>
                  <p className="text-xs text-faint">
                    {shortDate(day.onDate)} · {day.missed.join(", ")}
                  </p>
                  {day.note ? (
                    <p className="mt-1 text-sm leading-relaxed text-text">
                      &ldquo;{day.note}&rdquo;
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-faint">
              The same meal twice over is a meal to swap, not a discipline problem.
            </p>
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

        {/* "What did I tell them last week?" is the first question of any
            review, so the last one is open and the rest are one click away. */}
        {lastCheckIn ? (
          <div className="rounded-2xl border border-line bg-ink p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
              You said {relativeDate(lastCheckIn.createdAt.slice(0, 10)).toLowerCase()} ·{" "}
              {lastCheckIn.outcome === "adjusted" ? "adjusted" : "continued"}
              {lastCheckIn.weeksPlanned > 0 ? ` ${lastCheckIn.weeksPlanned} weeks` : ""}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text">{lastCheckIn.note}</p>

            <CommentThread
              comments={commentsFor(checkInComments, "check_in", lastCheckIn.id)}
              clientId={id}
              targetType="check_in"
              targetId={lastCheckIn.id}
              canReply
              placeholder={`Reply to ${profile.fullName.split(" ")[0]}…`}
            />

            {earlier.length > 0 ? (
              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-text">
                  Earlier check-ins ({earlier.length})
                </summary>
                <ul className="mt-3 space-y-4">
                  {earlier.map((entry) => {
                    const replies = commentsFor(checkInComments, "check_in", entry.id);
                    return (
                      <li key={entry.id} className="border-l border-line pl-4">
                        <p className="text-xs text-faint">
                          {shortDate(entry.createdAt.slice(0, 10))} ·{" "}
                          {entry.outcome === "adjusted" ? "adjusted" : "continued"}
                          {entry.weeksPlanned > 0 ? ` ${entry.weeksPlanned} weeks` : ""}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{entry.note}</p>
                        {replies.map((reply) => (
                          <p key={reply.id} className="mt-2 text-xs text-faint">
                            <span className="font-semibold text-muted">{reply.authorName}:</span> {reply.body}
                          </p>
                        ))}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-faint">No check-in recorded yet.</p>
        )}

        {/* The change itself happens in the real editors, not here.
            Adjusting used to mean picking a pre-built template and letting it
            overwrite the week — which could not swap one meal, move one day, or
            do any of the things a review actually decides. These open the week
            with their notes at the top and come back when he saves. */}
        <div className="rounded-2xl border border-line bg-ink p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
            Change something
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["The week", `/admin/clients/${id}/plan?review=1`, Repeat],
                ["Workouts", `/admin/clients/${id}/workouts?review=1`, Dumbbell],
                ["Food", `/admin/clients/${id}/food?review=1`, Salad],
              ] as const
            ).map(([label, href, Icon]) => (
              <Link
                key={label}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">
            Each one asks whether a change is just that date or every week from then on.
          </p>
        </div>

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
              <p className="text-sm text-muted">
                Make the change first — the links above open their week with these notes at the top,
                and bring you back here when you save. Then record what you told them.
              </p>
              <DecisionFields
                id={`adj-${id}`}
                weeksLabel=""
                noteLabel="Note to them"
                placeholder="Swapped the salmon for cod from next week, and dropped Friday while the school run settles."
                hideWeeks
              />
              <button type="submit" className={submitButton}>
                Record and send note
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
