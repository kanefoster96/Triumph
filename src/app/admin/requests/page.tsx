import Link from "next/link";
import { Check, ChevronRight, Inbox, MessageSquare } from "lucide-react";
import { getApplications, getChangeRequests, getQuestions } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { Avatar } from "@/components/members/Avatar";
import { Chip } from "@/components/ui/Chip";
import { decideChange, markQuestionAnswered } from "@/lib/members/actions";
import {
  CHANGE_LABELS,
  changeValueLabel,
  GOAL_LABELS,
  type Application,
} from "@/lib/members/types";

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
  const [applications, questions, changes] = await Promise.all([
    getApplications(),
    getQuestions(),
    getChangeRequests(),
  ]);
  const openQuestions = questions.filter((question) => !question.answeredAt);
  const openChanges = changes.filter((change) => change.status === "pending");
  const pending = applications.filter((entry) => entry.status === "pending");
  const decided = applications.filter((entry) => entry.status !== "pending");

  return (
    <>
      <ScreenTitle
        title="Requests"
        subtitle={
          pending.length + openQuestions.length + openChanges.length === 0
            ? "Nothing waiting on you."
            : [
                pending.length > 0 ? `${pending.length} to enrol` : null,
                openChanges.length > 0 ? `${openChanges.length} to answer` : null,
                openQuestions.length > 0 ? `${openQuestions.length} to reply to` : null,
              ]
                .filter(Boolean)
                .join(" · ")
        }
      />

      <div className="space-y-5">
        <Panel title="People who want to train">
          {pending.length === 0 ? (
            <EmptyState>
              Nobody waiting. Anyone who asks for a free consultation on the website turns up here.
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

        {/* A change somebody has asked for. Approving makes it rather than
            reminding him to go and make it — a yes that never reached the
            profile is the failure this is built to avoid. */}
        <Panel title="Changes they've asked for">
          {openChanges.length === 0 ? (
            <EmptyState>Nobody has asked for anything.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {openChanges.map((change) => (
                <li key={change.id} className="rounded-2xl border border-line bg-ink p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={change.clientName} src={change.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{change.clientName}</p>
                      <p className="text-xs text-faint">{CHANGE_LABELS[change.field]}</p>
                      <p className="mt-2 text-sm">
                        {change.currentValue ? (
                          <span className="text-faint line-through">
                            {changeValueLabel(change.field, change.currentValue)}{" "}
                          </span>
                        ) : null}
                        <span className="font-semibold">
                          {changeValueLabel(change.field, change.requestedValue)}
                        </span>
                      </p>
                      {change.reason ? (
                        <p className="mt-2 text-sm leading-relaxed text-muted">{change.reason}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-faint">Asked {sentOn(change.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={decideChange}>
                      <input type="hidden" name="id" value={change.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
                      >
                        <Check className="h-4 w-4" />
                        Make the change
                      </button>
                    </form>
                    <form action={decideChange}>
                      <input type="hidden" name="id" value={change.id} />
                      <input type="hidden" name="decision" value="decline" />
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        Leave it as it is
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Questions are their own list. Somebody asking whether Dean coaches
            runners has not applied, and one list holding both would make both
            of them useless. */}
        <Panel title="Questions">
          {openQuestions.length === 0 ? (
            <EmptyState>No questions to answer.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {openQuestions.map((question) => (
                <li key={question.id} className="rounded-2xl border border-line bg-ink p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{question.name}</p>
                      <a
                        href={`mailto:${question.email}`}
                        className="block truncate text-xs text-accent hover:underline"
                      >
                        {question.email}
                      </a>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{question.body}</p>
                      <p className="mt-2 text-xs text-faint">Asked {sentOn(question.createdAt)}</p>
                    </div>
                  </div>
                  <form action={markQuestionAnswered} className="mt-3">
                    <input type="hidden" name="id" value={question.id} />
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      <Check className="h-4 w-4" />
                      Mark as answered
                    </button>
                  </form>
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
          Everyone here came from the website. Enrolling somebody makes them a client and opens
          their week, ready to build.
        </p>
      </div>
    </>
  );
}
