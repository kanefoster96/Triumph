import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCheck,
  Hourglass,
  Dumbbell,
  LineChart,
  MessageCircle,
  Salad,
} from "lucide-react";
import {
  getCurrentProfile,
  getDashboard,
  getDayProgress,
  getDaySubmissionDetail,
  today,
} from "@/lib/members/service";
import { markCommentsRead, submitDay } from "@/lib/members/actions";
import { CalorieBar, Panel, ScreenTitle } from "@/components/members/ui";
import { CommentThread } from "@/components/members/Comments";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { FinishAnyway } from "@/components/members/FinishAnyway";
import { Avatar } from "@/components/members/Avatar";
import { coach } from "@/lib/data/coach";
import { cn, relativeDate } from "@/lib/utils";

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

  const date = today();
  const [summary, progress, submission] = await Promise.all([
    getDashboard(profile),
    getDayProgress(profile.id, date),
    getDaySubmissionDetail(profile.id, date),
  ]);
  const step = nextStep(summary);
  const firstName = profile.fullName.split(" ")[0];

  const outstanding = [
    progress.workout === "todo" ? "today's workout" : null,
    progress.food === "todo"
      ? `${progress.mealsPlanned - progress.mealsEaten} more meal${
          progress.mealsPlanned - progress.mealsEaten === 1 ? "" : "s"
        }`
      : null,
    progress.weight === "todo" ? "your weight" : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {/*
        Applied and waiting. Without this the dashboard is a set of empty
        cards and no explanation, which reads as a broken app rather than a
        coach who has not answered yet.
      */}
      {profile.status === "applicant" ? (
        <div className="mb-6 rounded-[var(--radius-sheet)] border border-accent/40 bg-accent/[0.06] p-5">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            <Hourglass className="h-3.5 w-3.5" />
            With Dean
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            Your application is in. Dean will review your details and get back to you to propose
            your plan and get you enrolled — until then there is nothing in here to do.
          </p>
        </div>
      ) : null}

      {/* Their face beside their name — the one place in the app that is
          purely theirs rather than a task waiting to be done. */}
      <div className="mb-2 flex items-center gap-4">
        <Avatar name={profile.fullName} src={profile.avatarUrl} size="lg" ring />
        <div className="min-w-0 flex-1">
          <ScreenTitle title={`Morning, ${firstName}`} subtitle={profile.goal ?? undefined} />
        </div>
      </div>

      {/* Three states, one shown: closed out, ready to close, or still asking
          for something — and in that last case it can still be closed. */}
      {submission ? (
        <div
          className={cn(
            "mb-6 rounded-[var(--radius-sheet)] border p-5",
            submission.missed.length > 0
              ? "border-amber/40 bg-amber/[0.06]"
              : "border-success/40 bg-success/[0.06]",
          )}
        >
          <div className="flex flex-wrap items-center gap-4">
            <CheckCheck
              className={cn(
                "h-6 w-6 shrink-0",
                submission.missed.length > 0 ? "text-amber" : "text-success",
              )}
            />
            <div>
              <p
                className={cn(
                  "text-xs font-semibold tracking-[0.14em] uppercase",
                  submission.missed.length > 0 ? "text-amber" : "text-success",
                )}
              >
                Day submitted
              </p>
              <p className="mt-1.5 text-lg font-semibold">
                {submission.missed.length > 0
                  ? "Day closed. Dean has your note."
                  : "Everything Dean asked for, done. He\u2019ll see it at your next check-in."}
              </p>
            </div>
          </div>
          {submission.missed.length > 0 ? (
            <div className="mt-4 rounded-2xl bg-raised p-4">
              <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
                Marked as missed
              </p>
              <p className="mt-1.5 text-sm text-muted">{submission.missed.join(" \u00b7 ")}</p>
              {submission.note ? (
                <p className="mt-3 text-sm leading-relaxed text-text">
                  &ldquo;{submission.note}&rdquo;
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : progress.allDone ? (
        <div className="mb-6 rounded-[var(--radius-sheet)] border border-accent/50 bg-accent/[0.08] p-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            That&rsquo;s the lot
          </p>
          <p className="mt-1.5 text-lg font-semibold">
            Workout in, meals ticked, weight logged. Nothing left today.
          </p>
          <form action={submitDay} className="mt-4">
            <input type="hidden" name="date" value={date} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
            >
              <CheckCheck className="h-4 w-4" />
              Submit my day
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-sheet)] border border-accent/40 bg-accent/[0.06] p-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
                Next step
              </p>
              <p className="mt-1.5 text-lg font-semibold">{step.label}</p>
              {outstanding.length > 0 ? (
                <p className="mt-1 text-sm text-muted">Left today: {outstanding.join(", ")}.</p>
              ) : null}
            </div>
            <Button href={step.href} size="sm">
              {step.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* A day that did not go to plan still has to be closable. Making it
              impossible would only teach them to tick what they did not eat. */}
          {progress.missed.length > 0 ? (
            <FinishAnyway date={date} missed={progress.missed} />
          ) : null}
        </>
      )}

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
                  On your {comment.targetType.replace("_", " ")} note ·{" "}
                  {relativeDate(comment.createdAt.slice(0, 10))}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text">{comment.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Dean's latest word, and the one place the client can answer him
          without having to hang the question on a workout or a food log. */}
      {summary.latestCheckIn ? (
        <div className="mb-6 rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-3 text-base font-semibold">
              {/* From a person, not from the system. */}
              <Avatar name={coach.name} size="sm" />
              Your check-in from {coach.name.split(" ")[0]}
            </h2>
            <span className="text-xs text-faint">
              {relativeDate(summary.latestCheckIn.createdAt.slice(0, 10))} ·{" "}
              {summary.latestCheckIn.outcome === "adjusted" ? "plan adjusted" : "plan carrying on"}
              {summary.latestCheckIn.weeksPlanned > 0
                ? ` for ${summary.latestCheckIn.weeksPlanned} weeks`
                : ""}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-text">{summary.latestCheckIn.note}</p>

          <CommentThread
            comments={summary.checkInComments}
            clientId={profile.id}
            targetType="check_in"
            targetId={summary.latestCheckIn.id}
            canReply
            placeholder="Reply to Dean…"
          />
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
