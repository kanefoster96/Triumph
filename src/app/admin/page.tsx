import Link from "next/link";
import { ArrowRight, LayoutGrid, Rows3 } from "lucide-react";
import {
  getComplianceBoard,
  getPendingSwaps,
  listClients,
  mondayOf,
  shiftDate,
  today,
} from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/members/Avatar";
import { ComplianceGrid } from "@/components/members/ComplianceGrid";
import { SwapRequests } from "@/components/members/SwapRequests";
import { cn, relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Dean's home.
 *
 * The grid is the default because the question on a Monday is "who has gone
 * quiet", and thirty cards is thirty scroll-lengths before that has an answer.
 * The cards are still here — they carry today's numbers rather than the week's
 * shape — so the view is a toggle rather than a replacement.
 */
export default async function AdminClientsPage({ searchParams }: PageProps<"/admin">) {
  const query = await searchParams;
  const asCards = query.view === "cards";

  const now = today();
  const weekStart = mondayOf(now);
  const [clients, board, swaps] = await Promise.all([
    listClients(),
    asCards ? Promise.resolve([]) : getComplianceBoard(weekStart),
    getPendingSwaps(),
  ]);

  const active = clients.filter((client) => client.profile.status === "active").length;
  const weekLabel = `${new Date(`${weekStart}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" })} – ${new Date(`${shiftDate(weekStart, 6)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`;

  return (
    <>
      <ScreenTitle
        title="Clients"
        subtitle={`${active} active${asCards ? "" : ` · this week, ${weekLabel}`}`}
        action={
          <div className="flex items-center gap-1 rounded-full bg-raised p-1">
            {(
              [
                ["", "Week", Rows3],
                ["cards", "Cards", LayoutGrid],
              ] as const
            ).map(([view, label, Icon]) => {
              const on = view === "cards" ? asCards : !asCards;
              return (
                <Link
                  key={label}
                  href={view ? `/admin?view=${view}` : "/admin"}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    on ? "bg-accent text-accent-ink" : "text-muted hover:text-text",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        }
      />

      <SwapRequests requests={swaps} />

      {!asCards ? (
        <Panel>
          <ComplianceGrid rows={board} weekStart={weekStart} />
        </Panel>
      ) : clients.length === 0 ? (
        <EmptyState>No clients yet.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* grid-cols-1 rather than a bare `grid`: an auto track is sized by
              the card's min-content, and the truncating name line is nowrap,
              so the track grew past the viewport once the avatar took up its
              44px. minmax(0,1fr) plus min-w-0 lets the card shrink instead. */}
          {clients.map((client) => (
            <li key={client.profile.id} className="min-w-0">
              <Link
                href={`/admin/clients/${client.profile.id}`}
                className="group flex h-full flex-col rounded-[var(--radius-sheet)] bg-surface p-5 transition-colors hover:bg-overlay"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={client.profile.fullName}
                    src={client.profile.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{client.profile.fullName}</p>
                    {client.profile.goal ? (
                      /* Wraps rather than truncating: the avatar takes width
                         off this line, and the goal is the one thing on the
                         card that says who Dean is about to open. */
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{client.profile.goal}</p>
                    ) : null}
                  </div>
                  {client.profile.status === "paused" ? (
                    <Chip>Paused</Chip>
                  ) : (
                    <Chip tone={client.onTrack ? "success" : "amber"}>
                      {client.onTrack ? "On track" : "Quiet"}
                    </Chip>
                  )}
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <dt className="text-[11px] text-faint">Workout</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {client.todaysWorkoutDone ? (
                        <span className="text-accent">Done</span>
                      ) : client.todaysWorkoutProgress ? (
                        <span className="text-muted">
                          {client.todaysWorkoutProgress.done}/{client.todaysWorkoutProgress.total}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-faint">Calories</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {client.todaysCalories > 0 ? client.todaysCalories.toLocaleString("en-GB") : "—"}
                      {client.calorieTarget ? (
                        <span className="font-normal text-faint">/{client.calorieTarget}</span>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-faint">Weight</dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {client.latestWeight ? `${client.latestWeight.weightKg.toFixed(1)}kg` : "—"}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 flex items-center justify-between text-xs text-faint">
                  <span>
                    {client.lastActivityAt
                      ? `Last active ${relativeDate(client.lastActivityAt.slice(0, 10))}`
                      : "No activity yet"}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
