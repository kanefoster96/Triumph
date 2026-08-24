import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, CreditCard, Monitor, Users, X } from "lucide-react";
import { getApplication } from "@/lib/members/service";
import { decideApplication } from "@/lib/members/actions";
import { isPaymentsConfigured } from "@/lib/services/payments";
import { Panel } from "@/components/members/ui";
import { Avatar } from "@/components/members/Avatar";
import { Chip } from "@/components/ui/Chip";
import { goalPhrase } from "@/lib/members/types";

export const dynamic = "force-dynamic";

/**
 * One application, and the decision on it.
 *
 * Enrolling is the whole point of the screen, so it is the only accent button
 * and it does the thing rather than opening something else: the account
 * becomes a client and the page that opens is their week, waiting to be built.
 */
export default async function AdminRequestPage({ params }: PageProps<"/admin/requests/[id]">) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const goal = goalPhrase(application.goalTypes, { other: application.goalOther });
  const pending = application.status === "pending";

  const rows: Array<[string, string]> = [
    ["Goal", goal],
    // Three answers, not two: an application sent before the question existed
    // said neither, and must not be read as "no".
    [
      "Gym",
      application.hasGym === null
        ? "Not asked"
        : application.hasGym
          ? application.gymName || "Yes"
          : "No — told they will need one",
    ],
    ["Weight now", application.currentWeightKg ? `${application.currentWeightKg}kg` : "Not said"],
    ["Goal weight", application.goalWeightKg ? `${application.goalWeightKg}kg` : "Not said"],
    ["Email", application.email],
    [
      "Applied",
      new Date(application.createdAt).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    ],
  ];

  return (
    <>
      <Link
        href="/admin/requests"
        className="-my-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        All requests
      </Link>

      <div className="mt-4 flex items-center gap-3 sm:mt-6 sm:gap-4">
        <Avatar name={application.fullName} src={application.avatarUrl} size="md" className="sm:hidden" />
        <Avatar
          name={application.fullName}
          src={application.avatarUrl}
          size="lg"
          className="hidden sm:grid"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 truncate text-xl sm:text-3xl">{application.fullName}</h1>
            <Chip
              tone={pending ? "amber" : application.status === "approved" ? "success" : "default"}
            >
              {pending ? "Waiting" : application.status === "approved" ? "Enrolled" : "Declined"}
            </Chip>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">Applied through the website</p>
        </div>
      </div>

      <div className="mt-5 space-y-5 sm:mt-8">
        <Panel title="What they sent">
          <dl className="divide-y divide-line">
            {rows.map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
                <dt className="shrink-0 text-sm text-faint">{key}</dt>
                <dd className="min-w-0 text-right text-sm font-semibold break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {pending ? (
          <Panel title="Take them on">
            {/*
              How he coaches them, chosen where he decides to take them on —
              it is the same question and asking it twice would be one screen
              too many. Either way they get the whole app; 1-to-1 adds sessions
              in his diary on top.
            */}
            <form action={decideApplication} className="space-y-4">
              <input type="hidden" name="id" value={application.id} />
              <input type="hidden" name="decision" value="approve" />

              <div className="space-y-2">
                {(
                  [
                    ["online", "Online", "You plan their week. No sessions in the diary.", Monitor],
                    [
                      "one_to_one",
                      "1-to-1",
                      "Same plan, plus sessions you book with them.",
                      Users,
                    ],
                  ] as const
                ).map(([value, title, hint, Icon], index) => (
                  <label
                    key={value}
                    className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl bg-raised p-4 transition-colors hover:bg-overlay has-checked:bg-accent/10"
                  >
                    <input
                      type="radio"
                      name="coaching"
                      value={value}
                      defaultChecked={index === 0}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                    />
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="block text-xs text-faint">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
              >
                <Check className="h-4 w-4" />
                Enrol {application.fullName.split(" ")[0]}
              </button>
              <p className="text-xs text-faint">
                Opens their week, ready to build. Nothing is charged.
              </p>
            </form>

            <form action={decideApplication} className="mt-4">
              <input type="hidden" name="id" value={application.id} />
              <input type="hidden" name="decision" value="decline" />
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-raised px-5 text-sm font-semibold text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <X className="h-4 w-4" />
                Not right now
              </button>
            </form>
          </Panel>
        ) : (
          <Panel title="Your answer">
            <p className="text-sm text-muted">
              {application.status === "approved"
                ? "Enrolled."
                : "Turned down."}{" "}
              {application.decidedAt
                ? new Date(application.decidedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                  })
                : null}
              {application.status === "approved" ? (
                <>
                  {" "}
                  <Link
                    href={`/admin/clients/${application.accountId}/plan`}
                    className="font-semibold text-accent hover:underline"
                  >
                    Open their week
                  </Link>
                  .
                </>
              ) : null}
            </p>
          </Panel>
        )}

        {/*
          The payment seam, said out loud.

          Enrolling and charging are separate on purpose — Dean agrees a price
          with somebody rather than selling them a tier — so this is where
          Stripe goes and it is disabled until it is there. A button that
          looked live and did nothing would be worse than one that says so.
        */}
        <Panel title="Payment">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-raised px-5 text-sm font-semibold text-faint"
            >
              <CreditCard className="h-4 w-4" />
              Take payment — Stripe (coming soon)
            </button>
            <Chip tone="amber">{isPaymentsConfigured() ? "Ready" : "Not set up yet"}</Chip>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Card payments are not set up yet. Once they are, this takes the amount you agreed and
            marks them as paid.
          </p>
        </Panel>


      </div>
    </>
  );
}
