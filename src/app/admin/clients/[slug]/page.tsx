import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Dumbbell, LineChart, MessageCircle } from "lucide-react";
import {
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
import {
  CalorieBar,
  EmptyState,
  Panel,
  field,
  fieldLabel,
  submitButton,
} from "@/components/members/ui";
import { Avatar } from "@/components/members/Avatar";
import { setAvatar, setFoodMode } from "@/lib/members/actions";
import { Chip } from "@/components/ui/Chip";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Mirrors the client's own dashboard, so Dean sees what they see. */
export default async function AdminClientOverviewPage({
  params,
}: PageProps<"/admin/clients/[slug]">) {
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
  const { upcoming } = await partitionSessions(sessions);
  const nextSession = upcoming[0] ?? null;
  const base = `/admin/clients/${profile.id}`;

  // Client notes are where Dean most often needs to respond, so each one links
  // to the day it was left on — where he can read it, reply and change the
  // plan without going looking for the date.
  const recentNotes = [
    ...workouts
      .filter((w) => w.clientNote)
      .map((w) => ({
        id: w.id,
        kind: "Workout" as const,
        date: w.scheduledFor,
        body: w.clientNote as string,
        href: `${base}/plan?date=${w.scheduledFor}#day-${w.scheduledFor}`,
      })),
    ...todaysLogs
      .filter((l) => l.note)
      .map((l) => ({
        id: l.id,
        kind: "Food" as const,
        date: l.loggedFor,
        body: l.note as string,
        href: `${base}/plan?date=${l.loggedFor}#day-${l.loggedFor}`,
      })),
    ...weights
      .filter((w) => w.note)
      .map((w) => ({
        id: w.id,
        kind: "Weight" as const,
        date: w.loggedFor,
        body: w.note as string,
        href: `${base}/plan?date=${w.loggedFor}#day-${w.loggedFor}`,
      })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Panel
        title="Next session"
        action={
          <Link href={`${base}/sessions`} className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-accent">
            Manage
          </Link>
        }
      >
        {nextSession ? (
          <div className="flex items-start gap-4">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-base font-semibold">
                {new Date(nextSession.startsAt).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 text-sm text-muted">
                {nextSession.location} · {nextSession.durationMinutes} minutes
              </p>
            </div>
          </div>
        ) : (
          <EmptyState>Nothing scheduled.</EmptyState>
        )}
      </Panel>

      <Panel
        title="Today's workout"
        action={
          <Link href={`${base}/plan`} className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-accent">
            Edit
          </Link>
        }
      >
        {todaysWorkout ? (
          <div className="flex items-start gap-4">
            <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-base font-semibold">{todaysWorkout.title}</p>
              <p className="mt-1 text-sm text-muted">
                {todaysWorkout.items.filter((i) => i.done).length} of {todaysWorkout.items.length}{" "}
                ticked off
              </p>
              <div className="mt-3">
                {todaysWorkout.completedAt ? (
                  <Chip tone="accent">Completed</Chip>
                ) : (
                  <Chip tone="amber">Not finished</Chip>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState>Nothing assigned for today.</EmptyState>
        )}
      </Panel>

      <Panel
        title="Today's calories"
        action={
          <Link href={`${base}/plan`} className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-accent">
            Open the plan
          </Link>
        }
      >
        <CalorieBar total={sumCalories(todaysLogs)} target={plan?.calorieTarget ?? null} />
        {!plan?.calorieTarget ? (
          <p className="mt-3 text-xs text-faint">No target set for this client yet.</p>
        ) : null}
      </Panel>

      <Panel
        title="Latest weight"
        action={
          <Link href={`${base}/weight`} className="-my-2 inline-flex min-h-11 items-center text-xs font-semibold text-accent">
            History
          </Link>
        }
      >
        {weights[0] ? (
          <div className="flex items-start gap-4">
            <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-display text-3xl font-bold tracking-tight">
                {weights[0].weightKg.toFixed(1)}
                <span className="text-base font-normal text-faint">kg</span>
              </p>
              <p className="mt-1 text-sm text-muted">{relativeDate(weights[0].loggedFor)}</p>
            </div>
          </div>
        ) : (
          <EmptyState>Nothing logged yet.</EmptyState>
        )}
      </Panel>

      <div className="md:col-span-2">
        <Panel title="Who plans the food">
          <form action={setFoodMode} className="space-y-3">
            <input type="hidden" name="clientId" value={profile.id} />
            {(
              [
                ["coach", "You do", "You assign the meals. They follow the finished plan."],
                [
                  "self",
                  "They do",
                  "They build their own week from the meal library, to the targets you set. You can still see and edit it.",
                ],
              ] as const
            ).map(([value, label, blurb]) => (
              <label
                key={value}
                className="flex min-h-14 gap-3 rounded-2xl border border-line bg-ink p-4 has-checked:border-accent has-checked:bg-accent/[0.07]"
              >
                <input
                  type="radio"
                  name="foodMode"
                  value={value}
                  defaultChecked={profile.foodMode === value}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{blurb}</span>
                </span>
              </label>
            ))}
            <button type="submit" className={submitButton}>
              Save this choice
            </button>
          </form>
        </Panel>
      </div>

      <div className="md:col-span-2">
        <Panel title="Photo">
          <form action={setAvatar} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="clientId" value={profile.id} />
            <Avatar name={profile.fullName} src={profile.avatarUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <label className={fieldLabel} htmlFor="avatar-url">
                Link to a photo
              </label>
              <input
                id="avatar-url"
                className={field}
                name="avatarUrl"
                type="url"
                defaultValue={profile.avatarUrl ?? ""}
                placeholder="https://…"
              />
            </div>
            <button type="submit" className={submitButton}>
              Save the photo
            </button>
          </form>
          <p className="mt-3 text-xs text-faint">
            A link for now — uploads arrive with Supabase Storage. Leave it empty and they show as
            their initials, which is the normal case and meant to look that way.
          </p>
        </Panel>

        <Panel title="Recent notes from this client">
          {recentNotes.length === 0 ? (
            <EmptyState>No notes yet.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {recentNotes.map((note) => (
                <li key={`${note.kind}-${note.id}`}>
                  <Link
                    href={note.href}
                    className="flex items-start gap-4 rounded-2xl border border-line bg-ink p-4 transition-colors hover:border-accent/40"
                  >
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="text-xs text-faint">
                        {note.kind} · {relativeDate(note.date)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{note.body}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-faint">
            {comments.length > 0
              ? `${comments.length} comment${comments.length === 1 ? "" : "s"} on this client's entries. Reply from the relevant tab.`
              : "Reply to any note from its tab."}
          </p>
        </Panel>
      </div>
    </div>
  );
}
