import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import { getAllSessions, partitionSessions } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { Chip } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

/** Dean's calendar across every client. */
export default async function AdminSchedulePage() {
  const sessions = await getAllSessions();
  const { upcoming, past } = await partitionSessions(sessions);

  const byDay = upcoming.reduce<Record<string, typeof upcoming>>((acc, session) => {
    const day = session.startsAt.slice(0, 10);
    (acc[day] ??= []).push(session);
    return acc;
  }, {});

  return (
    <>
      <ScreenTitle
        title="Schedule"
        subtitle="Every session across all clients. Anything added here shows up in that client's Sessions tab."
      />

      <div className="space-y-5">
        <Panel title="Upcoming">
          {upcoming.length === 0 ? (
            <EmptyState>Nothing scheduled. Add sessions from a client&rsquo;s page.</EmptyState>
          ) : (
            <div className="space-y-6">
              {Object.entries(byDay).map(([day, daySessions]) => (
                <div key={day}>
                  <h3 className="mb-3 text-xs font-semibold tracking-[0.16em] text-faint uppercase">
                    {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <ul className="space-y-2">
                    {daySessions.map((session) => (
                      <li key={session.id}>
                        <Link
                          href={`/admin/clients/${session.clientId}`}
                          className="flex items-center gap-4 rounded-2xl border border-line bg-ink px-4 py-3.5 transition-colors hover:border-accent/40"
                        >
                          <span className="shrink-0 font-display text-lg font-bold text-accent tabular-nums">
                            {new Date(session.startsAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {session.clientName}
                            </span>
                            <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-faint">
                              {session.location.toLowerCase() === "online" ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              {session.location} · {session.durationMinutes} min
                            </span>
                          </span>
                          <Chip tone="accent">Scheduled</Chip>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Past">
          {past.length === 0 ? (
            <EmptyState>No past sessions.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {past.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/admin/clients/${session.clientId}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-ink px-4 py-3.5 transition-colors hover:border-accent/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-muted">
                        {session.clientName}
                      </span>
                      <span className="text-xs text-faint">
                        {new Date(session.startsAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <Chip>{session.status}</Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
