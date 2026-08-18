import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarRange, Clock, Repeat, TriangleAlert } from "lucide-react";
import {
  commentsFor,
  dayIndexFor,
  getComments,
  getExercises,
  getLastEfforts,
  getPlanBlock,
  getPlanDay,
  getProfile,
  getRecentNotes,
  getSessions,
  getTrainingDates,
  getWorkoutFor,
  getWorkouts,
  shiftDate,
  today,
} from "@/lib/members/service";
import { savePlanDay } from "@/lib/members/actions";
import { EmptyState, Panel, field, fieldLabel, submitButton } from "@/components/members/ui";
import { MonthCalendar, resolveCalendarParams, type DayMarker } from "@/components/members/MonthCalendar";
import { WorkoutChecklist } from "@/components/members/WorkoutChecklist";
import { ExercisePlanner } from "@/components/members/PlanDayEditor";
import { ReviewBanner } from "@/components/members/ReviewBanner";
import { CommentThread } from "@/components/members/Comments";
import { Chip } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

export default async function AdminClientWorkoutsPage({
  params,
  searchParams,
}: PageProps<"/admin/clients/[slug]/workouts">) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const now = today();
  const { month, selected } = resolveCalendarParams(
    {
      month: typeof query.month === "string" ? query.month : undefined,
      date: typeof query.date === "string" ? query.date : undefined,
    },
    now,
  );

  // The plan generates days rather than writing them out, so the calendar has
  // to ask for the range it is about to draw instead of reading logged rows.
  const monthStart = `${month}-01`;
  const rangeFrom = monthStart < now ? monthStart : now;
  const rangeTo = shiftDate(monthStart, 40);

  const fromReview = query.review === "1";
  const reviewNotes = fromReview ? await getRecentNotes(profile.id) : [];

  const [onSelectedDay, trainingDates, workouts, sessions, comments, block, exercises, efforts] =
    await Promise.all([
      getWorkoutFor(profile.id, selected),
      getTrainingDates(profile.id, rangeFrom, rangeTo),
      getWorkouts(profile.id),
      getSessions(profile.id),
      getComments(profile.id),
      getPlanBlock(profile.id),
      getExercises(),
      getLastEfforts(profile.id),
    ]);

  const markers: Record<string, DayMarker> = {};
  for (const date of trainingDates) markers[date] = { ...markers[date], workout: true };
  for (const session of sessions) {
    const day = session.startsAt.slice(0, 10);
    markers[day] = { ...markers[day], session: true };
  }

  const past = workouts.filter((w) => w.scheduledFor < now && w.scheduledFor !== selected).slice(0, 6);

  // Which day of the repeating cycle this date lands on. Null before the block
  // takes over, or when there is no block at all — neither can be edited here.
  const dayIndex = block ? dayIndexFor(block, selected) : null;
  const planDay = block && dayIndex !== null ? await getPlanDay(block, selected, "workout") : null;
  const editable = planDay !== null && selected >= now;

  const selectedLabel = new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  const basePath = `/admin/clients/${profile.id}/workouts`;
  const planPath = `/admin/clients/${profile.id}/plan`;

  return (
    <>
      {fromReview ? <ReviewBanner clientId={profile.id} notes={reviewNotes} /> : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <div className="space-y-5">
        <Panel title="Calendar">
          <MonthCalendar
            month={month}
            selected={selected}
            today={now}
            markers={markers}
            basePath={basePath}
            carry={fromReview ? { review: "1" } : undefined}
          />
        </Panel>

        <Panel title="The repeating plan">
          {block ? (
            <>
              <p className="text-sm leading-relaxed text-muted">
                A {block.cycleWeeks === 2 ? "two week" : "one week"} block, repeating from{" "}
                {block.startsOn}. This calendar shows what it works out to. Change the shape of the
                week on the Plan tab; change one date here.
              </p>
              <Link
                href={planPath}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent"
              >
                <Repeat className="h-4 w-4" />
                Open the plan
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted">
                No repeating plan yet, so nothing generates past the days already logged. Start one
                and this calendar fills in.
              </p>
              <Link
                href={planPath}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent"
              >
                <Repeat className="h-4 w-4" />
                Start a plan
              </Link>
            </>
          )}
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel
          title={selectedLabel}
          action={
            onSelectedDay?.suggestedTime ? (
              <Chip tone="accent">
                <Clock className="h-3 w-3" />
                {onSelectedDay.suggestedTime}
              </Chip>
            ) : null
          }
        >
          {onSelectedDay ? (
            <>
              {/* Whether this is the plan's answer or what they actually did
                  changes what an edit here will do, so say which it is. */}
              <div className="mb-4">
                {onSelectedDay.fromPlan ? (
                  <Chip tone="accent">
                    <Repeat className="h-3 w-3" />
                    From the plan
                  </Chip>
                ) : (
                  <Chip tone="amber">Set on this date only</Chip>
                )}
              </div>
              {/* Both this and the editor below seed their state from props, so
                  they have to remount when the day underneath them changes —
                  otherwise Dean saves an edit and the page looks unchanged. */}
              <WorkoutChecklist key={onSelectedDay.id} workout={onSelectedDay} readOnly />
              <CommentThread
                comments={commentsFor(comments, "workout", onSelectedDay.id)}
                clientId={profile.id}
                targetType="workout"
                targetId={onSelectedDay.id}
                canReply
              />
            </>
          ) : (
            <EmptyState>
              {/* A rest day is a day with no exercises; the flag is only one of
                  the two ways to say that, so test what actually resolved. */}
              {planDay && (planDay.isRest || planDay.exercises.length === 0)
                ? "Rest day in the plan."
                : "Nothing on this day."}
            </EmptyState>
          )}

          {onSelectedDay && !onSelectedDay.fromPlan && selected >= now ? (
            <p className="mt-4 inline-flex items-start gap-2 text-xs leading-relaxed text-amber">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This day was written individually, so it wins over the plan. Editing below replaces it
              with the plan&rsquo;s version for this date.
            </p>
          ) : null}
        </Panel>

        {editable ? (
          <Panel title={`Edit ${selectedLabel}`}>
            <form action={savePlanDay} className="space-y-4">
              <input type="hidden" name="clientId" value={profile.id} />
              <input type="hidden" name="dayIndex" value={dayIndex as number} />
              <input type="hidden" name="kind" value="workout" />
              <input type="hidden" name="from" value={selected} />
              {fromReview ? <input type="hidden" name="review" value="1" /> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="w-title">
                    Title
                  </label>
                  <input
                    id="w-title"
                    className={field}
                    name="title"
                    defaultValue={planDay.title ?? ""}
                    placeholder="Lower body — strength"
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="w-time">
                    Suggested time (optional)
                  </label>
                  <input
                    id="w-time"
                    className={field}
                    type="time"
                    name="suggestedTime"
                    defaultValue={planDay.suggestedTime ?? ""}
                  />
                </div>
              </div>

              <ExercisePlanner
                key={`${planDay.revisionId ?? "none"}:${selected}`}
                day={planDay}
                exercises={exercises}
              />

              {/* What they managed last time, so a target can be set against
                  something real rather than from memory. */}
              {planDay.exercises.length > 0 ? (
                <ul className="space-y-1.5 rounded-2xl border border-line bg-ink p-4">
                  {planDay.exercises.map((exercise) => {
                    const last = efforts.get(exercise.exerciseId);
                    return (
                      <li key={exercise.id} className="text-xs text-muted">
                        <span className="font-semibold text-text">{exercise.name}</span> —{" "}
                        {last
                          ? `last ${last.on}: ${last.sets
                              .map((set) => `${set.weightKg ?? 0}×${set.reps ?? 0}`)
                              .join("  ")}`
                          : "nothing logged yet"}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <div>
                <label className={fieldLabel} htmlFor="w-notes">
                  Note to client
                </label>
                <textarea
                  id="w-notes"
                  className={field}
                  name="coachNotes"
                  rows={2}
                  defaultValue={planDay.coachNotes ?? ""}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  name="isRest"
                  defaultChecked={planDay.isRest}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Make this a rest day
              </label>

              {/* This screen is date-first, so a one-off leads here — the
                  opposite of the Plan tab, where the week is the subject. */}
              <div className="rounded-2xl border border-line bg-ink p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                  <CalendarRange className="h-3.5 w-3.5" />
                  How far does this reach?
                </p>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-3 text-sm text-muted">
                    <input
                      type="radio"
                      name="scope"
                      value="date"
                      defaultChecked
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    Just {selectedLabel}
                  </label>
                  <label className="flex items-center gap-3 text-sm text-muted">
                    <input
                      type="radio"
                      name="scope"
                      value="weekday"
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    Every {selectedLabel.split(" ")[0]} from here on
                  </label>
                </div>
                <p className="mt-3 text-xs text-faint">
                  Days already gone are never changed, and nothing the client has already logged is
                  overwritten.
                </p>
              </div>

              <button type="submit" className={submitButton}>
                Save this day
              </button>
            </form>
          </Panel>
        ) : (
          <Panel title="Editing">
            <EmptyState>
              {selected < now
                ? "This day has been and gone. Past days are kept as they were."
                : !block
                  ? "Start a repeating plan and days become editable from here."
                  : "This date is before the plan takes over, so there is nothing to edit."}
            </EmptyState>
          </Panel>
        )}

        <Panel title="Recent history">
          {past.length === 0 ? (
            <EmptyState>No past workouts.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {past.map((workout) => {
                const done = workout.items.filter((i) => i.done).length;
                return (
                  <li
                    key={workout.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-ink px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{workout.title}</span>
                      <span className="text-xs text-faint">
                        {new Date(`${workout.scheduledFor}T12:00:00Z`).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          timeZone: "UTC",
                        })}{" "}
                        · {done} of {workout.items.length}
                      </span>
                    </span>
                    <Chip tone={workout.completedAt ? "accent" : "amber"}>
                      {workout.completedAt ? "Done" : "Partial"}
                    </Chip>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
      </div>
    </>
  );
}
