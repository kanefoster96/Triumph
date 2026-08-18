import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { getApplications } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { Avatar } from "@/components/members/Avatar";
import { Chip } from "@/components/ui/Chip";
import { GOAL_LABELS, type Application } from "@/lib/members/types";

export const dynamic = "force-dynamic";

function goalOf(application: Application) {
  return application.goalOther ?? GOAL_LABELS[application.goalType];
}

function sentOn(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * People who have applied to train.
 *
 * There is no basket and no plan they bought — Dean reads what somebody sent
 * and decides. So this is an inbox rather than an order list, and the thing it
 * has to do well is make the pending ones impossible to miss.
 */
export default async function AdminRequestsPage() {
  const applications = await getApplications();
  const pending = applications.filter((entry) => entry.status === "pending");
  const decided = applications.filter((entry) => entry.status !== "pending");

  return (
    <>
      <ScreenTitle
        title="Requests"
        subtitle={
          pending.length === 0
            ? "Nobody waiting."
            : `${pending.length} waiting on you${decided.length > 0 ? ` · ${decided.length} answered` : ""}`
        }
      />

      <div className="space-y-5">
        <Panel title={pending.length === 1 ? "1 waiting" : `${pending.length} waiting`}>
          {pending.length === 0 ? (
            <EmptyState>
              Applications from the website land here. Nothing to read just now.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {pending.map((application) => (
                <li key={application.id}>
                  <Link
                    href={`/admin/requests/${application.id}`}
                    className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-ink p-3 transition-colors hover:border-accent/40"
                  >
                    <Avatar
                      name={application.fullName}
                      src={application.avatarUrl}
                      size="md"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {application.fullName}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {goalOf(application)}
                        {application.currentWeightKg ? ` · ${application.currentWeightKg}kg now` : ""}
                        {application.goalWeightKg ? ` → ${application.goalWeightKg}kg` : ""}
                      </span>
                      <span className="block truncate text-xs text-faint">
                        Sent {sentOn(application.createdAt)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {decided.length > 0 ? (
          <Panel title="Answered">
            <ul className="space-y-2">
              {decided.map((application) => (
                <li key={application.id}>
                  <Link
                    href={`/admin/requests/${application.id}`}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-ink p-3 transition-colors hover:border-accent/40"
                  >
                    <Avatar name={application.fullName} src={application.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {application.fullName}
                    </span>
                    <Chip tone={application.status === "approved" ? "success" : "default"}>
                      {application.status === "approved" ? "Enrolled" : "Declined"}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <p className="inline-flex items-start gap-2 px-1 text-xs leading-relaxed text-faint">
          <Inbox className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Everyone here applied through the website. Enrolling one makes them a client and opens
          their week, ready to build.
        </p>
      </div>
    </>
  );
}
