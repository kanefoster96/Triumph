import { cookies } from "next/headers";
import { cache } from "react";
import { demoWeightEntries } from "./demo";
import type { RawRevision } from "./service";
import type {
  Application,
  BoardComment,
  BoardPost,
  ChangeRequest,
  ChatMessage,
  Notification,
  DaySubmission,
  Comment,
  FoodDayFeedback,
  FoodLog,
  FoodMode,
  IngredientSwap,
  MealLog,
  Profile,
  Question,
  ShoppingList,
  SwapRequest,
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
/**
 * The plan gets a cookie of its own.
 *
 * A week of food plus three sessions is around ten revisions, which does not
 * fit alongside the day-to-day data in one 4KB cookie — the pruner was
 * throwing away Monday's food to make room for Monday's session. Two cookies
 * is the cheapest way to double the ceiling, and the split is a real one:
 * one holds what Dean planned, the other what the client did.
 */
const PLAN_COOKIE = "triumph-demo-plan";

/**
 * …and its overflow.
 *
 * One cookie holds about seven days of plan, which is less than a week of
 * training and food — so building a client's week ran the cookie out and the
 * pruner started dropping the oldest days. Dean saw Monday revert while he was
 * building Thursday, which reads as a save that did not take.
 *
 * Four cookies, filled oldest-first so the newest edit is always in the last
 * one, gets that to a month. It is a demo-mode ceiling and it disappears the
 * day Supabase is connected; until then it is better spent than explained.
 */
const PLAN_COOKIES = [PLAN_COOKIE, "triumph-demo-plan-2", "triumph-demo-plan-3", "triumph-demo-plan-4"];

/**
 * People, in a third cookie.
 *
 * Accounts and applications are not day-to-day data and not the plan: they are
 * written once at signup and read for as long as the demo lasts, so putting
 * them alongside either would mean a week of meal ticks eventually pruning
 * away somebody's account. Their own cookie keeps them out of that fight.
 */
const PEOPLE_COOKIE = "triumph-demo-people";

/**
 * The browser's per-cookie ceiling is about 4KB, and it applies to the value
 * *as sent* — which is percent-encoded, so every quote and brace in the JSON
 * costs three bytes rather than one. Measuring the raw string let the encoded
 * cookie sail past 4KB, at which point Chrome rejects it outright and silently
 * keeps the previous one: Dean's save appeared to work and simply vanished.
 * So the budget is measured on the encoded form, with room for the name and
 * attributes.
 */
const MAX_BYTES = 3600;

/**
 * The plan cookie carries no other passengers, so it can use nearly the whole
 * 4KB — its name and attributes come to about seventy bytes.
 */
const MAX_PLAN_BYTES = 3950;

/** Same again for people — its own cookie, its own near-4KB ceiling. */
const MAX_PEOPLE_BYTES = 3950;

/**
 * Accounts made through the public signup, and what they applied with.
 *
 * `profiles` here are additions to the seeded cast in demo.ts, not a copy of
 * it: somebody who signs up is a real profile that Dean can enrol, and the
 * demo pair stay exactly where they were.
 */
export interface DemoPeople {
  profiles: Profile[];
  applications: Application[];
  questions: Question[];
}

/** What this value will actually weigh in the header. */
const wireSize = (value: string) => encodeURIComponent(value).length;

export interface DemoData {
  mealLogs: MealLog[];
  foodDayFeedback: FoodDayFeedback[];
  /**
   * Comments — Dean's replies to a note, and the client's back.
   *
   * In the cookie rather than a module array because the site runs as
   * serverless functions: a reply written in one instance and read from
   * another simply was not there, which looks exactly like a message that
   * failed to send.
   */
  comments: Comment[];
  weightEntries: WeightEntry[];
  shoppingLists: ShoppingList[];
  daySubmissions: DaySubmission[];
  /** Food mode overrides, by client id — Dean's switch is a write like any other. */
  foodModes: Record<string, FoodMode>;
  /**
   * Plan days Dean has written, appended to the seeded ones. Order matters:
   * the newest edit to a date is the one that counts, so these are never
   * reordered.
   */
  planRevisions: PackedRevision[];
  /**
   * What the client has done to a workout, as deltas rather than copies.
   *
   * A whole workout is far too big for a cookie — five exercises of four sets
   * is most of the budget on its own — but what actually changes is a handful
   * of booleans and numbers. So ticks, logged sets and the finishing note are
   * stored by id and laid over whatever the workout was, whether that came
   * from the seed or was generated by the plan.
   */
  workoutEdits: Record<string, { completedAt?: string | null; clientNote?: string | null; feeling?: number | null }>;
  itemEdits: Record<string, { done?: boolean; doneAt?: string | null; skippedReason?: string | null }>;
  setEdits: Record<string, { actualWeightKg: number | null; actualReps: number | null; doneAt: string | null }>;
  /** Plan days the client has begun. Stored as ids, so no copy is needed. */
  startedWorkouts: string[];
  /** Off-plan food added since. Seeded logs stay in `demo.ts`. */
  foodLogs: FoodLog[];
  /** Seeded logs the client has deleted — a seed cannot be removed in place. */
  deletedFoodLogs: string[];
  /** Ingredient swaps Dean has made for a client. */
  mealSwaps: IngredientSwap[];
  /** Clients asking to move a session to another day. */
  swapRequests: SwapRequest[];
  /** Photos Dean has set, by client id. */
  avatars: Record<string, string>;
}

function empty(): DemoData {
  return {
    mealLogs: [],
    foodDayFeedback: [],
    comments: [],
    weightEntries: [],
    shoppingLists: [],
    daySubmissions: [],
    foodModes: {},
    planRevisions: [],
    workoutEdits: {},
    itemEdits: {},
    setEdits: {},
    startedWorkouts: [],
    foodLogs: [],
    deletedFoodLogs: [],
    mealSwaps: [],
    swapRequests: [],
    avatars: {},
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
  let planParts: Array<string | undefined> = [];
  try {
    const store = await cookies();
    raw = store.get(COOKIE)?.value;
    planParts = PLAN_COOKIES.map((name) => store.get(name)?.value);
  } catch {
    return empty();
  }

  const parse = <T,>(value: string | undefined, fallback: T): T => {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      // A cookie from an older shape is not worth an error page.
      return fallback;
    }
  };

  return {
    ...empty(),
    ...parse<Partial<DemoData>>(raw, {}),
    // Read in cookie order, which is the order they were written: oldest
    // first, so the newest edit to a date is still the last one in the list.
    planRevisions: planParts.flatMap((part) => parse<PackedRevision[]>(part, [])),
  };
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

  const { planRevisions, ...rest } = data;
  const plan = prunePlan(planRevisions);
  const value = prune(rest);

  try {
    const store = await cookies();
    const options = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      // A demo is a sitting worth of looking round, not a permanent account.
      maxAge: 60 * 60 * 24 * 7,
    };
    store.set(COOKIE, value, options);
    // Every part is written, empty ones included: a cookie left behind from a
    // bigger plan would be read back in and resurrect days that were deleted.
    PLAN_COOKIES.forEach((name, index) => store.set(name, plan[index] ?? "[]", options));
  } catch {
    /* Called outside a request that can set cookies — nothing to persist to. */
  }
}

