import { notFound } from "next/navigation";
import {
  commentsFor,
  getComments,
  getProfile,
  getWorkouts,
  today,
} from "@/lib/members/service";
import { saveWorkout } from "@/lib/members/actions";
import { EmptyState, Panel, field, fieldLabel, submitButton } from "@/components/members/ui";
import { WorkoutChecklist } from "@/components/members/WorkoutChecklist";
import { CommentThread } from "@/components/members/Comments";
import { Chip } from "@/components/ui/Chip";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminClientWorkoutsPage({
  params,
}: PageProps<"/admin/clients/[slug]/workouts">) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const date = today();
  const [workouts, comments] = await Promise.all([getWorkouts(profile.id), getComments(profile.id)]);
  const todaysWorkout = workouts.find((w) => w.scheduledFor === date) ?? null;
  const past = workouts.filter((w) => w.scheduledFor !== date);

  return (
    <div className="space-y-5">
      <Panel title={todaysWorkout ? "Assigned for today" : "Nothing assigned for today"}>
        {todaysWorkout ? (
          <>
            <WorkoutChecklist workout={todaysWorkout} readOnly />
            <CommentThread
              comments={commentsFor(comments, "workout", todaysWorkout.id)}
              clientId={profile.id}
              targetType="workout"
              targetId={todaysWorkout.id}
              canReply
            />
          </>
        ) : (
          <EmptyState>Use the form below to assign one.</EmptyState>
        )}
      </Panel>

      <Panel title={todaysWorkout ? "Edit this workout" : "Assign a workout"}>
        <form action={saveWorkout} className="space-y-4">
          <input type="hidden" name="clientId" value={profile.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="w-date">
                Date
              </label>
              <input id="w-date" className={field} type="date" name="date" defaultValue={date} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="w-title">
                Title
              </label>
              <input
                id="w-title"
                className={field}
                name="title"
                defaultValue={todaysWorkout?.title ?? ""}
                placeholder="Lower body — strength"
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
              defaultValue={todaysWorkout?.items
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
              defaultValue={todaysWorkout?.coachNotes ?? ""}
            />
          </div>
          <button type="submit" className={submitButton}>
            {todaysWorkout ? "Update workout" : "Assign workout"}
          </button>
        </form>
      </Panel>

      <Panel title="History">
        {past.length === 0 ? (
          <EmptyState>No past workouts.</EmptyState>
        ) : (
          <ul className="space-y-4">
            {past.map((workout) => {
              const done = workout.items.filter((i) => i.done).length;
              return (
                <li key={workout.id} className="rounded-2xl border border-line bg-ink p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{workout.title}</p>
                      <p className="mt-1 text-sm text-faint">
                        {relativeDate(workout.scheduledFor)} · {done} of {workout.items.length} done
                      </p>
                    </div>
                    <Chip tone={workout.completedAt ? "accent" : "amber"}>
                      {workout.completedAt ? "Completed" : "Partly done"}
                    </Chip>
                  </div>

                  <ul className="mt-4 space-y-1.5">
                    {workout.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-sm">
                        <span className={item.done ? "text-accent" : "text-faint"}>
                          {item.done ? "✓" : "○"}
                        </span>
                        <span className={item.done ? "text-muted" : "text-faint"}>
                          {item.label}
                          {item.target ? ` — ${item.target}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {workout.clientNote ? (
                    <div className="mt-4 rounded-2xl bg-raised p-4">
                      <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                        Their note
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{workout.clientNote}</p>
                    </div>
                  ) : null}

                  <CommentThread
                    comments={commentsFor(comments, "workout", workout.id)}
                    clientId={profile.id}
                    targetType="workout"
                    targetId={workout.id}
                    canReply
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
