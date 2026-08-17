import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { getCurrentProfile, getShoppingListById } from "@/lib/members/service";
import { deleteShoppingList, moveShoppingItem } from "@/lib/members/actions";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { ShoppingChecklist } from "@/components/members/ShoppingChecklist";

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

  const total = list.items.length;

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
        <Panel title="In the trolley">
          {total === 0 ? (
            <EmptyState>This list is empty.</EmptyState>
          ) : (
            <ShoppingChecklist
              listId={list.id}
              items={list.items}
              /* Reordering is a before-you-go job and needs the server, so it
                 stays a form. Ticking is the part that has to survive a dead
                 signal, and that is handled on the device. */
              controls={list.items.map((item, index) => (
                <span key={item.id} className="flex shrink-0 flex-col">
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
              ))}
            />
          )}

          <p className="mt-5 text-xs text-faint">
            Put it in the order your shop is laid out — the next list you make comes out the same
            way. Ticking works with no signal; it saves as soon as you have one.
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
