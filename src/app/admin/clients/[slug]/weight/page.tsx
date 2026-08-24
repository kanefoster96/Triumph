import { notFound } from "next/navigation";
import {
  commentsFor,
  getComments,
  getProfile,
  getWeightEntries,
  today,
} from "@/lib/members/service";
import { logWeight } from "@/lib/members/actions";
import {
  EmptyState,
  Panel,
  WeightTrend,
  field,
  fieldLabel,
  submitButton,
} from "@/components/members/ui";
import { CommentThread } from "@/components/members/Comments";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminClientWeightPage({
  params,
}: PageProps<"/admin/clients/[slug]/weight">) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const [entries, comments] = await Promise.all([
    getWeightEntries(profile.id),
    getComments(profile.id),
  ]);

  return (
    <div className="space-y-5">
      <Panel title="Trend">
        <WeightTrend entries={entries} />
      </Panel>

      <Panel title="Correct an entry">
        <p className="mb-4 text-sm text-muted">
          Clients log their own weight. Use this only to fix a mistake or fill a gap on their behalf.
        </p>
        <form action={logWeight} className="flex flex-wrap gap-3">
          <input type="hidden" name="clientId" value={profile.id} />
          <div>
            <label className={fieldLabel} htmlFor="wt-date">
              Date
            </label>
            <input id="wt-date" className={field} type="date" name="date" defaultValue={today()} />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="wt-kg">
              Weight (kg)
            </label>
            <input
              id="wt-kg"
              className={field}
              type="number"
              step="0.1"
              min={20}
              max={400}
              name="weight"
              required
              placeholder="71.4"
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <label className={fieldLabel} htmlFor="wt-note">
              Note
            </label>
            <input id="wt-note" className={field} name="note" />
          </div>
          <button type="submit" className={`${submitButton} self-end`}>
            Save this weight
          </button>
        </form>
      </Panel>

      <Panel title="History">
        {entries.length === 0 ? (
          <EmptyState>Nothing logged yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-2xl bg-raised p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-muted">{relativeDate(entry.loggedFor)}</span>
                  <span className="font-display text-lg font-bold">
                    {entry.weightKg.toFixed(1)}
                    <span className="text-sm font-normal text-faint">kg</span>
                  </span>
                </div>
                {entry.note ? <p className="mt-2 text-sm text-muted">{entry.note}</p> : null}
                <CommentThread
                  comments={commentsFor(comments, "weight_entry", entry.id)}
                  clientId={profile.id}
                  targetType="weight_entry"
                  targetId={entry.id}
                  canReply
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
