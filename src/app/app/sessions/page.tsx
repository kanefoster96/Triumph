import { redirect } from "next/navigation";
import { CalendarDays, Clock, Dumbbell, MapPin } from "lucide-react";
import {
  getCurrentProfile,
  getSessions,
  getTrainingDates,
  getWorkoutFor,
  partitionSessions,
  shiftDate,
  today,
} from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { MonthCalendar, resolveCalendarParams, type DayMarker } from "@/components/members/MonthCalendar";
import { Chip } from "@/components/ui/Chip";
import type { CoachSession, Workout } from "@/lib/members/types";

export const dynamic = "force-dynamic";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/**
 * Workouts and in-person sessions in one list. Most clients are coached online
 * and have only workouts, so the two have to read as one plan rather than as a
 * calendar with an empty half.
 */
type Planned =
  | { kind: "session"; sortKey: string; session: CoachSession }
  | { kind: "workout"; sortKey: string; workout: Workout };

function toPlanned(sessions: CoachSession[], workouts: Workout[]): Planned[] {
  const items: Planned[] = [
    ...sessions.map((session): Planned => ({ kind: "session", sortKey: session.startsAt, session })),
    // No suggested time sorts to the end of its day — it can be done whenever.
    ...workouts.map(
      (workout): Planned => ({
        kind: "workout",
        sortKey: `${workout.scheduledFor}T${workout.suggestedTime ?? "23:59"}`,
        workout,
      }),
    ),
  ];
  return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export default async function SessionsPage({ searchParams }: PageProps<"/app/sessions">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const query = await searchParams;
  const now = today();
  const { month, selected } = resolveCalendarParams(
    {
      month: typeof query.month === "string" ? query.month : undefined,
      date: typeof query.date === "string" ? query.date : undefined,
    },
    now,
  );

  // The plan is generated rather than written out in advance, so the calendar
  // asks for the whole visible month plus the stretch "Coming up" reaches into.
  const monthStart = `${month}-01`;
  const rangeFrom = monthStart < now ? monthStart : now;
  const rangeTo = [shiftDate(monthStart, 40), shiftDate(now, 28)].sort().at(-1) as string;

  const [sessions, trainingDates] = await Promise.all([
    getSessions(profile.id),
    getTrainingDates(profile.id, rangeFrom, rangeTo),
  ]);
  const { past } = await partitionSessions(sessions);

  const markers: Record<string, DayMarker> = {};
  for (const session of sessions) {
    const day = session.startsAt.slice(0, 10);
    markers[day] = { ...markers[day], session: true };
  }
  for (const date of trainingDates) {
    markers[date] = { ...markers[date], workout: true };
  }

  const upcomingDates = trainingDates.filter((d) => d >= now).slice(0, 8);
  const [selectedWorkout, ...upcomingWorkouts] = await Promise.all([
    getWorkoutFor(profile.id, selected),
    ...upcomingDates.map((date) => getWorkoutFor(profile.id, date)),
  ]);

  const onSelectedDay = toPlanned(
    sessions.filter((s) => s.startsAt.slice(0, 10) === selected),
    selectedWorkout ? [selectedWorkout] : [],
  );

  const comingUp = toPlanned(
    sessions.filter((s) => s.status === "scheduled" && s.startsAt.slice(0, 10) >= now),
    upcomingWorkouts.filter((w): w is NonNullable<typeof w> => Boolean(w)),
  ).slice(0, 8);

  return (
    <>
      <ScreenTitle
        title="Sessions"
        subtitle="What I've got you doing, and any sessions with me in person."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <Panel title="Calendar">
          <MonthCalendar
            month={month}
            selected={selected}
            today={now}
            markers={markers}
            basePath="/app/sessions"
          />
        </Panel>

        <div className="space-y-5">
          <Panel title={formatDay(selected)}>
            {onSelectedDay.length === 0 ? (
              <EmptyState>Nothing planned this day.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {onSelectedDay.map((item) =>
                  item.kind === "session" ? (
                    <li key={item.session.id} className="rounded-2xl bg-raised p-4">
                      <div className="flex items-start gap-4">
                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <div>
                          <p className="font-semibold">
                            {new Date(item.session.startsAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            with me
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.session.location} · {item.session.durationMinutes} minutes
                          </p>
                        </div>
                      </div>
                    </li>
                  ) : (
                    <li key={item.workout.id} className="rounded-2xl bg-raised p-4">
                      <div className="flex items-start gap-4">
                        <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                        <div>
                          <p className="font-semibold">{item.workout.title}</p>
                          <p className="mt-1 text-sm text-muted">
                            {item.workout.suggestedTime ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Suggested {item.workout.suggestedTime}
                              </span>
                            ) : (
                              "Any time that suits you"
                            )}
                            {" · "}
                            {item.workout.items.length} exercises
                          </p>
                        </div>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </Panel>

          <Panel title="Coming up">
            {comingUp.length === 0 ? (
              <EmptyState>Nothing here yet — I&rsquo;ll fill your week in.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {comingUp.map((item) =>
                  item.kind === "session" ? (
                    <li
                      key={item.session.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-raised p-5"
                    >
                      <div>
                        <p className="font-semibold">{formatWhen(item.session.startsAt)}</p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.session.location} · {item.session.durationMinutes} minutes
                        </p>
                      </div>
                      <Chip tone="accent">With me</Chip>
                    </li>
                  ) : (
                    <li
                      key={item.workout.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-raised p-5"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{item.workout.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          {formatDay(item.workout.scheduledFor)}
                          {item.workout.suggestedTime ? ` · ${item.workout.suggestedTime}` : ""} ·{" "}
                          {item.workout.items.length} exercises
                        </p>
                      </div>
                      <Chip tone={item.workout.completedAt ? "accent" : "default"}>
                        {item.workout.completedAt ? "Done" : "Workout"}
                      </Chip>
                    </li>
                  ),
                )}
              </ul>
            )}
          </Panel>

          {/* Only rendered for clients who actually train with Dean in person. */}
          {past.length > 0 ? (
            <Panel title="Past sessions">
              <ul className="space-y-3">
                {past.slice(0, 6).map((session) => (
                  <li key={session.id} className="rounded-2xl bg-raised p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-muted">{formatWhen(session.startsAt)}</p>
                        <p className="mt-1 text-sm text-faint">
                          {session.location} · {session.durationMinutes} minutes
                        </p>
                      </div>
                      <Chip tone={session.status === "cancelled" ? "amber" : "default"}>
                        {session.status === "cancelled" ? "Cancelled" : "Completed"}
                      </Chip>
                    </div>

                    {session.coachNotes ? (
                      <div className="mt-4 rounded-2xl bg-overlay p-4">
                        <p className="text-xs font-semibold text-faint">
                          My notes
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{session.coachNotes}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
