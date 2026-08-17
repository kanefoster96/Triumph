import { cookies } from "next/headers";
import { cache } from "react";
import { demoWeightEntries } from "./demo";
import type {
  DaySubmission,
  FoodDayFeedback,
  MealLog,
  ShoppingList,
  WeightEntry,
} from "./types";

/**
 * Where demo writes live.
 *
 * They used to be module-level arrays, which works on one machine and fails in
 * production: the site runs as serverless functions, so each request can be
 * served by a different instance holding its own copy. Ticking a meal landed in
 * one instance and the next page load read another — the tick simply vanished.
 *
 * So the store travels with the browser instead. Everything written in demo
 * mode goes into one cookie, which means it survives instance changes, and two
 * people looking round the demo at the same time no longer edit each other's
 * data. It is thrown away the moment Supabase is connected.
 */

const COOKIE = "triumph-demo-data";

/** Roughly the practical cookie ceiling, kept well under 4KB of headers. */
const MAX_BYTES = 3500;

export interface DemoData {
  mealLogs: MealLog[];
  foodDayFeedback: FoodDayFeedback[];
  weightEntries: WeightEntry[];
  shoppingLists: ShoppingList[];
  daySubmissions: DaySubmission[];
}

function empty(): DemoData {
  return {
    mealLogs: [],
    foodDayFeedback: [],
    weightEntries: [],
    shoppingLists: [],
    daySubmissions: [],
  };
}

/**
 * Read once per request.
 *
 * `cache` keeps a single copy for the whole render, so a page that reads meals
 * and submissions and weight parses the cookie once and every read agrees.
 */
export const demoData = cache(async (): Promise<DemoData> => {
  let raw: string | undefined;
  try {
    raw = (await cookies()).get(COOKIE)?.value;
  } catch {
    return empty();
  }
  if (!raw) return empty();

  try {
    return { ...empty(), ...(JSON.parse(raw) as Partial<DemoData>) };
  } catch {
    // A cookie from an older shape is not worth an error page.
    return empty();
  }
});

/**
 * Apply a change and write it back.
 *
 * Only callable from a server action — a server component cannot set cookies.
 * The mutation runs against this request's copy, so read-modify-write inside
 * one action is safe.
 */
export async function writeDemoData(mutate: (data: DemoData) => void): Promise<void> {
  const data = await demoData();
  mutate(data);

  const value = prune(data);
  try {
    (await cookies()).set(COOKIE, value, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      // A demo is a sitting worth of looking round, not a permanent account.
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    /* Called outside a request that can set cookies — nothing to persist to. */
  }
}

/**
 * Keep the cookie under the header limit by dropping the oldest things first.
 *
 * A cookie that grows past the limit is not truncated by the browser, it is
 * refused — so an unbounded store would silently stop saving anything at all,
 * which is the failure this whole module exists to fix. Losing last week's
 * shopping list is a fair price for today always saving.
 */
function prune(data: DemoData): string {
  const byDateDesc = (a: string, b: string) => b.localeCompare(a);
  let value = JSON.stringify(data);

  while (value.length > MAX_BYTES) {
    const oldestList = [...data.shoppingLists].sort((a, b) =>
      byDateDesc(b.createdAt, a.createdAt),
    )[0];
    const days = [...new Set(data.mealLogs.map((log) => log.loggedFor))].sort(byDateDesc);
    const oldestMealDay = days.at(-1);

    // Shopping lists are the biggest single thing in here, so they go first.
    if (oldestList) {
      data.shoppingLists = data.shoppingLists.filter((list) => list.id !== oldestList.id);
    } else if (days.length > 1 && oldestMealDay) {
      data.mealLogs = data.mealLogs.filter((log) => log.loggedFor !== oldestMealDay);
      data.daySubmissions = data.daySubmissions.filter((entry) => entry.onDate !== oldestMealDay);
      data.foodDayFeedback = data.foodDayFeedback.filter(
        (entry) => entry.loggedFor !== oldestMealDay,
      );
    } else if (data.weightEntries.length > 1) {
      const oldest = [...data.weightEntries].sort((a, b) => byDateDesc(b.loggedFor, a.loggedFor))[0];
      data.weightEntries = data.weightEntries.filter((w) => w !== oldest);
    } else {
      // Nothing left worth dropping — today's writes matter more than the cap.
      break;
    }

    value = JSON.stringify(data);
  }

  return value;
}

/** Whether the store is close enough to full that the next write may not fit. */
export async function demoStoreIsFull(): Promise<boolean> {
  return JSON.stringify(await demoData()).length > MAX_BYTES;
}

/**
 * Weight entries seeded in `demo.ts` plus anything logged since.
 *
 * The seed is history worth showing on a chart, so it stays in the code rather
 * than being copied into every browser's cookie.
 */
export async function demoWeights(): Promise<WeightEntry[]> {
  const { weightEntries } = await demoData();
  const added = new Set(weightEntries.map((w) => `${w.clientId}:${w.loggedFor}`));
  return [
    ...weightEntries,
    ...demoWeightEntries.filter((w) => !added.has(`${w.clientId}:${w.loggedFor}`)),
  ];
}
