import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  commentsFor,
  getComments,
  getFoodLogs,
  getFoodPlan,
  getProfile,
  getSessions,
  getWeightEntries,
  getWorkouts,
  partitionSessions,
  sumCalories,
  today,
} from "@/lib/members/service";
import { saveFoodPlan, saveSession, saveWorkout } from "@/lib/members/actions";
import { CalorieBar, EmptyState, Panel, ScreenTitle, WeightTrend } from "@/components/members/ui";
import { WorkoutChecklist } from "@/components/members/WorkoutChecklist";
import { CommentThread } from "@/components/members/Comments";
import { Chip } from "@/components/ui/Chip";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none";
const label = "mb-2 block text-xs font-semibold tracking-[0.14em] text-faint uppercase";
const submit =
  "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong";

function localDateTime(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

export default async function AdminClientPage({ params }: PageProps<"/admin/clients/[slug]">) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const date = today();
  const [workouts, plan, todaysLogs, weights, sessions, comments] = await Promise.all([
    getWorkouts(profile.id),
    getFoodPlan(profile.id),
    getFoodLogs(profile.id, date),
    getWeightEntries(profile.id),
    getSessions(profile.id),
    getComments(profile.id),
  ]);

  const todaysWorkout = workouts.find((w) => w.scheduledFor === date) ?? null;
  const { upcoming, past: pastSessions } = await partitionSessions(sessions);

  return (
    <>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      <div className="mt-6">
        <ScreenTitle
          title={profile.fullName}
          subtitle={`${profile.goal ?? "No goal set"} · with Dean since ${relativeDate(profile.startedOn)}`}
          action={<Chip tone={profile.status === "active" ? "success" : "default"}>{profile.status}</Chip>}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ------------------------------------------------ Workout */}
        <Panel title="Today's workout">
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
            <EmptyState>Nothing assigned for today.</EmptyState>
          )}

          <form action={saveWorkout} className="mt-6 space-y-4 border-t border-line pt-5">
            <input type="hidden" name="clientId" value={profile.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="w-date">
                  Date
                </label>
                <input id="w-date" className={field} type="date" name="date" defaultValue={date} />
              </div>
              <div>
                <label className={label} htmlFor="w-title">
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
              <label className={label} htmlFor="w-items">
                Checklist — one per line, &ldquo;Exercise — target&rdquo;
              </label>
              <textarea
                id="w-items"
                className={field}
                name="items"
                rows={5}
                defaultValue={todaysWorkout?.items
                  .map((i) => (i.target ? `${i.label} — ${i.target}` : i.label))
                  .join("\n")}
                placeholder={"Back squat — 4 × 5 @ 70kg\nRomanian deadlift — 3 × 8"}
              />
            </div>
            <div>
              <label className={label} htmlFor="w-notes">
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
            <button type="submit" className={submit}>
              {todaysWorkout ? "Update workout" : "Assign workout"}
            </button>
          </form>
        </Panel>

        {/* ------------------------------------------------ Food */}
        <Panel title="Food">
          <CalorieBar total={sumCalories(todaysLogs)} target={plan?.calorieTarget ?? null} />

          {todaysLogs.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {todaysLogs.map((log) => (
                <li key={log.id} className="rounded-2xl border border-line bg-ink p-4">
                  <p className="text-sm font-semibold">{log.calories.toLocaleString("en-GB")} kcal</p>
                  {log.note ? <p className="mt-1 text-sm text-muted">{log.note}</p> : null}
                  <CommentThread
                    comments={commentsFor(comments, "food_log", log.id)}
                    clientId={profile.id}
                    targetType="food_log"
                    targetId={log.id}
                    canReply
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Nothing logged today.</EmptyState>
          )}

          <form action={saveFoodPlan} className="mt-6 space-y-4 border-t border-line pt-5">
            <input type="hidden" name="clientId" value={profile.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="f-cal">
                  Calorie target
                </label>
                <input
                  id="f-cal"
                  className={field}
                  type="number"
                  name="calorieTarget"
                  defaultValue={plan?.calorieTarget ?? ""}
                  placeholder="1950"
                />
              </div>
              <div>
                <label className={label} htmlFor="f-pro">
                  Protein target (g)
                </label>
                <input
                  id="f-pro"
                  className={field}
                  type="number"
                  name="proteinTarget"
                  defaultValue={plan?.proteinTarget ?? ""}
                  placeholder="130"
                />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="f-meals">
                Meals — one per line, &ldquo;Name | ingredients | kcal&rdquo;
              </label>
              <textarea
                id="f-meals"
                className={field}
                name="meals"
                rows={4}
                defaultValue={plan?.meals
                  .map((m) => [m.name, m.ingredients ?? "", m.calories ?? ""].join(" | "))
                  .join("\n")}
                placeholder="Breakfast | 200g yoghurt, berries | 420"
              />
            </div>
            <div>
              <label className={label} htmlFor="f-notes">
                Note
              </label>
              <input id="f-notes" className={field} name="notes" defaultValue={plan?.notes ?? ""} />
            </div>
            <button type="submit" className={submit}>
              Save food plan
            </button>
          </form>
        </Panel>

        {/* ------------------------------------------------ Weight */}
        <Panel title="Weight">
          <WeightTrend entries={weights} />
          {weights.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {weights.slice(0, 5).map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-line bg-ink p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-muted">{relativeDate(entry.loggedFor)}</span>
                    <span className="font-semibold">{entry.weightKg.toFixed(1)}kg</span>
                  </div>
                  {entry.note ? <p className="mt-2 text-sm text-muted">{entry.note}</p> : null}
                  <CommentThread
                    comments={commentsFor(comments, "weight_entry", entry.id)}
                    clientId={profile.id}
                    targetType="weight_entry"
                    targetId={entry.id}
                    canReply
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>

        {/* ------------------------------------------------ Sessions */}
        <Panel title="Sessions">
          {upcoming.length > 0 ? (
            <ul className="space-y-2">
              {upcoming.map((session) => (
                <li key={session.id} className="rounded-2xl border border-line bg-ink p-4">
                  <p className="text-sm font-semibold">
                    {new Date(session.startsAt).toLocaleString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {session.location} · {session.durationMinutes} min
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Nothing scheduled.</EmptyState>
          )}

          <form action={saveSession} className="mt-6 space-y-4 border-t border-line pt-5">
            <input type="hidden" name="clientId" value={profile.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="s-when">
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
                <label className={label} htmlFor="s-loc">
                  Location
                </label>
                <input
                  id="s-loc"
                  className={field}
                  name="location"
                  defaultValue="Online"
                  placeholder="Online or Newcastle"
                />
              </div>
            </div>
            <button type="submit" className={submit}>
              Schedule session
            </button>
          </form>

          {pastSessions.length > 0 ? (
            <div className="mt-6 border-t border-line pt-5">
              <p className={label}>Past sessions</p>
              <ul className="space-y-2">
                {pastSessions.map((session) => (
                    <li key={session.id} className="rounded-2xl border border-line bg-ink p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-muted">
                          {new Date(session.startsAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <Chip>{session.status}</Chip>
                      </div>
                      <form action={saveSession} className="mt-3 flex gap-2">
                        <input type="hidden" name="id" value={session.id} />
                        <input type="hidden" name="clientId" value={profile.id} />
                        <input type="hidden" name="startsAt" value={localDateTime(session.startsAt)} />
                        <input type="hidden" name="location" value={session.location} />
                        <input type="hidden" name="status" value={session.status} />
                        <input
                          name="coachNotes"
                          defaultValue={session.coachNotes ?? ""}
                          placeholder="Session notes for the client…"
                          className="min-w-0 flex-1 rounded-full border border-line bg-ink px-4 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
                        />
                        <button type="submit" className="shrink-0 text-sm font-semibold text-accent">
                          Save
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
