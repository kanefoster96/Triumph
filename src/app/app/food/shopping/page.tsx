import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingBasket } from "lucide-react";
import { getCurrentProfile, getShoppingList, shiftDate, today } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { formatAmount } from "@/lib/members/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SPANS = [1, 2, 3, 4, 5];

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
  const requested = Number(typeof query.days === "string" ? query.days : "");
  const days = SPANS.includes(requested) ? requested : 3;

  const from = today();
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
        subtitle={days === 1 ? `Everything for ${dayLabel(from)}` : `${dayLabel(from)} to ${dayLabel(to)}`}
        action={
          <nav aria-label="How many days" className="flex items-center gap-1">
            {SPANS.map((value) => (
              <Link
                key={value}
                href={`/app/food/shopping?days=${value}`}
                aria-current={value === days ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  value === days ? "bg-accent/10 text-accent" : "text-muted hover:text-text",
                )}
              >
                {value}
                {value === 1 ? " day" : ""}
              </Link>
            ))}
          </nav>
        }
      />

      <Panel title={`${lines.length} things to buy`}>
        {lines.length === 0 ? (
          <EmptyState>Nothing to buy — there are no meals planned for these days.</EmptyState>
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
    </>
  );
}