/**
 * Split the plan across its cookies, dropping the oldest edit if it still will
 * not fit.
 *
 * Losing the oldest revision is the least bad thing that can happen here: a
 * day still resolves from whatever came before it, so the plan degrades to an
 * earlier version of itself rather than to nothing. With four cookies it takes
 * a month of edits to get there.
 */
function prunePlan(revisions: PackedRevision[]): string[] {
  let kept = [...revisions];
  let parts = chunkPlan(kept);

  while (kept.length > 1 && parts.length > PLAN_COOKIES.length) {
    kept = kept.slice(1);
    parts = chunkPlan(kept);
  }

  return parts.slice(0, PLAN_COOKIES.length);
}

/** Fill each cookie in turn, in order, so the newest edit is in the last one. */
function chunkPlan(revisions: PackedRevision[]): string[] {
  const parts: string[] = [];
  let current: PackedRevision[] = [];

  for (const revision of revisions) {
    const next = [...current, revision];
    if (current.length > 0 && wireSize(JSON.stringify(next)) > MAX_PLAN_BYTES) {
      parts.push(JSON.stringify(current));
      current = [revision];
    } else {
      current = next;
    }
  }

  parts.push(JSON.stringify(current));
  return parts;
}

/**
 * Keep the cookie under the header limit by dropping the oldest things first.
 *
 * A cookie that grows past the limit is not truncated by the browser, it is
 * refused — so an unbounded store would silently stop saving anything at all,
 * which is the failure this whole module exists to fix. Losing last week's
 * shopping list is a fair price for today always saving.
 */
