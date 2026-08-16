import { redirect } from "next/navigation";
import {
  commentsFor,
  getComments,
  getCurrentProfile,
  getWeightEntries,
  today,
} from "@/lib/members/service";
import { logWeight } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle, WeightTrend } from "@/components/members/ui";
import { CommentThread } from "@/components/members/Comments";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const date = today();
  const [entries, comments] = await Promise.all([
    getWeightEntries(profile.id),
    getComments(profile.id),
  ]);
  const loggedToday = entries.find((e) => e.loggedFor === date);

  return (
    <>
      <ScreenTitle title="Weight" subtitle="Same time each morning is ideal — but consistent beats perfect." />

      <div className="space-y-5">
        <Panel title={loggedToday ? "Today — logged" : "Log today"}>
          <form action={logWeight} className="flex flex-wrap gap-3">
            <input type="hidden" name="date" value={date} />
            <input
              name="weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={20}
              max={400}
              required
              defaultValue={loggedToday?.weightKg ?? ""}
              placeholder="kg"
              aria-label="Weight in kilograms"
              className="w-28 rounded-2xl border border-line bg-ink px-4 py-3 text-sm transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <input
              name="note"
              defaultValue={loggedToday?.note ?? ""}
              placeholder="Note (optional)"
              aria-label="Note"
              className="min-w-0 flex-1 rounded-2xl border border-line bg-ink px-4 py-3 text-sm transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
            >
              {loggedToday ? "Update" : "Save"}
            </button>
          </form>
        </Panel>

        <Panel title="Trend">
          <WeightTrend entries={entries} />
        </Panel>

        <Panel title="History">
          {entries.length === 0 ? (
            <EmptyState>Nothing logged yet.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-line bg-ink p-4">
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
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
