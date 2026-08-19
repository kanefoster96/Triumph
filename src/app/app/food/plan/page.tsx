import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarRange, Lock } from "lucide-react";
import {
  getCurrentProfile,
  getMeals,
  getPlanDay,
  shiftDate,
  today,
} from "@/lib/members/service";
import { saveMyFoodDay } from "@/lib/members/actions";
import {
  Panel,
  ScreenTitle,
  submitButton,
} from "@/components/members/ui";
import { MealPlanner } from "@/components/members/PlanDayEditor";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Today plus a fortnight — far enough to shop for, short enough to stay real. */
const HORIZON = 14;

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function shortLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * The client planning their own food.
 *
 * The same slot editor Dean uses, against the same library — but read-only:
 * they choose meals and portions, never write them. Dean still owns the
 * targets, which is why the day shows what it is aiming at rather than
 * offering it as a field.
 *
 * Only days that have not happened are editable. A finished day is a record of
 * what they ate, and letting it be rewritten would quietly undo the point of
 * tracking it at all.
 */
export default async function MyFoodPlanPage({
  searchParams,
}: PageProps<"/app/food/plan">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  // Coach-planned clients have no business here, whatever the URL says.
  if (profile.foodMode !== "self") redirect("/app/food");

  const query = await searchParams;
  const now = today();
  const requested = typeof query.date === "string" ? query.date : now;
  const selected =
    /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested >= now ? requested : now;

  const [meals, day] = await Promise.all([
    getMeals(),
    getPlanDay(profile.id, selected, "food"),
  ]);

  const days = Array.from({ length: HORIZON }, (_, i) => shiftDate(now, i));

  return (
    <>
      <Link
        href="/app/food"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Food
      </Link>

      <ScreenTitle
        title="Plan your food"
        subtitle="Build your days from my meals. I set what you're aiming at; you decide how to get there."
      />

      <div className="space-y-5">
        <Panel title="Which day">
          <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
            <ul className="flex w-max gap-2">
              {days.map((date) => (
                <li key={date}>
                  <Link
                    href={`/app/food/plan?date=${date}`}
                    aria-current={date === selected ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                      date === selected
                        ? "border-accent bg-accent text-accent-ink"
                        : "border-line bg-ink text-muted hover:text-text",
                    )}
                  >
                    {date === now ? "Today" : shortLabel(date)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-faint">
            <Lock className="h-3.5 w-3.5" />
            Days that have already been are kept as they were.
          </p>
        </Panel>

        <Panel title={dayLabel(selected)}>
          <form action={saveMyFoodDay} className="space-y-4">
            <input type="hidden" name="date" value={selected} />
            {/* Keyed by date: the planner seeds its rows once, so moving to
                  another day has to remount it or yesterday's meals get saved
                  onto tomorrow. */}
            <MealPlanner
              key={selected}
              day={day}
              meals={meals}
              calorieTarget={day.calorieTarget}
              lockTargets
            />
            <button type="submit" className={submitButton}>
              Save this day
            </button>
          </form>
        </Panel>

        <Panel title="A note on the library">
          <p className="inline-flex items-start gap-2 text-sm leading-relaxed text-muted">
            <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
            These are my meals — tap any of them on your food page for
            the amounts and how to make it. If there is something you want that
            is not on the list, ask him at your check-in and he&rsquo;ll add it.
          </p>
        </Panel>
      </div>
    </>
  );
}
