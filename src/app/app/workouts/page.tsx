import { redirect } from "next/navigation";
import {
  commentsFor,
  getComments,
  getCurrentProfile,
  getSwapRequests,
  getWorkoutFor,
  getWorkouts,
  shiftDate,
  today,
} from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { ArrowRight, Clock } from "lucide-react";
import { WorkoutChecklist } from "@/components/members/WorkoutChecklist";
import { MoveWorkout } from "@/components/members/MoveWorkout";
import { CommentThread } from "@/components/members/Comments";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const date = today();
  // Today comes through the resolver, so a day the plan generates shows up
  // before it has been started; the history list is what actually happened.
  const [workouts, comments, todays, swaps] = await Promise.all([
    getWorkouts(profile.id),
    getComments(profile.id),
    getWorkoutFor(profile.id, date),
    getSwapRequests(profile.id),
  ]);
  const past = workouts.filter((w) => w.scheduledFor !== date);

  // The next six days, as days rather than dates — "Thursday" is how somebody
  // asks to move a session, not "2026-08-20".
  const moveOptions = Array.from({ length: 6 }, (_, offset) => {
    const on = shiftDate(date, offset + 1);
    return {
      date: on,
      label: new Date(`${on}T12:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "long",
        timeZone: "UTC",
      }),
    };
  });
  const pendingSwap = swaps.find((swap) => swap.fromDate === date && swap.status === "pending") ?? null;
  const answered = swaps.find(
    (swap) => swap.status !== "pending" && swap.decidedAt && swap.fromDate >= shiftDate(date, -7),
  );

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
                  <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">From Dean</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{todays.coachNotes}</p>
                </div>
              ) : null}
              {/* Days built from the library are stepped through set by set;
                  legacy free-text days stay a simple tick list. */}
              {todays.items.some((item) => item.sets.length > 0) ? (
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {todays.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-4 rounded-2xl border border-line bg-ink px-4 py-3"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{item.label}</span>
                          {item.skippedReason ? (
                            <span className="text-xs text-amber">Skipped — {item.skippedReason}</span>
                          ) : (
                            <span className="text-xs text-faint">
                              {item.sets.filter((set) => set.doneAt).length} of {item.sets.length} sets
                            </span>
                          )}
                        </span>
                        {item.done ? <Chip tone="accent">Done</Chip> : null}
                      </li>
                    ))}
                  </ul>
                  <Button href={`/app/workouts/start?date=${todays.scheduledFor}`} size="sm">
                    {todays.completedAt ? "Review workout" : todays.fromPlan ? "Start workout" : "Carry on"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <WorkoutChecklist workout={todays} />
              )}
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

          {/* Only when there is something to move, and only before it has been
              started: a session with sets already logged against it belongs to
              today whatever the plan says. */}
          {todays && !todays.completedAt && todays.items.every((item) => !item.done) ? (
            <div className="mt-5 border-t border-line pt-5">
              <MoveWorkout
                fromDate={date}
                title={todays.title}
                options={moveOptions}
                pending={pendingSwap}
              />
            </div>
          ) : null}

          {answered && !pendingSwap ? (
            <p
              className={`mt-4 text-sm ${answered.status === "approved" ? "text-success" : "text-muted"}`}
            >
              {answered.status === "approved"
                ? `Dean moved ${answered.title ?? "your session"} to ${new Date(`${answered.toDate}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })}.`
                : `Dean would rather keep ${answered.title ?? "that session"} where it is.`}
            </p>
          ) : null}
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
