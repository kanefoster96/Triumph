import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Dumbbell } from "lucide-react";
import {
  getPlanDays,
  getProfile,
  getSessions,
  partitionSessions,
  today,
} from "@/lib/members/service";
import { deleteSession, saveSession } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { Chip } from "@/components/ui/Chip";
import { site } from "@/lib/data/site";

export const dynamic = "force-dynamic";

/** Sessions with a time zone offset stripped, for datetime-local inputs. */
function localDateTime(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminClientSessionsPage({
  params,
}: PageProps<"/admin/clients/[slug]/sessions">) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  /*
   * Online clients have no diary to fill, so this tab used to be an empty
   * booking form for a thing that is never going to happen. What Dean actually
   * wants from it is the same thing — when are they training — so that is what
   * it shows.
   */
  if (profile.coachingMode === "online") {
    const days = (await getPlanDays(profile.id, today(), 21)).filter(
      (day) => !day.workout.isRest && day.workout.exercises.length > 0,
    );

    return (
      <div className="space-y-5">
        <ScreenTitle
          title="Training days"
          subtitle={`${profile.fullName.split(" ")[0]} trains online, so there is nothing in your diary. This is what is on their plan.`}
        />

        <Panel title="Next three weeks">
          {days.length === 0 ? (
            <EmptyState>No training on the plan yet.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {days.map((day) => (
                <li key={day.date}>
                  <Link
                    href={`/admin/clients/${profile.id}/plan?date=${day.date}#day-${day.date}`}
                    className="flex min-h-16 items-center gap-3 rounded-2xl bg-raised px-4 py-3 transition-colors hover:bg-overlay"
                  >
                    <Dumbbell className="h-4 w-4 shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {day.workout.title ?? "Training"}
                      </span>
                      <span className="block text-xs text-faint">
                        {new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                          timeZone: "UTC",
                        })}
                        {" · "}
                        {day.workout.exercises.length}{" "}
                        {day.workout.exercises.length === 1 ? "exercise" : "exercises"}
                      </span>
                    </span>
                    {day.workout.suggestedTime ? (
                      <Chip>
                        <Clock className="h-3 w-3" />
                        {day.workout.suggestedTime}
                      </Chip>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    );
  }

  const { upcoming, past } = await partitionSessions(await getSessions(profile.id));

  return (
    <div className="space-y-5">
      <Panel title="Schedule a session">
        <form action={saveSession} className="space-y-4">
          <input type="hidden" name="clientId" value={profile.id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={fieldLabel} htmlFor="s-when">
                Date and time
              </label>
              <input
                id="s-when"
                className={field}
                type="datetime-local"
                name="startsAt"
                required
                defaultValue={localDateTime(new Date().toISOString())}
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="s-loc">
                Location
              </label>
              <input
                id="s-loc"
                className={field}
                name="location"
                defaultValue={site.inPersonArea}
                placeholder="Where you're meeting"
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="s-dur">
                Minutes
              </label>
              <input id="s-dur" className={field} type="number" name="duration" defaultValue={45} />
            </div>
          </div>
          <button type="submit" className={submitButton}>
            Add to schedule
          </button>
        </form>
      </Panel>

      <Panel title="Upcoming">
        {upcoming.length === 0 ? (
          <EmptyState>Nothing scheduled.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((session) => (
              <li key={session.id} className="rounded-2xl bg-raised p-4">
                <form action={saveSession} className="space-y-3">
                  <input type="hidden" name="id" value={session.id} />
                  <input type="hidden" name="clientId" value={profile.id} />
                  <div className="grid gap-3 sm:grid-cols-4">
                    <input
                      className={field}
                      type="datetime-local"
                      name="startsAt"
                      defaultValue={localDateTime(session.startsAt)}
                      aria-label="Date and time"
                    />
                    <input
                      className={field}
                      name="location"
                      defaultValue={session.location}
                      aria-label="Location"
                    />
                    <input
                      className={field}
                      type="number"
                      name="duration"
                      defaultValue={session.durationMinutes}
                      aria-label="Minutes"
                    />
                    <select
                      className={field}
                      name="status"
                      defaultValue={session.status}
                      aria-label="Status"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <input
                    className={field}
                    name="coachNotes"
                    defaultValue={session.coachNotes ?? ""}
                    placeholder="Notes for the client after the session…"
                    aria-label="Session notes"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" className={submitButton}>
                      Save this session
                    </button>
                    <span className="text-xs text-faint">{formatWhen(session.startsAt)}</span>
                  </div>
                </form>

                <form
                  action={async () => {
                    "use server";
                    await deleteSession(session.id);
                  }}
                  className="mt-3"
                >
                  <button type="submit" className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-danger">
                    Cancel this session
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Past sessions">
        {past.length === 0 ? (
          <EmptyState>No past sessions.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {past.map((session) => (
              <li key={session.id} className="rounded-2xl bg-raised p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-muted">
                    {formatWhen(session.startsAt)}
                  </span>
                  <Chip tone={session.status === "cancelled" ? "amber" : "default"}>
                    {session.status}
                  </Chip>
                </div>
                <form action={saveSession} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={session.id} />
                  <input type="hidden" name="clientId" value={profile.id} />
                  <input type="hidden" name="startsAt" value={localDateTime(session.startsAt)} />
                  <input type="hidden" name="location" value={session.location} />
                  <input type="hidden" name="duration" value={session.durationMinutes} />
                  <input type="hidden" name="status" value={session.status} />
                  <input
                    name="coachNotes"
                    defaultValue={session.coachNotes ?? ""}
                    placeholder="Session notes for the client…"
                    aria-label="Session notes"
                    className="min-w-0 flex-1 rounded-full bg-overlay px-4 py-2 text-sm placeholder:text-faint"
                  />
                  <button type="submit" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-accent">
                    Save this note
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
