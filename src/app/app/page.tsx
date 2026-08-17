import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Dumbbell, LineChart, MessageCircle, Salad } from "lucide-react";
import { getCurrentProfile, getDashboard } from "@/lib/members/service";
import { markCommentsRead } from "@/lib/members/actions";
import { CalorieBar, Panel, ScreenTitle } from "@/components/members/ui";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { relativeDate } from "@/lib/utils";
import type { CommentTarget } from "@/lib/members/types";

export const dynamic = "force-dynamic";

function formatSession(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPlannedDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** A check-in is Dean writing to them; everything else is a reply on a note. */
function commentContext(target: CommentTarget) {
  return target === "check_in" ? "Your weekly check-in" : `On your ${target.replace("_", " ")} note`;
}

/** The one thing to do next, chosen in priority order. */
function nextStep(summary: Awaited<ReturnType<typeof getDashboard>>) {
  if (summary.todaysWorkout && !summary.todaysWorkout.completedAt) {
    return { label: "Today's workout is ready", href: "/app/workouts", cta: "Open workout" };
  }
  if (!summary.latestWeight || summary.latestWeight.loggedFor !== new Date().toISOString().slice(0, 10)) {
    return { label: "Log today's weight", href: "/app/weight", cta: "Log weight" };
  }
  if (summary.foodPlan?.calorieTarget && summary.todaysCalories < summary.foodPlan.calorieTarget) {
    return { label: "Keep your food log up to date", href: "/app/food", cta: "Log food" };
  }
  return { label: "You're on top of everything today", href: "/app/sessions", cta: "See what's next" };
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const summary = await getDashboard(profile);
  const step = nextStep(summary);
  const firstName = profile.fullName.split(" ")[0];

  return (
    <>
      <ScreenTitle title={`Morning, ${firstName}`} subtitle={profile.goal ?? undefined} />

      {/* Always a clear next step. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-sheet)] border border-accent/40 bg-accent/[0.06] p-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Next step</p>
          <p className="mt-1.5 text-lg font-semibold">{step.label}</p>
        </div>
        <Button href={step.href} size="sm">
          {step.cta}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {summary.unreadComments.length > 0 ? (
        <div className="mb-6 rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <MessageCircle className="h-4 w-4 text-accent" />
              New from Dean
            </h2>
            <form action={markCommentsRead}>
              <button type="submit" className="text-xs font-semibold text-muted hover:text-text">
                Mark all read
              </button>
            </form>
          </div>
          <ul className="mt-4 space-y-3">
            {summary.unreadComments.map((comment) => (
              <li key={comment.id} className="rounded-2xl bg-raised p-4">
                <p className="text-xs text-faint">
                  {commentContext(comment.targetType)} · {relativeDate(comment.createdAt.slice(0, 10))}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text">{comment.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Panel
          title="Coming up"
          action={
            <Link href="/app/sessions" className="text-xs font-semibold text-accent">
              See the plan
            </Link>
          }
        >
          {/* An in-person session if there is one, otherwise the next workout —
              most clients are coached online and never have a session. */}
          {summary.nextSession ? (
            <div className="flex items-start gap-4">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-base font-semibold">{formatSession(summary.nextSession.startsAt)}</p>
                <p className="mt-1 text-sm text-muted">With Dean · {summary.nextSession.location}</p>
              </div>
            </div>
          ) : summary.nextWorkout ? (
            <div className="flex items-start gap-4">
              <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-base font-semibold">{summary.nextWorkout.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatPlannedDay(summary.nextWorkout.scheduledFor)}
                  {summary.nextWorkout.suggestedTime
                    ? ` · suggested ${summary.nextWorkout.suggestedTime}`
                    : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-faint">Nothing planned past today yet.</p>
          )}
        </Panel>

        <Panel
          title="Today's workout"
          action={
            <Link href="/app/workouts" className="text-xs font-semibold text-accent">
              Open
            </Link>
          }
        >
          {summary.todaysWorkout ? (
            <div className="flex items-start gap-4">
              <Dumbbell className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-base font-semibold">{summary.todaysWorkout.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {summary.todaysWorkout.items.filter((i) => i.done).length} of{" "}
                  {summary.todaysWorkout.items.length} done
                  {summary.todaysWorkout.suggestedTime
                    ? ` · suggested ${summary.todaysWorkout.suggestedTime}`
                    : ""}
                </p>
                <div className="mt-3">
                  {summary.todaysWorkout.completedAt ? (
                    <Chip tone="accent">Completed</Chip>
                  ) : (
                    <Chip tone="amber">Not finished</Chip>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-faint">Rest day — nothing scheduled.</p>
          )}
        </Panel>

        <Panel
          title="Today's calories"
          action={
            <Link href="/app/food" className="text-xs font-semibold text-accent">
              Log food
            </Link>
          }
        >
          <CalorieBar total={summary.todaysCalories} target={summary.foodPlan?.calorieTarget ?? null} />
          {!summary.foodPlan?.calorieTarget ? (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-faint">
              <Salad className="h-3.5 w-3.5" />
              No target set — Dean will add one.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Latest weight"
          action={
            <Link href="/app/weight" className="text-xs font-semibold text-accent">
              History
            </Link>
          }
        >
          {summary.latestWeight ? (
            <div className="flex items-start gap-4">
              <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-display text-3xl font-bold tracking-tight">
                  {summary.latestWeight.weightKg.toFixed(1)}
                  <span className="text-base font-normal text-faint">kg</span>
                </p>
                <p className="mt-1 text-sm text-muted">{relativeDate(summary.latestWeight.loggedFor)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-faint">No weight logged yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
