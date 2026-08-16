import { redirect } from "next/navigation";
import { CalendarDays, MapPin, Video } from "lucide-react";
import { getCurrentProfile, getSessions, partitionSessions } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
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

export default async function SessionsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const sessions = await getSessions(profile.id);
  const { upcoming, past } = await partitionSessions(sessions);

  return (
    <>
      <ScreenTitle title="Sessions" subtitle="Your calls and sessions with Dean." />

      <div className="space-y-5">
        <Panel title="Upcoming">
          {upcoming.length === 0 ? (
            <EmptyState>Nothing booked in yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((session) => (
                <li key={session.id} className="rounded-2xl border border-line bg-ink p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
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
    </>
  );
}
