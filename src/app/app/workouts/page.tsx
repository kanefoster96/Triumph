import { redirect } from "next/navigation";
import { getComments, getCurrentProfile, getWorkouts, commentsFor, today } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { Clock } from "lucide-react";
import { WorkoutChecklist } from "@/components/members/WorkoutChecklist";
import { CommentThread } from "@/components/members/Comments";
import { Chip } from "@/components/ui/Chip";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [workouts, comments] = await Promise.all([getWorkouts(profile.id), getComments(profile.id)]);
  const date = today();
  const todays = workouts.find((w) => w.scheduledFor === date) ?? null;
  const past = workouts.filter((w) => w.scheduledFor !== date);

  return (
    <>
      <ScreenTitle title="Workouts" subtitle="Tick each item off as you go, then leave Dean a note." />

      <div className="space-y-5">
        <Panel
          title={todays ? `Today — ${todays.title}` : "Today"}
          action={
            todays ? (
              <Chip tone={todays.suggestedTime ? "accent" : "default"}>
                <Clock className="h-3 w-3" />
                {todays.suggestedTime ? `Suggested ${todays.suggestedTime}` : "Any time"}
              </Chip>
            ) : null
          }
        >
          {todays ? (
            <>
              {todays.coachNotes ? (
                <div className="mb-5 rounded-2xl bg-raised p-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                    From Dean
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{todays.coachNotes}</p>
                </div>
              ) : null}
              <WorkoutChecklist workout={todays} />
              <CommentThread
                comments={commentsFor(comments, "workout", todays.id)}
                clientId={profile.id}
                targetType="workout"
                targetId={todays.id}
              />
            </>
          ) : (
            <EmptyState>No workout scheduled for today — enjoy the rest day.</EmptyState>
          )}
        </Panel>

        <Panel title="Past workouts">
          {past.length === 0 ? (
            <EmptyState>Your finished workouts will show up here.</EmptyState>
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

                    {workout.clientNote ? (
                      <div className="mt-4 rounded-2xl bg-raised p-4">
                        <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                          Your note
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{workout.clientNote}</p>
                      </div>
                    ) : null}

                    <CommentThread
                      comments={commentsFor(comments, "workout", workout.id)}
                      clientId={profile.id}
                      targetType="workout"
                      targetId={workout.id}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
