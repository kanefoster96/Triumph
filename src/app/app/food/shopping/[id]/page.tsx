import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Check, Trash2 } from "lucide-react";
import { getCurrentProfile, getShoppingListById } from "@/lib/members/service";
import { deleteShoppingList, moveShoppingItem, toggleShoppingItem } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { formatAmount } from "@/lib/members/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function ShoppingListDetailPage({ params }: PageProps<"/app/food/shopping/[id]">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const list = await getShoppingListById(id);
  if (!list || list.clientId !== profile.id) notFound();

  const done = list.items.filter((item) => item.checkedAt).length;
  const total = list.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <Link
        href="/app/food/shopping"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Shopping lists
      </Link>

      <ScreenTitle
        title="Shopping list"
        subtitle={
          list.fromDate === list.toDate
            ? `For ${dayLabel(list.fromDate)}`
            : `For ${dayLabel(list.fromDate)} to ${dayLabel(list.toDate)}`
        }
      />

      <div className="space-y-5">
        <Panel title={`${done} of ${total} in the trolley`}>
          <div className="h-1.5 overflow-hidden rounded-full bg-raised">
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
          </div>

          {total === 0 ? (
            <EmptyState>This list is empty.</EmptyState>
          ) : (
            <ul className="mt-5 space-y-2">
              {list.items.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-ink p-3"
                >
                  <form action={toggleShoppingItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button
                      type="submit"
                      aria-label={item.checkedAt ? `Put ${item.name} back` : `Tick ${item.name} off`}
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-full border transition-colors",
                        item.checkedAt
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-line text-faint hover:border-accent hover:text-accent",
                      )}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </form>

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        item.checkedAt && "text-faint line-through",
                      )}
                    >
                      {item.name}
                    </span>
                    {item.usedIn ? (
                      <span className="block truncate text-xs text-faint">{item.usedIn}</span>
                    ) : null}
                  </span>

                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      item.checkedAt ? "text-faint" : "text-accent",
                    )}
                  >
                    {formatAmount(item.quantity, item.unit)}
                  </span>

                  {/* Up and down rather than drag: it needs no JavaScript, and
                      it is the gesture that survives one thumb and a trolley. */}
                  <span className="flex shrink-0 flex-col">
                    <form action={moveShoppingItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        aria-label={`Move ${item.name} up`}
                        className="grid h-7 w-7 place-items-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-text disabled:opacity-25 disabled:hover:bg-transparent"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </form>
                    <form action={moveShoppingItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === total - 1}
                        aria-label={`Move ${item.name} down`}
                        className="grid h-7 w-7 place-items-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-text disabled:opacity-25 disabled:hover:bg-transparent"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-xs text-faint">
            Put it in the order your shop is laid out — the next list you make comes out the same way.
          </p>
        </Panel>

        <Panel title="Done with this one?">
          <form action={deleteShoppingList}>
            <input type="hidden" name="listId" value={list.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
              Delete list
            </button>
          </form>
          <p className="mt-3 text-xs text-faint">
            Next time&rsquo;s order is taken from your most recent list, so deleting this one also forgets the
            order you put it in.
          </p>
        </Panel>
      </div>
    </>
  );
}