function prune(data: Omit<DemoData, "planRevisions">): string {
  const byDateDesc = (a: string, b: string) => b.localeCompare(a);
  let value = JSON.stringify(data);

  while (wireSize(value) > MAX_BYTES) {
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
  return wireSize(JSON.stringify(await demoData())) > MAX_BYTES * 0.9;
}

/** A seeded profile with anything Dean has since changed on it. */
export async function withFoodMode<T extends Profile>(profile: T): Promise<T> {
  const { foodModes, avatars } = await demoData();
  const mode = foodModes[profile.id];
  const avatarUrl = avatars[profile.id];
  if (!mode && !avatarUrl) return profile;
  return {
    ...profile,
    ...(mode ? { foodMode: mode } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
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

/**
 * Plan revisions, packed.
 *
 * Stored verbatim a single training day came to 1,802 bytes — mostly a fresh
 * UUID on every exercise and every set — so two days overflowed the cookie and
 * the pruner threw away the very edit that had just been made. Nothing Dean
 * saved stuck.
 *
 * Packed, the same day is a few hundred bytes: positional arrays, no generated
 * ids, and only the library ids that actually have to be kept. The ids are
 * rebuilt on read from the sequence and position, which is what keeps them
 * stable — a workout tick is keyed to an item id, so an id that changed
 * between reads would quietly orphan it.
 */
export type PackedRevision = [
  clientId: string,
  weekday: number,
  kind: 0 | 1, // 0 workout, 1 food
  effectiveFrom: string,
  onlyOn: string | null,
  title: string | null,
  suggestedTime: string | null,
  coachNotes: string | null,
  calorieTarget: number | null,
  proteinTarget: number | null,
  isRest: 0 | 1,
  exercises: Array<[exerciseId: string, notes: string | null, sets: Array<[w: number | null, r: number | null]>]>,
  meals: Array<[slot: string, mealId: string, multiplier: number]>,
];

export function packRevision(r: RawRevision): PackedRevision {
  return [
    r.clientId,
    r.weekday,
    r.kind === "food" ? 1 : 0,
    r.effectiveFrom,
    r.onlyOn,
    r.title,
    r.suggestedTime,
    r.coachNotes,
    r.calorieTarget,
    r.proteinTarget,
    r.isRest ? 1 : 0,
    r.exercises.map((e) => [e.exerciseId, e.notes, e.sets.map((s) => [s.targetWeightKg, s.targetReps])]),
    r.meals.map((m) => [m.slot, m.mealId, m.multiplier]),
  ];
}

export function unpackRevision(p: PackedRevision, seq: number): RawRevision {
  const id = `demo-rev-${seq}`;
  return {
    id,
    clientId: p[0],
    weekday: p[1],
    kind: p[2] === 1 ? "food" : "workout",
    effectiveFrom: p[3],
    onlyOn: p[4],
    title: p[5],
    suggestedTime: p[6],
    coachNotes: p[7],
    calorieTarget: p[8],
    proteinTarget: p[9],
    isRest: p[10] === 1,
    exercises: p[11].map(([exerciseId, notes, sets], i) => ({
      id: `${id}-e${i}`,
      position: i,
      exerciseId,
      notes,
      sets: sets.map(([targetWeightKg, targetReps], j) => ({
        id: `${id}-e${i}-s${j}`,
        position: j,
        targetWeightKg,
        targetReps,
      })),
    })),
    meals: p[12].map(([slot, mealId, multiplier], i) => ({
      id: `${id}-m${i}`,
      slot: slot as RawRevision["meals"][number]["slot"],
      position: i,
      mealId,
      multiplier,
    })),
  };
}

// ---------------------------------------------------------------------------
// People — accounts made through the public signup, and their applications
// ---------------------------------------------------------------------------

/** Read once per request, like the other two. */
export const demoPeople = cache(async (): Promise<DemoPeople> => {
  try {
    const store = await cookies();
    const raw = store.get(PEOPLE_COOKIE)?.value;
    if (!raw) return { profiles: [], applications: [], questions: [] };
    const parsed = JSON.parse(raw) as Partial<DemoPeople>;
    return {
      profiles: parsed.profiles ?? [],
      applications: parsed.applications ?? [],
      questions: parsed.questions ?? [],
    };
  } catch {
    // No cookie jar, or a cookie from an older shape. Neither is worth an
    // error page in a demo.
    return { profiles: [], applications: [], questions: [] };
  }
});

export async function writeDemoPeople(mutate: (people: DemoPeople) => void): Promise<void> {
  const people = await demoPeople();
  mutate(people);

  // Oldest application first out. An account is never dropped: somebody who
  // signed up and then could not sign in again would be the worst thing this
  // store could do.
  // Oldest question first out, then the oldest application. An account is
  // never dropped: somebody who signed up and then could not sign in again
  // would be the worst thing this store could do.
  let value = JSON.stringify(people);
  while (wireSize(value) > MAX_PEOPLE_BYTES && people.questions.length > 0) {
    people.questions.shift();
    value = JSON.stringify(people);
  }
  while (wireSize(value) > MAX_PEOPLE_BYTES && people.applications.length > 1) {
    people.applications.shift();
    value = JSON.stringify(people);
  }

  try {
    const store = await cookies();
    store.set(PEOPLE_COOKIE, value, {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    /* Called outside a request that can set cookies — nothing to persist to. */
  }
}

// ---------------------------------------------------------------------------
// Talking to each other, in a fifth cookie
//
// Chat, requests, notifications and the board are their own concern and get
// their own budget for the same reason the plan does: a fortnight of messages
// must not be able to prune away the day the client submitted, and a busy
// board must not prune away a message. Demo mode has no bucket behind it, so
// nothing here carries a file — the attach button is simply not offered.
// ---------------------------------------------------------------------------

const SOCIAL_COOKIE = "triumph-demo-social";
const MAX_SOCIAL_BYTES = 3950;

/** The one thread demo mode has, since it has one client and one coach. */
export const DEMO_THREAD_ID = "demo-thread";

export interface DemoSocial {
  chatMessages: ChatMessage[];
  chatClientReadAt: string | null;
  chatCoachReadAt: string | null;
  chatClosedAt: string | null;
  changeRequests: ChangeRequest[];
  /** Announcements Dean has sent, on top of the seeded one. */
  notifications: Notification[];
  /** When whoever is looking last opened the bell. */
  notificationsReadAt: string | null;
  posts: BoardPost[];
  /** Post ids the viewer has liked. Their own like is the only one they set. */
  likes: string[];
  postComments: BoardComment[];
}

function emptySocial(): DemoSocial {
  return {
    chatMessages: [],
    chatClientReadAt: null,
    chatCoachReadAt: null,
    chatClosedAt: null,
    changeRequests: [],
    notifications: [],
    notificationsReadAt: null,
    posts: [],
    likes: [],
    postComments: [],
  };
}

export const demoSocial = cache(async (): Promise<DemoSocial> => {
  try {
    const raw = (await cookies()).get(SOCIAL_COOKIE)?.value;
    if (!raw) return emptySocial();
    return { ...emptySocial(), ...(JSON.parse(raw) as Partial<DemoSocial>) };
  } catch {
    return emptySocial();
  }
});

export async function writeDemoSocial(mutate: (data: DemoSocial) => void): Promise<void> {
  const data = await demoSocial();
  mutate(data);

  try {
    (await cookies()).set(SOCIAL_COOKIE, pruneSocial(data), {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    /* Called outside a request that can set cookies — nothing to persist to. */
  }
}

/**
 * Drop the oldest thing first until it fits.
 *
 * Board comments go before posts and posts go before messages, which is the
 * order of how much it hurts to lose one: a comment on a fortnight-old post is
 * scenery, a message is the thing somebody actually said to their coach.
 */
function pruneSocial(data: DemoSocial): string {
  const copy: DemoSocial = { ...data };
  let value = JSON.stringify(copy);

  while (wireSize(value) > MAX_SOCIAL_BYTES) {
    if (copy.postComments.length > 0) copy.postComments = copy.postComments.slice(1);
    else if (copy.posts.length > 0) copy.posts = copy.posts.slice(1);
    else if (copy.notifications.length > 0) copy.notifications = copy.notifications.slice(1);
    else if (copy.changeRequests.length > 0) copy.changeRequests = copy.changeRequests.slice(1);
    else if (copy.chatMessages.length > 1) copy.chatMessages = copy.chatMessages.slice(1);
    else break;
    value = JSON.stringify(copy);
  }

  return value;
}
