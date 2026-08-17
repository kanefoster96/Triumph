import { redirect } from "next/navigation";
import { CalendarDays, Clock, Dumbbell, MapPin, Video } from "lucide-react";
import { getCurrentProfile, getSessions, getWorkouts, partitionSessions, today } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { MonthCalendar, resolveCalendarParams, type DayMarker } from "@/components/members/MonthCalendar";
import { Chip } from "@/components/ui/Chip";

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

  const [sessions, workouts] = await Promise.all([getSessions(profile.id), getWorkouts(profile.id)]);
  const { upcoming, past } = await partitionSessions(sessions);

  const markers: Record<string, DayMarker> = {};
  for (const session of sessions) {
    const day = session.startsAt.slice(0, 10);
    markers[day] = { ...markers[day], session: true };
  }
  for (const workout of workouts) {
    markers[workout.scheduledFor] = { ...markers[workout.scheduledFor], workout: true };
  }

  const daySessions = sessions
    .filter((s) => s.startsAt.slice(0, 10) === selected)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const dayWorkout = workouts.find((w) => w.scheduledFor === selected) ?? null;

  const selectedLabel = new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <>
      <ScreenTitle title="Sessions" subtitle="Your calls and sessions with Dean." />

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
          <Panel title={selectedLabel}>
            {daySessions.length === 0 && !dayWorkout ? (
              <EmptyState>Nothing on this day.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {daySessions.map((session) => (
                  <li key={session.id} className="rounded-2xl border border-line bg-ink p-4">
                    <div className="flex items-start gap-4">
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <div>
                        <p className="font-semibold">
                          {new Date(session.startsAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          with Dean
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                          {session.location.toLowerCase() === "online" ? (
                            <Video className="h-3.5 w-3.5" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5" />
                          )}
                          {session.location} · {session.durationMinutes} minutes
                        </p>
                      </div>
                    </div>
                  </li>
                ))}

                {dayWorkout ? (
                  <li className="rounded-2xl border border-line bg-ink p-4">
                    <div className="flex items-start gap-4">
                      <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                      <div>
                        <p className="font-semibold">{dayWorkout.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          {dayWorkout.suggestedTime ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              Suggested {dayWorkout.suggestedTime}
                            </span>
                          ) : (
                            "Any time that suits you"
                          )}
                          {" · "}
                          {dayWorkout.items.length} exercises
                        </p>
                      </div>
                    </div>
                  </li>
                ) : null}
              </ul>
            )}
          </Panel>

          <Panel title="Upcoming sessions">
            {upcoming.length === 0 ? (
              <EmptyState>Nothing booked in yet.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((session) => (
                  <li key={session.id} className="rounded-2xl border border-line bg-ink p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{formatWhen(session.startsAt)}</p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                          {session.location.toLowerCase() === "online" ? (
                            <Video className="h-3.5 w-3.5" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5" />
                          )}
                          {session.location} · {session.durationMinutes} minutes
                        </p>
                      </div>
                      <Chip tone="accent">Scheduled</Chip>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Past sessions">
            {past.length === 0 ? (
              <EmptyState>No past sessions yet.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {past.map((session) => (
                  <li key={session.id} className="rounded-2xl border border-line bg-ink p-5">
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
                      <div className="mt-4 rounded-2xl bg-raised p-4">
                        <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                          Dean&rsquo;s notes
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{session.coachNotes}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
