import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingBasket } from "lucide-react";
import { getCurrentProfile, getShoppingList, shiftDate, today } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { formatAmount } from "@/lib/members/types";

export const dynamic = "force-dynamic";

/**
 * Five days is the ceiling on purpose: fresh food bought for longer than that
 * is food thrown away.
 */
const MAX_DAYS = 5;

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function ShoppingListPage({ searchParams }: PageProps<"/app/food/shopping">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const query = await searchParams;
  const now = today();

  // Shopping for days already gone makes no sense, so the start is clamped to
  // today; the length is what keeps the whole shop inside its shelf life.
  const requestedFrom = typeof query.from === "string" ? query.from : "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(requestedFrom) && requestedFrom > now ? requestedFrom : now;

  // Number("") is 0, not NaN, so the absent case has to be caught before the
  // conversion or the default silently becomes one day.
  const requestedDays = typeof query.days === "string" ? Number(query.days) : NaN;
  const days = Number.isFinite(requestedDays)
    ? Math.min(MAX_DAYS, Math.max(1, Math.round(requestedDays)))
    : 3;

  const to = shiftDate(from, days - 1);
  const lines = await getShoppingList(profile.id, from, days);

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
        title="Shopping list"
        subtitle={
          days === 1
            ? `Everything you need for ${dayLabel(from)}`
            : `Everything you need from ${dayLabel(from)} to ${dayLabel(to)}`
        }
      />

      <div className="space-y-5">
        <Panel title="What are you shopping for?">
          {/* A plain GET form, so the chosen days live in the URL and the page
              can be reloaded or shared without picking them again. */}
          <form action="/app/food/shopping" className="flex flex-wrap items-end gap-3">
            <div>
              <label className={fieldLabel} htmlFor="shop-from">
                Shopping day
              </label>
              <input id="shop-from" className={field} type="date" name="from" defaultValue={from} min={now} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="shop-days">
                Covering
              </label>
              <select id="shop-days" className={field} name="days" defaultValue={String(days)}>
                {Array.from({ length: MAX_DAYS }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value} day{value === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={submitButton}>
              Update list
            </button>
          </form>

          <p className="mt-3 text-xs text-faint">
            Five days is the most you can buy for in one go — past that, fresh food tends to go off before you
            get to it.
          </p>
        </Panel>

        <Panel title={`${lines.length} things to buy`}>
          {lines.length === 0 ? (
            <EmptyState>
              Nothing to buy — there are no meals planned between {dayLabel(from)} and {dayLabel(to)}.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={`${line.name}-${line.unit}`} className="flex items-baseline gap-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{line.name}</span>
                    {/* Why it is on the list, so nothing looks like a mistake. */}
                    <span className="block truncate text-xs text-faint">{line.usedIn.join(", ")}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-accent tabular-nums">
                    {formatAmount(line.quantity, line.unit)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 inline-flex items-start gap-2 text-xs text-faint">
            <ShoppingBasket className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Totalled across every meal on those days, at your portion sizes. Anything measured differently is
            listed separately rather than added together.
          </p>
        </Panel>
      </div>
    </>
  );
}
