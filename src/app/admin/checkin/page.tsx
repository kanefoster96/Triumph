import Link from "next/link";
import { getCheckInBoard, getDayPlans, getSessionPlans } from "@/lib/members/service";
import { BoardStat, CheckInCard } from "@/components/members/CheckInCard";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** How far back a review looks. Dean picks; a week is the working rhythm. */
const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 28, label: "28 days" },
];

export default async function AdminCheckInPage({ searchParams }: PageProps<"/admin/checkin">) {
  const params = await searchParams;
  const requested = Number(typeof params.days === "string" ? params.days : "");
  const windowDays = WINDOWS.some((w) => w.days === requested) ? requested : 7;

  const [board, sessionPlans, dayPlans] = await Promise.all([
    getCheckInBoard(windowDays),
    getSessionPlans(),
    getDayPlans(),
  ]);

  const needALook = board.filter((row) => row.flags.length > 0);
  const settled = board.filter((row) => row.flags.length === 0);
  const runningOut = board.filter((row) =>
    row.flags.some((f) => f.startsWith("Plan runs out") || f === "Nothing assigned"),
  );

  return (
    <>
      <ScreenTitle
        title="Check-ins"
        subtitle="Everyone at a glance. Read how the week went, then carry the plan on or change it — both send them a note."
        action={
          <nav aria-label="Review window" className="flex items-center gap-1">
            {WINDOWS.map((window) => (
              <Link
                key={window.days}
                href={`/admin/checkin?days=${window.days}`}
                aria-current={window.days === windowDays ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  window.days === windowDays ? "bg-accent/10 text-accent" : "text-muted hover:text-text",
                )}
              >
                {window.label}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <BoardStat
          label="Need a look"
          value={needALook.length}
          tone={needALook.length ? "amber" : undefined}
        />
        <BoardStat label="On track" value={settled.length} />
        <BoardStat
          label="Plans running out"
          value={runningOut.length}
          tone={runningOut.length ? "amber" : undefined}
        />
      </div>

      {board.length === 0 ? (
        <Panel>
          <EmptyState>No clients yet.</EmptyState>
        </Panel>
      ) : (
        <div className="space-y-5">
          {board.map((summary) => (
            <CheckInCard
              key={summary.profile.id}
              summary={summary}
              sessionPlans={sessionPlans}
              dayPlans={dayPlans}
            />
          ))}
        </div>
      )}
    </>
  );
}
