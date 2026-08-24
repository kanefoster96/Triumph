import Link from "next/link";
import { notFound } from "next/navigation";
import { Salad, Scale } from "lucide-react";
import {
  commentsFor,
  getComments,
  getMealLogs,
  getPlanDay,
  getProfile,
  getSessions,
  getTrainingDates,
  getWeightEntries,
  getWorkoutFor,
  getWorkouts,
  shiftDate,
  today,
} from "@/lib/members/service";
import { EmptyState, Panel } from "@/components/members/ui";
import { MonthCalendar, resolveCalendarParams, type DayMarker } from "@/components/members/MonthCalendar";
import { WorkoutChecklist } from "@/components/members/WorkoutChecklist";
import { CommentThread } from "@/components/members/Comments";
import { Chip } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

/**
 * What they did — read only, on purpose.
 *
 * There is one place to change a plan and this is not it. This answers "how
 * did last Tuesday actually go", which is a different question from "what is
 * Tuesday", and the two used to be the same screen with an editor bolted
 * underneath a record of the past.
 */
export default async function AdminClientHistoryPage({
  params,
  searchParams,
}: PageProps<"/admin/clients/[slug]/history">) {
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

  const monthStart = `${month}-01`;

  const [workout, plannedFood, trainingDates, workouts, sessions, comments, mealLogs, weights] =
    await Promise.all([
      getWorkoutFor(profile.id, selected),
      getPlanDay(profile.id, selected, "food"),
      getTrainingDates(profile.id, monthStart, shiftDate(monthStart, 40)),
      getWorkouts(profile.id),
      getSessions(profile.id),
      getComments(profile.id),
      getMealLogs(profile.id),
      getWeightEntries(profile.id),
    ]);

  const markers: Record<string, DayMarker> = {};
  for (const date of trainingDates) markers[date] = { ...markers[date], workout: true };
  for (const session of sessions) {
    const day = session.startsAt.slice(0, 10);
    markers[day] = { ...markers[day], session: true };
  }

  const eaten = new Set(
    mealLogs.filter((log) => log.loggedFor === selected).map((log) => `${log.slot}:${log.mealId}`),
  );
  const weighed = weights.find((entry) => entry.loggedFor === selected) ?? null;
  const past = workouts.filter((w) => w.scheduledFor < now && w.scheduledFor !== selected).slice(0, 8);

  const selectedLabel = new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    // grid-cols-1 and min-w-0: a track is sized by its own min-content, and
    // the panel headers hold a long date beside a link.
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <Panel title="Calendar" className="min-w-0">
        <MonthCalendar
          month={month}
          selected={selected}
          today={now}
          markers={markers}
          basePath={`/admin/clients/${profile.id}/history`}
        />
      </Panel>

      <div className="min-w-0 space-y-5">
        <Panel
          title={selectedLabel}
          action={
            <Link
              href={`/admin/clients/${profile.id}/plan?date=${selected}#day-${selected}`}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Open this day
            </Link>
          }
        >
          {workout ? (
            <>
              <WorkoutChecklist workout={workout} readOnly />
              <CommentThread
                comments={commentsFor(comments, "workout", workout.id)}
                clientId={profile.id}
                targetType="workout"
                targetId={workout.id}
                canReply
              />
            </>
          ) : (
            <EmptyState>No training on this day.</EmptyState>
          )}
        </Panel>

        <Panel title="Food">
          {plannedFood.meals.length === 0 ? (
            <EmptyState>No meals set for this day.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {plannedFood.meals.map((slot) => {
                const had = eaten.has(`${slot.slot}:${slot.meal.id}`);
                return (
                  <li
                    key={slot.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-raised px-4 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Salad className="h-4 w-4 shrink-0 text-faint" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {slot.meal.name}
                        </span>
                        <span className="text-xs text-faint capitalize">{slot.slot}</span>
                      </span>
                    </span>
                    <Chip tone={had ? "accent" : undefined}>{had ? "Eaten" : "Not ticked"}</Chip>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Weight">
          {weighed ? (
            <p className="flex items-center gap-3 text-sm">
              <Scale className="h-4 w-4 text-faint" />
              <span className="font-display text-2xl font-bold">{weighed.weightKg.toFixed(1)}kg</span>
              {weighed.note ? <span className="text-muted">{weighed.note}</span> : null}
            </p>
          ) : (
            <EmptyState>Nothing logged on this day.</EmptyState>
          )}
        </Panel>

        <Panel title="Recent sessions">
          {past.length === 0 ? (
            <EmptyState>Nothing done yet.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {past.map((entry) => {
                const done = entry.items.filter((i) => i.done).length;
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/admin/clients/${profile.id}/history?date=${entry.scheduledFor}&month=${entry.scheduledFor.slice(0, 7)}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-raised px-4 py-3 transition-colors hover:bg-overlay"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{entry.title}</span>
                        <span className="text-xs text-faint">
                          {new Date(`${entry.scheduledFor}T12:00:00Z`).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            timeZone: "UTC",
                          })}{" "}
                          · {done} of {entry.items.length}
                        </span>
                      </span>
                      <Chip tone={entry.completedAt ? "accent" : "amber"}>
                        {entry.completedAt ? "Done" : "Partial"}
                      </Chip>
                    </Link>
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
