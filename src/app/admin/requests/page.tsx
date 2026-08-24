import Link from "next/link";
import { Check, ChevronRight, Inbox, MessageSquare } from "lucide-react";
import { getApplications, getQuestions } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { Avatar } from "@/components/members/Avatar";
import { Chip } from "@/components/ui/Chip";
import { markQuestionAnswered } from "@/lib/members/actions";
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
  const [applications, questions] = await Promise.all([getApplications(), getQuestions()]);
  const openQuestions = questions.filter((question) => !question.answeredAt);
  const pending = applications.filter((entry) => entry.status === "pending");
  const decided = applications.filter((entry) => entry.status !== "pending");

  return (
    <>
      <ScreenTitle
        title="Requests"
        subtitle={
          pending.length + openQuestions.length === 0
            ? "Nothing waiting on you."
            : [
                pending.length > 0 ? `${pending.length} to enrol` : null,
                openQuestions.length > 0 ? `${openQuestions.length} to answer` : null,
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
                    className="flex min-h-16 items-center gap-3 rounded-2xl bg-raised p-3 transition-colors hover:bg-overlay"
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

        {/* Questions are their own list. Somebody asking whether Dean coaches
            runners has not applied, and one list holding both would make both
            of them useless. */}
        <Panel title="Questions">
          {openQuestions.length === 0 ? (
            <EmptyState>No questions to answer.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {openQuestions.map((question) => (
                <li key={question.id} className="rounded-2xl bg-raised p-4">
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
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-overlay px-4 text-sm font-semibold text-muted transition-colors hover:bg-overlay hover:text-accent"
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
                    className="flex min-h-14 items-center gap-3 rounded-2xl bg-raised p-3 transition-colors hover:bg-overlay"
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
