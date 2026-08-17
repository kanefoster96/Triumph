"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { Check, CloudOff, RefreshCw } from "lucide-react";
import { setShoppingItemChecked } from "@/lib/members/actions";
import { formatAmount, type ShoppingItem } from "@/lib/members/types";
import { cn } from "@/lib/utils";

/** Ticks waiting to reach the server, kept per list so two lists never mix. */
type Pending = Record<string, boolean>;

const EMPTY: Pending = {};
const CHANGED = "triumph:shopping-changed";
const storageKey = (listId: string) => `triumph:shopping:${listId}`;

/**
 * localStorage as a React store.
 *
 * Reading it during render would disagree with the server's first paint, and
 * seeding it from an effect is a cascading render — this is what
 * useSyncExternalStore is for. The snapshot is cached against the raw string
 * so repeated reads return the same object and React can bail out.
 */
function makePendingStore(listId: string) {
  let cachedRaw: string | null = null;
  let cached: Pending = EMPTY;

  return {
    subscribe(onChange: () => void) {
      window.addEventListener("storage", onChange);
      window.addEventListener(CHANGED, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(CHANGED, onChange);
      };
    },
    getSnapshot(): Pending {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(storageKey(listId));
      } catch {
        // A blocked or full localStorage must not take the shop down with it.
        return EMPTY;
      }
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        try {
          cached = raw ? (JSON.parse(raw) as Pending) : EMPTY;
        } catch {
          cached = EMPTY;
        }
      }
      return cached;
    },
    getServerSnapshot(): Pending {
      return EMPTY;
    },
  };
}

function writePending(listId: string, pending: Pending) {
  try {
    if (Object.keys(pending).length === 0) window.localStorage.removeItem(storageKey(listId));
    else window.localStorage.setItem(storageKey(listId), JSON.stringify(pending));
  } catch {
    /* The tick still shows; it just may not survive a reload. */
  }
  window.dispatchEvent(new Event(CHANGED));
}

const onlineStore = {
  subscribe(onChange: () => void) {
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  },
  getSnapshot: () => navigator.onLine,
  getServerSnapshot: () => true,
};

/**
 * The checklist, built to work in a supermarket.
 *
 * Signal in a shop is unreliable, so a tick never depends on the network: it
 * applies to the screen immediately, is written to this device, and reaches
 * the server whenever that becomes possible. Closing the app, walking into the
 * chest freezer aisle, or both, loses nothing.
 *
 * The write sets a value rather than flipping one, so replaying a queued
 * change can never flip it back.
 */
export function ShoppingChecklist({
  listId,
  items,
  controls,
}: {
  listId: string;
  items: ShoppingItem[];
  /**
   * The reorder controls for each item, in the same order as `items`.
   * They arrive already rendered because a function cannot cross the
   * server/client boundary — elements can, so the server builds them.
   */
  controls?: React.ReactNode[];
}) {
  const store = useMemo(() => makePendingStore(listId), [listId]);
  const pending = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const online = useSyncExternalStore(
    onlineStore.subscribe,
    onlineStore.getSnapshot,
    onlineStore.getServerSnapshot,
  );

  const flush = useCallback(async () => {
    if (!navigator.onLine) return;

    let queued: Pending = EMPTY;
    try {
      const raw = window.localStorage.getItem(storageKey(listId));
      queued = raw ? (JSON.parse(raw) as Pending) : EMPTY;
    } catch {
      return;
    }

    const ids = Object.keys(queued);
    if (ids.length === 0) return;

    const failed: Pending = {};
    for (const id of ids) {
      try {
        await setShoppingItemChecked(id, queued[id]);
      } catch {
        // Still no connection, or the server refused. Keep it for next time.
        failed[id] = queued[id];
      }
    }

    writePending(listId, failed);
  }, [listId]);

  // Nothing is set here — the effect only subscribes, and the store is what
  // re-renders once a flush has emptied the queue.
  useEffect(() => {
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    void flush();
    return () => window.removeEventListener("online", onOnline);
  }, [flush]);

  const toggle = (item: ShoppingItem) => {
    const current = item.id in pending ? pending[item.id] : Boolean(item.checkedAt);
    // Screen first, device second, network whenever it turns up.
    writePending(listId, { ...pending, [item.id]: !current });
    void flush();
  };

  const queued = Object.keys(pending).length;
  const done = items.filter((item) =>
    item.id in pending ? pending[item.id] : Boolean(item.checkedAt),
  ).length;
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {done} of {items.length} in the trolley
        </p>
        {!online ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber">
            <CloudOff className="h-3.5 w-3.5" />
            No signal — saved on this phone
          </span>
        ) : queued > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </span>
        ) : null}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-5 space-y-2">
        {items.map((item, index) => {
          const checked = item.id in pending ? pending[item.id] : Boolean(item.checkedAt);

          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-ink p-3"
            >
              <button
                type="button"
                onClick={() => toggle(item)}
                aria-pressed={checked}
                aria-label={checked ? `Put ${item.name} back` : `Tick ${item.name} off`}
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 transition-colors",
                  checked
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-faint bg-ink hover:border-accent",
                )}
              >
                {/* Empty until it is in the trolley. A tick that is already
                    drawn, only greyer, does not read as "not done yet". */}
                {checked ? <Check className="h-5 w-5" strokeWidth={3} /> : null}
              </button>

              <span className="min-w-0 flex-1">
                <span
                  className={cn("block text-sm font-semibold", checked && "text-faint line-through")}
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
                  checked ? "text-faint" : "text-accent",
                )}
              >
                {formatAmount(item.quantity, item.unit)}
              </span>

              {controls?.[index]}
            </li>
          );
        })}
      </ul>
    </>
  );
}
