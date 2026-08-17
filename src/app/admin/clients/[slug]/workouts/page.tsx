import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import {
  commentsFor,
  getComments,
  getProfile,
  getSessionPlans,
  getSessions,
  getWorkouts,
  today,
} from "@/lib/members/service";
import { assignSessionPlan, saveWorkout } from "@/lib/members/actions";
import { PlanAssigner } from "@/components/members/PlanAssigner";
import { EmptyState, Panel, field, fieldLabel, submitButton } from "@/components/members/ui";
import { MonthCalendar, resolveCalendarParams, type DayMarker } from "@/components/members/MonthCalendar";
import { WorkoutChecklist } from "@/components/members/WorkoutChecklist";
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

  const [workouts, comments, sessionPlans, sessions] = await Promise.all([
    getWorkouts(profile.id),
    getComments(profile.id),
    getSessionPlans(),
    getSessions(profile.id),
  ]);

  const markers: Record<string, DayMarker> = {};
  for (const workout of workouts) {
    markers[workout.scheduledFor] = { ...markers[workout.scheduledFor], workout: true };
  }
  for (const session of sessions) {
    const day = session.startsAt.slice(0, 10);
    markers[day] = { ...markers[day], session: true };
  }

  const onSelectedDay = workouts.find((w) => w.scheduledFor === selected) ?? null;
  const past = workouts.filter((w) => w.scheduledFor < now && w.scheduledFor !== selected).slice(0, 6);

  const selectedLabel = new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  const basePath = `/admin/clients/${profile.id}/workouts`;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <div className="space-y-5">
        <Panel title="Calendar">
          <MonthCalendar
            month={month}
            selected={selected}
            today={now}
            markers={markers}
            basePath={basePath}
          />
        </Panel>

        <Panel title="Plan ahead">
          <PlanAssigner
            clientId={profile.id}
            today={now}
            plans={sessionPlans}
            action={assignSessionPlan}
            noun="workout"
            emptyHint="No workout plans yet — build one on the Plans page first."
          />
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
              <WorkoutChecklist workout={onSelectedDay} readOnly />
              <CommentThread
                comments={commentsFor(comments, "workout", onSelectedDay.id)}
                clientId={profile.id}
                targetType="workout"
                targetId={onSelectedDay.id}
                canReply
              />
            </>
          ) : (
            <EmptyState>No workout on this day. Assign one below.</EmptyState>
          )}
        </Panel>

        <Panel title={onSelectedDay ? "Edit this day" : "Add a one-off workout"}>
          <form action={saveWorkout} className="space-y-4">
            <input type="hidden" name="clientId" value={profile.id} />
            <input type="hidden" name="date" value={selected} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={fieldLabel} htmlFor="w-title">
                  Title
                </label>
                <input
                  id="w-title"
                  className={field}
                  name="title"
                  defaultValue={onSelectedDay?.title ?? ""}
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
                  defaultValue={onSelectedDay?.suggestedTime ?? ""}
                />
              </div>
            </div>

            <div>
              <label className={fieldLabel} htmlFor="w-items">
                Checklist — one per line, &ldquo;Exercise — target&rdquo;
              </label>
              <textarea
                id="w-items"
                className={field}
                name="items"
                rows={6}
                defaultValue={onSelectedDay?.items
                  .map((i) => (i.target ? `${i.label} — ${i.target}` : i.label))
                  .join("\n")}
                placeholder={"Back squat — 4 × 5 @ 70kg\nRomanian deadlift — 3 × 8 @ 60kg"}
              />
              <p className="mt-2 text-xs text-faint">
                Ticks are kept for any line whose exercise name has not changed.
              </p>
            </div>

            <div>
              <label className={fieldLabel} htmlFor="w-notes">
                Note to client
              </label>
              <textarea
                id="w-notes"
                className={field}
                name="coachNotes"
                rows={2}
                defaultValue={onSelectedDay?.coachNotes ?? ""}
              />
            </div>

            <button type="submit" className={submitButton}>
              {onSelectedDay ? "Update this day" : "Add to this day"}
            </button>
          </form>
        </Panel>

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
  );
}
