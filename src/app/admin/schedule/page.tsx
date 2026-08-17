import Link from "next/link";
import { MapPin, Trash2, Video } from "lucide-react";
import { getAllSessions, getClients, today } from "@/lib/members/service";
import { deleteSession, saveSession } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { MonthCalendar, resolveCalendarParams, type DayMarker } from "@/components/members/MonthCalendar";
import { Chip } from "@/components/ui/Chip";
import { site } from "@/lib/data/site";

export const dynamic = "force-dynamic";

/** Presets for the location picker; anything else goes in the free-text box. */
const LOCATIONS = ["Online", `${site.inPersonArea} — studio`, "Client's gym"];

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function AdminSchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  const params = await searchParams;
  const now = today();
  const { month, selected } = resolveCalendarParams(
    {
      month: typeof params.month === "string" ? params.month : undefined,
      date: typeof params.date === "string" ? params.date : undefined,
    },
    now,
  );

  const [sessions, clients] = await Promise.all([getAllSessions(), getClients()]);

  const markers: Record<string, DayMarker> = {};
  for (const session of sessions) {
    const day = session.startsAt.slice(0, 10);
    markers[day] = { ...markers[day], session: true };
  }

  const onSelectedDay = sessions
    .filter((s) => s.startsAt.slice(0, 10) === selected)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const selectedLabel = new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <>
      <ScreenTitle
        title="Schedule"
        subtitle="Every session across all clients. Pick a day to see it, or add one below."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <Panel title="Calendar">
          <MonthCalendar
            month={month}
            selected={selected}
            today={now}
            markers={markers}
            basePath="/admin/schedule"
          />
        </Panel>

        <div className="space-y-5">
          <Panel title={selectedLabel}>
            {onSelectedDay.length === 0 ? (
              <EmptyState>Nothing booked this day.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {onSelectedDay.map((session) => (
                  <li key={session.id} className="rounded-2xl border border-line bg-ink p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <span className="font-display text-lg font-bold text-accent tabular-nums">
                          {timeOf(session.startsAt)}
                        </span>
                        <div>
                          <Link
                            href={`/admin/clients/${session.clientId}`}
                            className="text-sm font-semibold hover:text-accent"
                          >
                            {session.clientName}
                          </Link>
                          {/* Block-level: an inline-flex here would sit
                              alongside the client-name link above it. */}
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
                            {session.location.toLowerCase() === "online" ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <MapPin className="h-3 w-3" />
                            )}
                            {session.location} · {session.durationMinutes} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip tone={session.status === "scheduled" ? "accent" : "default"}>
                          {session.status}
                        </Chip>
                        <form
                          action={async () => {
                            "use server";
                            await deleteSession(session.id);
                          }}
                        >
                          <button
                            type="submit"
                            aria-label="Remove session"
                            className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Add a session">
            <form action={saveSession} className="space-y-4">
              <input type="hidden" name="date" value={selected} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="sch-client">
                    Client
                  </label>
                  <select id="sch-client" className={field} name="clientId" required>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="sch-time">
                    Time on {selectedLabel}
                  </label>
                  <input
                    id="sch-time"
                    className={field}
                    type="time"
                    name="time"
                    required
                    defaultValue="18:00"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="sch-loc">
                    Location
                  </label>
                  <select id="sch-loc" className={field} name="location" defaultValue="Online">
                    {LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="sch-dur">
                    Minutes
                  </label>
                  <input id="sch-dur" className={field} type="number" name="duration" defaultValue={45} />
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="sch-other">
                  Somewhere else (optional)
                </label>
                <input
                  id="sch-other"
                  className={field}
                  name="locationOther"
                  placeholder="Overrides the picker above"
                />
              </div>

              <button type="submit" className={submitButton}>
                Add to {selectedLabel}
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
