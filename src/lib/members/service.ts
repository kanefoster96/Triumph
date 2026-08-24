import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_ADMIN_ID,
  DEMO_CLIENT_ID,
  demoBoardComments,
  demoChatMessages,
  demoNotifications,
  demoPosts,
  demoCheckIns,
  demoComments,
  demoFoodDayFeedback,
  demoExercises,
  demoMeals,
  demoPlanRevisions,
  demoFoodLogs,
  demoFoodPlans,
  demoProfiles,
  demoSessions,
  demoWorkouts,
} from "./demo";
import {
  DEMO_THREAD_ID,
  demoData,
  demoPeople,
  demoSocial,
  demoWeights,
  unpackRevision,
  withFoodMode,
} from "./demo-store";
import type {
  Application,
  BoardAudience,
  BoardComment,
  BoardPost,
  ChangeRequest,
  ChangeRequestRow,
  ChatInboxRow,
  ChatMessage,
  ChatThread,
  Notification,
  CheckIn,
  ClientStatus,
  DaySubmission,
  IngredientSwap,
  CheckInSummary,
  ClientNote,
  ClientOverview,
  CoachSession,
  Comment,
  CommentTarget,
  DashboardSummary,
  DayProgress,
  DayTaskState,
  Exercise,
  ExerciseTrend,
  LastEffort,
  FoodDayFeedback,
  FoodLog,
  FoodPlan,
  Meal,
  MealLog,
  PlanDay,
  PlanKind,
  PlanMealSlot,
  PlanSet,
  Profile,
  Question,
  ScaledMeal,
  ShoppingLine,
  ShoppingList,
  SessionStatus,
  SwapRequest,
  WeightEntry,
  Workout,
} from "./types";

/**
 * Every read and write the members' area needs.
 *
 * Each function talks to Supabase when the project is connected and falls back
 * to the in-memory demo dataset when it is not, so the interface is reviewable
 * before any credentials exist. Row level security is what actually enforces
 * privacy in production — the `clientId` arguments here are for shaping
 * queries, not for access control.
 */

export const DEMO_ROLE_COOKIE = "triumph-demo-role";

/**
 * How long a signed URL lasts.
 *
 * An hour: long enough to read a thread and open every photo in it, short
 * enough that a link copied out of the page is worthless by the time it is
 * pasted anywhere.
 */
export const SIGNED_URL_SECONDS = 60 * 60;

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */

function toProfile(row: any): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? null,
    role: row.role,
    status: row.status,
    goal: row.goal ?? null,
    startedOn: row.started_on,
    foodMode: row.food_mode ?? "coach",
    coachingMode: row.coaching_mode ?? "online",
    avatarUrl: row.avatar_url ?? null,
  };
}

function toSession(row: any): CoachSession {
  return {
    id: row.id,
    clientId: row.client_id,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    location: row.location,
    status: row.status,
    coachNotes: row.coach_notes ?? null,
  };
}

function toWorkout(row: any): Workout {
  return {
    id: row.id,
    clientId: row.client_id,
    scheduledFor: row.scheduled_for,
    title: row.title,
    suggestedTime: row.suggested_time ? String(row.suggested_time).slice(0, 5) : null,
    coachNotes: row.coach_notes ?? null,
    clientNote: row.client_note ?? null,
    feeling: row.feeling ?? null,
    completedAt: row.completed_at ?? null,
    fromPlan: false,
    items: (row.workout_items ?? [])
      .map((item: any) => ({
        id: item.id,
        workoutId: item.workout_id,
        position: item.position,
        label: item.label,
        target: item.target ?? null,
        exerciseId: item.exercise_id ?? null,
        muscleGroup: item.muscle_group ?? null,
        equipment: item.equipment ?? null,
        howTo: null,
        skippedReason: item.skipped_reason ?? null,
        sets: (item.workout_sets ?? [])
          .map((set: any) => ({
            id: set.id,
            position: set.position,
            targetWeightKg: set.target_weight_kg === null ? null : Number(set.target_weight_kg),
            targetReps: set.target_reps ?? null,
            actualWeightKg: set.actual_weight_kg === null ? null : Number(set.actual_weight_kg),
            actualReps: set.actual_reps ?? null,
            doneAt: set.done_at ?? null,
          }))
          .sort((a: any, b: any) => a.position - b.position),
        done: item.done,
        doneAt: item.done_at ?? null,
      }))
      .sort((a: any, b: any) => a.position - b.position),
  };
}

function toFoodPlan(row: any): FoodPlan {
  return {
    id: row.id,
    clientId: row.client_id,
    assignedFor: row.assigned_for,
    calorieTarget: row.calorie_target ?? null,
    proteinTarget: row.protein_target ?? null,
    notes: row.notes ?? null,
    meals: (row.food_plan_meals ?? [])
      .map((meal: any) => ({
        id: meal.id,
        position: meal.position,
        name: meal.name,
        ingredients: meal.ingredients ?? null,
        calories: meal.calories ?? null,
      }))
      .sort((a: any, b: any) => a.position - b.position),
  };
}

function toFoodLog(row: any): FoodLog {
  return {
    id: row.id,
    clientId: row.client_id,
    loggedFor: row.logged_for,
    calories: row.calories,
    proteinG: row.protein_g ?? null,
    carbsG: row.carbs_g ?? null,
    fatG: row.fat_g ?? null,
    note: row.note ?? null,
    createdAt: row.created_at,
  };
}

function toWeight(row: any): WeightEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    loggedFor: row.logged_for,
    weightKg: Number(row.weight_kg),
    note: row.note ?? null,
  };
}

function toComment(row: any): Comment {
  return {
    id: row.id,
    clientId: row.client_id,
    authorId: row.author_id,
    authorName: row.author?.full_name ?? "Dean Foster",
    authorRole: row.author?.role ?? "admin",
    targetType: row.target_type,
    targetId: row.target_id,
    body: row.body,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  };
}

function toCheckIn(row: any): CheckIn {
  return {
    id: row.id,
    clientId: row.client_id,
    coachId: row.coach_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    outcome: row.outcome,
    note: row.note,
    weeksPlanned: row.weeks_planned ?? 0,
    nextReviewOn: row.next_review_on,
    createdAt: row.created_at,
  };
}

function toExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group ?? null,
    equipment: row.equipment ?? null,
    howTo: row.how_to ?? null,
    archivedAt: row.archived_at ?? null,
  };
}

function toMeal(row: any): Meal {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    calories: row.calories ?? null,
    proteinG: row.protein_g ?? null,
    carbsG: row.carbs_g ?? null,
    fatG: row.fat_g ?? null,
    ingredients: (row.meal_ingredients ?? [])
      .map((i: any) => ({
        id: i.id,
        position: i.position,
        name: i.name,
        quantity: i.quantity === null || i.quantity === undefined ? null : Number(i.quantity),
        unit: i.unit ?? null,
      }))
      .sort((a: any, b: any) => a.position - b.position),
    method: (row.meal_steps ?? [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map((s: any) => s.body),
    archivedAt: row.archived_at ?? null,
  };
}

function toRevision(row: any): RawRevision {
  return {
    id: row.id,
    clientId: row.client_id,
    weekday: row.weekday,
    kind: row.kind,
    effectiveFrom: row.effective_from,
    onlyOn: row.only_on ?? null,
    title: row.title ?? null,
    suggestedTime: row.suggested_time ? String(row.suggested_time).slice(0, 5) : null,
    coachNotes: row.coach_notes ?? null,
    calorieTarget: row.calorie_target ?? null,
    proteinTarget: row.protein_target ?? null,
    isRest: Boolean(row.is_rest),
    exercises: (row.plan_exercises ?? []).map((e: any) => ({
      id: e.id,
      position: e.position,
      exerciseId: e.exercise_id,
      notes: e.notes ?? null,
      sets: (e.plan_sets ?? []).map((set: any) => ({
        id: set.id,
        position: set.position,
        targetWeightKg: set.target_weight_kg === null ? null : Number(set.target_weight_kg),
        targetReps: set.target_reps ?? null,
      })),
    })),
    meals: (row.plan_meal_slots ?? []).map((m: any) => ({
      id: m.id,
      slot: m.slot,
      position: m.position,
      mealId: m.meal_id,
      multiplier: Number(m.multiplier),
    })),
  };
}

function toShoppingList(row: any): ShoppingList {
  return {
    id: row.id,
    clientId: row.client_id,
    fromDate: row.from_date,
    toDate: row.to_date,
    createdAt: row.created_at,
    items: (row.shopping_list_items ?? [])
      .map((item: any) => ({
        id: item.id,
        position: item.position,
        name: item.name,
        quantity: item.quantity === null || item.quantity === undefined ? null : Number(item.quantity),
        unit: item.unit ?? null,
        usedIn: item.used_in ?? null,
        checkedAt: item.checked_at ?? null,
      }))
      .sort((a: any, b: any) => a.position - b.position),
  };
}

function toMealLog(row: any): MealLog {
  return {
    id: row.id,
    clientId: row.client_id,
    loggedFor: row.logged_for,
    slot: row.slot,
    mealId: row.meal_id ?? null,
    name: row.name,
    multiplier: Number(row.multiplier),
    calories: row.calories ?? null,
    proteinG: row.protein_g ?? null,
    carbsG: row.carbs_g ?? null,
    fatG: row.fat_g ?? null,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/** The signed-in profile, or null when signed out. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  if (!supabase) {
    // Demo mode: the cookie stands in for a session. No cookie means signed
    // out, so the real sign-in/sign-out loop can be exercised without auth.
    const store = await cookies();
    const session = store.get(DEMO_ROLE_COOKIE)?.value;
    if (!session) return null;

    /*
     * Two kinds of session. "client" and "admin" are the demo pair, which stay
     * for now. Anything else is the id of an account somebody made through the
     * public signup — a real person in this demo, who signs in as themselves.
     */
    if (session === "client" || session === "admin") {
      const id = session === "admin" ? DEMO_ADMIN_ID : DEMO_CLIENT_ID;
      const seeded = demoProfiles.find((p) => p.id === id);
      return seeded ? await withFoodMode(seeded) : null;
    }

    /*
     * Signed up through the website, or one of the seeded people signed in by
     * their own email — the seeded pair have to be found here too, or signing
     * in as the demo client lands on a cookie nothing resolves and bounces
     * straight back to the login page.
     */
    const { profiles } = await demoPeople();
    const signedIn =
      profiles.find((profile) => profile.id === session) ??
      demoProfiles.find((profile) => profile.id === session);
    return signedIn ? await withFoodMode(signedIn) : null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ? toProfile(data) : null;
}

export async function isDemoMode(): Promise<boolean> {
  return (await createClient()) === null;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function getSessions(clientId: string): Promise<CoachSession[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoSessions
      .filter((s) => s.clientId === clientId)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  }

  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false });
  return (data ?? []).map(toSession);
}

/**
 * Splits sessions into upcoming and past.
 *
 * Lives here rather than in a component because reading the clock during
 * render is impure — and this way every screen splits them the same way.
 */
export async function partitionSessions<T extends { startsAt: string; status: SessionStatus }>(
  sessions: T[],
): Promise<{ upcoming: T[]; past: T[] }> {
  const now = Date.now();
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const session of sessions) {
    if (session.status === "scheduled" && new Date(session.startsAt).getTime() >= now) {
      upcoming.push(session);
    } else {
      past.push(session);
    }
  }

  upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  past.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return { upcoming, past };
}

/** Dean's calendar across every client. */
export async function getAllSessions(): Promise<Array<CoachSession & { clientName: string }>> {
  const supabase = await createClient();
  if (!supabase) {
    return demoSessions
      .map((s) => ({
        ...s,
        clientName: demoProfiles.find((p) => p.id === s.clientId)?.fullName ?? "Unknown",
      }))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  const { data } = await supabase
    .from("sessions")
    .select("*, client:profiles!sessions_client_id_fkey(full_name)")
    .order("starts_at", { ascending: true });

  return (data ?? []).map((row) => ({
    ...toSession(row),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- joined row
    clientName: (row as any).client?.full_name ?? "Unknown",
  }));
}

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------

/**
 * Lay the client's own edits over a workout.
 *
 * The workout itself is either seed data or generated from the plan; what they
 * did to it — ticks, logged sets, the note at the end — lives in the demo
 * store, keyed by id. Applied on every read so it does not matter which of the
 * two produced the workout.
 */
async function withWorkoutEdits(workout: Workout): Promise<Workout> {
  const { workoutEdits, itemEdits, setEdits, startedWorkouts } = await demoData();
  const edit = workoutEdits[workout.id];

  return {
    ...workout,
    completedAt: edit?.completedAt !== undefined ? edit.completedAt : workout.completedAt,
    clientNote: edit?.clientNote !== undefined ? edit.clientNote : workout.clientNote,
    feeling: edit?.feeling !== undefined ? edit.feeling : workout.feeling,
    // Once begun it is theirs, not a preview of the plan.
    fromPlan: workout.fromPlan && !startedWorkouts.includes(workout.id),
    items: workout.items.map((item) => {
      const patch = itemEdits[item.id];
      return {
        ...item,
        done: patch?.done ?? item.done,
        doneAt: patch?.doneAt !== undefined ? patch.doneAt : item.doneAt,
        skippedReason:
          patch?.skippedReason !== undefined ? patch.skippedReason : item.skippedReason,
        sets: item.sets.map((set) => {
          const s = setEdits[set.id];
          return s ? { ...set, ...s } : set;
        }),
      };
    }),
  };
}

export async function getWorkouts(clientId: string): Promise<Workout[]> {
  const supabase = await createClient();
  if (!supabase) {
    const seeded = await Promise.all(
      demoWorkouts.filter((w) => w.clientId === clientId).map(withWorkoutEdits),
    );

    // A plan day the client has begun counts as a workout of theirs, the same
    // as the row Supabase would have created. Rebuilt from the plan rather
    // than copied, and claimed only when the rebuilt id matches — that is what
    // proves the started day belongs to this client.
    const { startedWorkouts } = await demoData();
    const started: Workout[] = [];
    for (const id of startedWorkouts) {
      const date = id.startsWith("plan:") ? id.split(":")[2] : null;
      if (!date || seeded.some((w) => w.scheduledFor === date)) continue;
      const day = await getPlanDay(clientId, date, "workout");
      if (day.isRest || day.exercises.length === 0) continue;
      const built = workoutFromPlan(clientId, date, day);
      if (built.id === id) started.push(await withWorkoutEdits(built));
    }

    return [...seeded, ...started].sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
  }

  const { data } = await supabase
    .from("workouts")
    .select("*, workout_items(*, workout_sets(*))")
    .eq("client_id", clientId)
    .order("scheduled_for", { ascending: false });
  return (data ?? []).map(toWorkout);
}

/**
 * The workout for a date.
 *
 * A logged row wins — once the client has touched a day, that day is what they
 * did. Otherwise it comes from the plan. A date with nothing planned is a rest
 * day, which is null here.
 */
export async function getWorkoutFor(clientId: string, date: string): Promise<Workout | null> {
  const [workouts, planned] = await Promise.all([
    getWorkouts(clientId),
    getPlanDay(clientId, date, "workout"),
  ]);
  const logged = workouts.find((w) => w.scheduledFor === date);
  if (logged) return logged;

  if (planned.isRest || planned.exercises.length === 0) return null;
  return withWorkoutEdits(workoutFromPlan(clientId, date, planned));
}

/** A plan day rendered as a workout, before the client has started it. */
export function workoutFromPlan(clientId: string, date: string, day: PlanDay): Workout {
  const workoutId = `plan:${day.revisionId ?? "none"}:${date}`;
  return {
    id: workoutId,
    clientId,
    scheduledFor: date,
    title: day.title ?? "Workout",
    suggestedTime: day.suggestedTime,
    coachNotes: day.coachNotes,
    clientNote: null,
    feeling: null,
    completedAt: null,
    fromPlan: true,
    items: day.exercises.map((exercise) => ({
      id: exercise.id,
      workoutId,
      position: exercise.position,
      label: exercise.name,
      target: null,
      exerciseId: exercise.exerciseId,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      howTo: exercise.howTo,
      skippedReason: null,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        position: set.position,
        targetWeightKg: set.targetWeightKg,
        targetReps: set.targetReps,
        actualWeightKg: null,
        actualReps: null,
        doneAt: null,
      })),
      done: false,
      doneAt: null,
    })),
  };
}

/**
 * Every date in a range the client has training on, logged or planned. Drives
 * the calendars, which would otherwise show nothing past today now that the
 * plan is generated rather than written out in advance.
 */
export async function getTrainingDates(clientId: string, from: string, to: string): Promise<string[]> {
  const [workouts, revisions] = await Promise.all([getWorkouts(clientId), loadRevisions(clientId)]);
  const dates = new Set(
    workouts.filter((w) => w.scheduledFor >= from && w.scheduledFor <= to).map((w) => w.scheduledFor),
  );

  for (let cursor = from; cursor <= to; cursor = shiftDate(cursor, 1)) {
    const { revision } = pickRevision(revisions, weekdayOf(cursor), "workout", cursor);
    if (revision && !revision.isRest && revision.exercises.length > 0) dates.add(cursor);
  }

  return [...dates].sort();
}

// ---------------------------------------------------------------------------
// Food
// ---------------------------------------------------------------------------

/**
 * The food plan in force on a date: the row for that exact day if there is
 * one, otherwise the most recent earlier one, so a target set once carries
 * forward until Dean changes it.
 */
export async function getFoodPlan(clientId: string, date?: string): Promise<FoodPlan | null> {
  const on = date ?? today();
  const supabase = await createClient();

  if (!supabase) {
    return (
      demoFoodPlans
        .filter((p) => p.clientId === clientId && p.assignedFor <= on)
        .sort((a, b) => b.assignedFor.localeCompare(a.assignedFor))[0] ?? null
    );
  }

  const { data } = await supabase
    .from("food_plans")
    .select("*, food_plan_meals(*)")
    .eq("client_id", clientId)
    .lte("assigned_for", on)
    .order("assigned_for", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toFoodPlan(data) : null;
}

/** Every date this client has a food plan explicitly assigned to. */
export async function getAssignedFoodDates(clientId: string): Promise<FoodPlan[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoFoodPlans
      .filter((p) => p.clientId === clientId)
      .sort((a, b) => a.assignedFor.localeCompare(b.assignedFor));
  }

  const { data } = await supabase
    .from("food_plans")
    .select("*, food_plan_meals(*)")
    .eq("client_id", clientId)
    .order("assigned_for", { ascending: true });
  return (data ?? []).map(toFoodPlan);
}

// ---------------------------------------------------------------------------
// Reusable plans
// ---------------------------------------------------------------------------



export async function getFoodLogs(clientId: string, date?: string): Promise<FoodLog[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { foodLogs, deletedFoodLogs } = await demoData();
    return [...demoFoodLogs, ...foodLogs]
      .filter(
        (l) =>
          l.clientId === clientId &&
          (!date || l.loggedFor === date) &&
          !deletedFoodLogs.includes(l.id),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  let query = supabase.from("food_logs").select("*").eq("client_id", clientId);
  if (date) query = query.eq("logged_for", date);
  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []).map(toFoodLog);
}

export function sumCalories(logs: FoodLog[]): number {
  return logs.reduce((total, log) => total + log.calories, 0);
}

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

export async function getWeightEntries(clientId: string): Promise<WeightEntry[]> {
  const supabase = await createClient();
  if (!supabase) {
    return (await demoWeights())
      .filter((w) => w.clientId === clientId)
      .sort((a, b) => b.loggedFor.localeCompare(a.loggedFor));
  }

  const { data } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("client_id", clientId)
    .order("logged_for", { ascending: false });
  return (data ?? []).map(toWeight);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getComments(clientId: string): Promise<Comment[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { comments } = await demoData();
    return [...demoComments, ...comments]
      .filter((c) => c.clientId === clientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(full_name, role)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toComment);
}

export function commentsFor(comments: Comment[], targetType: CommentTarget, targetId: string): Comment[] {
  return comments
    .filter((c) => c.targetType === targetType && c.targetId === targetId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

/** An ISO date shifted by whole days, in UTC. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getCheckIns(clientId: string): Promise<CheckIn[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoCheckIns
      .filter((c) => c.clientId === clientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data } = await supabase
    .from("check_ins")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toCheckIn);
}

/**
 * The note on a food log doubles as a label — plenty of entries are just
 * "Breakfast". A few words means they were telling Dean something; one or two
 * means they were naming a meal, and putting those on the board is noise.
 */
function isMessage(note: string): boolean {
  return note.trim().split(/\s+/).length >= 4;
}

/** Mean of a set of weigh-ins, to one decimal. Null when there are none. */
function meanWeight(entries: WeightEntry[]): number | null {
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, entry) => sum + entry.weightKg, 0);
  return Number((total / entries.length).toFixed(1));
}

/** Everything the client wrote in the window, newest first. */
/**
 * Everything a client has written lately, for the top of an editor.
 *
 * Dean opens the food page *because* of something they said, and by the time
 * he is three screens deep the wording of it has gone. This puts it back in
 * front of him while he is making the change it prompted.
 */
export async function getRecentNotes(clientId: string, days = 14): Promise<ClientNote[]> {
  const end = today();
  return getNotesBetween(clientId, shiftDate(end, -(days - 1)), end);
}

/** The same, over a range the caller names — what the plan screen asks for. */
export async function getNotesBetween(
  clientId: string,
  from: string,
  to: string,
): Promise<ClientNote[]> {
  const [workouts, foodLogs, weights, food] = await Promise.all([
    getWorkouts(clientId),
    getFoodLogs(clientId),
    getWeightEntries(clientId),
    getFoodDayFeedback(clientId),
  ]);
  return gatherNotes(workouts, foodLogs, weights, food, from, to);
}

/** What the client said about a day's food, by date. */
export async function getFoodDayFeedback(clientId: string): Promise<FoodDayFeedback[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { foodDayFeedback } = await demoData();
    return [...demoFoodDayFeedback, ...foodDayFeedback].filter((f) => f.clientId === clientId);
  }

  const { data } = await supabase
    .from("food_day_feedback")
    .select("*")
    .eq("client_id", clientId);
  return (data ?? []).map((row) => ({
    clientId: row.client_id,
    loggedFor: row.logged_for,
    feeling: row.feeling ?? null,
    note: row.note ?? null,
  }));
}

function gatherNotes(
  workouts: Workout[],
  foodLogs: FoodLog[],
  weights: WeightEntry[],
  foodDays: FoodDayFeedback[],
  start: string,
  end: string,
): ClientNote[] {
  const inWindow = (date: string) => date >= start && date <= end;

  const notes: ClientNote[] = [
    ...workouts
      .filter((w) => inWindow(w.scheduledFor) && w.clientNote)
      .map((w) => ({
        id: `w-${w.id}`,
        kind: "workout" as const,
        on: w.scheduledFor,
        body: w.clientNote as string,
        context: w.title,
      })),
    ...foodLogs
      .filter((l) => inWindow(l.loggedFor) && l.note && isMessage(l.note))
      .map((l) => ({
        id: `f-${l.id}`,
        kind: "food" as const,
        on: l.loggedFor,
        body: l.note as string,
        context: `${l.calories.toLocaleString("en-GB")} kcal`,
      })),
    ...weights
      .filter((w) => inWindow(w.loggedFor) && w.note)
      .map((w) => ({
        id: `we-${w.id}`,
        kind: "weight" as const,
        on: w.loggedFor,
        body: w.note as string,
        context: `${w.weightKg.toFixed(1)}kg`,
      })),
    // What they said about the day's food when they closed it out. This is
    // the note Dean most often acts on and it was the one nothing surfaced.
    ...foodDays
      .filter((f) => inWindow(f.loggedFor) && f.note)
      .map((f) => ({
        id: `fd-${f.loggedFor}`,
        kind: "food" as const,
        on: f.loggedFor,
        body: f.note as string,
        context: "On their meals",
      })),
  ];

  return notes.sort((a, b) => b.on.localeCompare(a.on));
}

/**
 * Dean's weekly review: one row per client covering how the last stretch
 * actually went, what they said about it, and how far ahead they are covered.
 *
 * Reads per client the same way `listClients` does. At Dean's scale that is
 * fine; if the roster ever gets big this is the place to replace with a view.
 */
export async function getCheckInBoard(windowDays = 7): Promise<CheckInSummary[]> {
  const periodEnd = today();
  const periodStart = shiftDate(periodEnd, -(windowDays - 1));
  // Paused clients are not being coached, so they are not waiting on a review.
  const profiles = (await getClients()).filter((p) => p.status === "active");

  const rows = await Promise.all(
    profiles.map(async (profile): Promise<CheckInSummary> => {
      const [workouts, foodLogs, weights, foodPlan, checkIns, comments, foodDays] =
        await Promise.all([
          getWorkouts(profile.id),
          getFoodLogs(profile.id),
          getWeightEntries(profile.id),
          getFoodPlan(profile.id),
          getCheckIns(profile.id),
          getComments(profile.id),
          getFoodDayFeedback(profile.id),
        ]);
      const missedDays = await getMissedDays(profile.id, periodStart, periodEnd);

      const inWindow = (date: string) => date >= periodStart && date <= periodEnd;

      const windowWorkouts = workouts.filter((w) => inWindow(w.scheduledFor));
      const workoutsAssigned = windowWorkouts.length;
      const workoutsCompleted = windowWorkouts.filter((w) => w.completedAt).length;
      // Today's workout is not missed — the day is not over.
      const workoutsMissed = windowWorkouts.filter(
        (w) => w.scheduledFor < periodEnd && !w.completedAt,
      ).length;

      // What "continue" would repeat: the weekdays they have trained on lately.
      const lookback = shiftDate(periodEnd, -13);
      const trainingDays = [
        ...new Set(
          workouts
            .filter((w) => w.scheduledFor >= lookback && w.scheduledFor <= periodEnd)
            .map((w) => new Date(`${w.scheduledFor}T00:00:00Z`).getUTCDay()),
        ),
      ].sort();

      const windowLogs = foodLogs.filter((l) => inWindow(l.loggedFor));
      const loggedDays = [...new Set(windowLogs.map((l) => l.loggedFor))];
      const averageCalories = loggedDays.length
        ? Math.round(sumCalories(windowLogs) / loggedDays.length)
        : null;

      // Weight is this window's average against the previous window's. A single
      // reading moves a kilo or two on water alone, so an endpoint-to-endpoint
      // delta would report noise as a trend and flag people who are fine.
      const previousStart = shiftDate(periodStart, -windowDays);
      const previousEnd = shiftDate(periodStart, -1);
      const averageWeightKg = meanWeight(weights.filter((w) => inWindow(w.loggedFor)));
      const previousWeightKg = meanWeight(
        weights.filter((w) => w.loggedFor >= previousStart && w.loggedFor <= previousEnd),
      );
      const weightChangeKg =
        averageWeightKg !== null && previousWeightKg !== null
          ? Number((averageWeightKg - previousWeightKg).toFixed(1))
          : null;

      // Whether there is a plan at all, rather than how far it stretches: a
      // weekday's plan stands until Dean changes it, so nothing runs out.
      const planned = await getPlanDays(profile.id, periodEnd, 7);
      const hasPlan = planned.some(
        (day) => day.workout.exercises.length > 0 || day.food.meals.length > 0,
      );

      const notes = gatherNotes(workouts, foodLogs, weights, foodDays, periodStart, periodEnd);
      const lastCheckIn = checkIns[0] ?? null;
      const recentCheckIns = checkIns.slice(0, 6);
      const checkInComments = comments.filter((c) => c.targetType === "check_in");
      const calorieTarget = foodPlan?.calorieTarget ?? null;

      // Every flag names something Dean would actually act on, so the card can
      // say why it is asking for attention rather than just colouring itself.
      const flags: string[] = [];
      if (workoutsMissed > 0) {
        flags.push(`${workoutsMissed} of ${workoutsAssigned} workouts not finished`);
      }
      if (loggedDays.length === 0) {
        flags.push("No food logged");
      } else if (loggedDays.length < Math.ceil(windowDays / 2)) {
        flags.push(`Food logged on ${loggedDays.length} of ${windowDays} days`);
      }
      if (averageCalories && calorieTarget) {
        const off = averageCalories - calorieTarget;
        if (off > calorieTarget * 0.1) flags.push(`Averaging ${off.toLocaleString("en-GB")} over target`);
        if (off < -calorieTarget * 0.15) {
          flags.push(`Averaging ${Math.abs(off).toLocaleString("en-GB")} under target`);
        }
      }
      // A finished day with something missed is the most actionable thing on
      // this board: the client already told him why.
      if (missedDays.length > 0) {
        const items = new Set(missedDays.flatMap((d) => d.missed));
        flags.push(
          `${missedDays.length} day${missedDays.length === 1 ? "" : "s"} finished with ${items.size} thing${items.size === 1 ? "" : "s"} missed`,
        );
      }
      if (notes.length > 0) {
        flags.push(notes.length === 1 ? "Left a note" : `Left ${notes.length} notes`);
      }
      // A plan does not run out — a weekday stands until Dean changes it — so
      // the only thing worth flagging is somebody with no plan at all.
      if (!hasPlan) flags.push("Nothing planned yet");
      if (lastCheckIn && lastCheckIn.nextReviewOn <= periodEnd) {
        flags.push("Review due");
      }

      return {
        profile,
        periodStart,
        periodEnd,
        windowDays,
        workoutsAssigned,
        workoutsCompleted,
        foodLoggedDays: loggedDays.length,
        averageCalories,
        calorieTarget,
        averageWeightKg,
        weightChangeKg,
        notes,
        trainingDays,
        missedDays,
        lastCheckIn,
        recentCheckIns,
        checkInComments,
        flags,
      };
    }),
  );

  // Anyone needing a look comes first, then the most flags, then by name.
  return rows.sort((a, b) => {
    if (a.flags.length !== b.flags.length) return b.flags.length - a.flags.length;
    return a.profile.fullName.localeCompare(b.profile.fullName);
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboard(profile: Profile): Promise<DashboardSummary> {
  const date = today();
  const [sessions, workouts, workout, foodPlan, foodLogs, weights, comments, checkIns] = await Promise.all([
    getSessions(profile.id),
    getWorkouts(profile.id),
    getWorkoutFor(profile.id, date),
    getFoodPlan(profile.id),
    getFoodLogs(profile.id, date),
    getWeightEntries(profile.id),
    getComments(profile.id),
    getCheckIns(profile.id),
  ]);

  const now = Date.now();
  const nextSession =
    sessions
      .filter((s) => s.status === "scheduled" && new Date(s.startsAt).getTime() >= now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;

  // Today's workout has its own card, so "coming up" means after today.
  const nextWorkout =
    workouts
      .filter((w) => w.scheduledFor > date)
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0] ?? null;

  // The check-in has its own card with a reply box, so it is kept out of the
  // "new from Dean" list rather than being said twice.
  const latestCheckIn = checkIns[0] ?? null;

  return {
    profile,
    latestCheckIn,
    checkInComments: latestCheckIn ? commentsFor(comments, "check_in", latestCheckIn.id) : [],
    nextSession,
    nextWorkout,
    todaysWorkout: workout,
    foodPlan,
    todaysCalories: sumCalories(foodLogs),
    latestWeight: weights[0] ?? null,
    unreadComments: comments.filter(
      (c) => c.readAt === null && c.authorRole === "admin" && c.targetType !== "check_in",
    ),
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** Rough "are they keeping up?" signal for the client list. */
function deriveTrack(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return false;
  const days = (Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000;
  return days <= 3;
}

export async function listClients(): Promise<ClientOverview[]> {
  const date = today();
  const supabase = await createClient();

  // The same filter `getClients` uses: somebody with an account but no
  // coaching is not a row on Dean's board.
  const profiles = supabase
    ? (
        (
          await supabase
            .from("profiles")
            .select("*")
            .eq("role", "client")
            .in("status", [...ENROLLED])
            .order("full_name")
        ).data ?? []
      ).map(toProfile)
    : await Promise.all(
        demoProfiles.filter((p) => p.role === "client" && ENROLLED.has(p.status)).map(withFoodMode),
      );

  return Promise.all(
    profiles.map(async (profile) => {
      const [workouts, foodPlan, foodLogs, weights, sessions] = await Promise.all([
        getWorkouts(profile.id),
        getFoodPlan(profile.id),
        getFoodLogs(profile.id, date),
        getWeightEntries(profile.id),
        getSessions(profile.id),
      ]);

      const activity = [
        workouts.find((w) => w.completedAt)?.completedAt ?? null,
        foodLogs[0]?.createdAt ?? null,
        weights[0] ? `${weights[0].loggedFor}T12:00:00.000Z` : null,
      ]
        .filter((value): value is string => Boolean(value))
        .sort()
        .reverse();

      const now = Date.now();
      const todaysWorkout = workouts.find((w) => w.scheduledFor === date) ?? null;

      return {
        profile,
        lastActivityAt: activity[0] ?? null,
        onTrack: deriveTrack(activity[0] ?? null),
        todaysWorkoutDone: Boolean(todaysWorkout?.completedAt),
        todaysWorkoutProgress: todaysWorkout
          ? { done: todaysWorkout.items.filter((i) => i.done).length, total: todaysWorkout.items.length }
          : null,
        todaysCalories: sumCalories(foodLogs),
        calorieTarget: foodPlan?.calorieTarget ?? null,
        latestWeight: weights[0] ?? null,
        nextSession:
          sessions
            .filter((s) => s.status === "scheduled" && new Date(s.startsAt).getTime() >= now)
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null,
      };
    }),
  );
}

/** Just the clients, for pickers. Cheaper than listClients(). */
/** The statuses that mean "this is one of Dean's clients". */
const ENROLLED = new Set<ClientStatus>(["active", "paused"]);

export async function getClients(): Promise<Profile[]> {
  const supabase = await createClient();
  if (!supabase) {
    // Seeded clients plus anyone Dean has enrolled through the requests inbox.
    // Anybody who has only made an account, or is still waiting on him, is
    // deliberately absent: they have an account, not a plan.
    const { profiles } = await demoPeople();
    const all = [...demoProfiles, ...profiles].filter(
      (profile) => profile.role === "client" && ENROLLED.has(profile.status),
    );
    return (await Promise.all(all.map(withFoodMode))).sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .in("status", [...ENROLLED])
    .order("full_name");
  return (data ?? []).map(toProfile);
}

export async function getProfile(clientId: string): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) {
    const { profiles } = await demoPeople();
    const found =
      demoProfiles.find((p) => p.id === clientId) ?? profiles.find((p) => p.id === clientId);
    return found ? await withFoodMode(found) : null;
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", clientId).single();
  return data ? toProfile(data) : null;
}

// ---------------------------------------------------------------------------
// Applications — the public signup's side of Dean's requests inbox
// ---------------------------------------------------------------------------

/** Everything waiting on him, newest first. */
export async function getApplications(status?: Application["status"]): Promise<Application[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { applications } = await demoPeople();
    return applications
      .filter((entry) => !status || entry.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  let query = supabase.from("applications").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []).map(toApplication);
}

export async function getApplication(id: string): Promise<Application | null> {
  const supabase = await createClient();
  if (!supabase) {
    const { applications } = await demoPeople();
    return applications.find((entry) => entry.id === id) ?? null;
  }

  const { data } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
  return data ? toApplication(data) : null;
}

/** What somebody who signed up sees while they wait. */
export async function getMyApplication(accountId: string): Promise<Application | null> {
  const all = await getApplications();
  return all.find((entry) => entry.accountId === accountId) ?? null;
}

/** One-off questions from the website's contact form, newest first. */
export async function getQuestions(): Promise<Question[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { questions } = await demoPeople();
    return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped row */
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    body: row.body,
    createdAt: row.created_at,
    answeredAt: row.answered_at ?? null,
  }));
}

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase row */
function toApplication(row: any): Application {
  return {
    id: row.id,
    accountId: row.account_id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url ?? null,
    currentWeightKg: row.current_weight_kg === null ? null : Number(row.current_weight_kg),
    goalWeightKg: row.goal_weight_kg === null ? null : Number(row.goal_weight_kg),
    goalType: row.goal_type,
    goalOther: row.goal_other ?? null,
    hasGym: row.has_gym ?? null,
    gymName: row.gym_name ?? null,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Libraries
// ---------------------------------------------------------------------------

export async function getExercises(includeArchived = false): Promise<Exercise[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoExercises
      .filter((e) => includeArchived || !e.archivedAt)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  let query = supabase.from("exercises").select("*").order("name");
  if (!includeArchived) query = query.is("archived_at", null);
  const { data } = await query;
  return (data ?? []).map(toExercise);
}

export async function getMeals(includeArchived = false): Promise<Meal[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoMeals
      .filter((m) => includeArchived || !m.archivedAt)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  let query = supabase.from("meals").select("*, meal_ingredients(*), meal_steps(*)").order("name");
  if (!includeArchived) query = query.is("archived_at", null);
  const { data } = await query;
  return (data ?? []).map(toMeal);
}

export async function getMeal(id: string): Promise<Meal | null> {
  const supabase = await createClient();
  if (!supabase) return demoMeals.find((m) => m.id === id) ?? null;

  const { data } = await supabase
    .from("meals")
    .select("*, meal_ingredients(*), meal_steps(*)")
    .eq("id", id)
    .single();
  return data ? toMeal(data) : null;
}

/**
 * A meal at a client's multiplier: calories, macros and every ingredient
 * quantity scaled, so what they read is what they cook.
 */
export function scaleMeal(meal: Meal, multiplier: number): ScaledMeal {
  const scale = (value: number | null) => (value === null ? null : Math.round(value * multiplier));

  return {
    meal,
    multiplier,
    calories: scale(meal.calories),
    proteinG: scale(meal.proteinG),
    carbsG: scale(meal.carbsG),
    fatG: scale(meal.fatG),
    ingredients: meal.ingredients.map((ingredient) => ({
      ...ingredient,
      quantity: ingredient.quantity === null ? null : Number((ingredient.quantity * multiplier).toFixed(2)),
    })),
  };
}

// ---------------------------------------------------------------------------
// The repeating plan
// ---------------------------------------------------------------------------

/** Whole days between two ISO dates, in UTC. */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const b = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

/**
 * Which weekday a date is, Monday first: 0 = Monday … 6 = Sunday.
 *
 * Monday-first because that is how every screen here draws a week, and because
 * "all future Mondays" has to mean the same thing to the picker, the plan and
 * the person reading it.
 */
export function weekdayOf(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * The swaps in force for a client on a date.
 *
 * A swap pinned to a single date beats a standing one, the same way a day set
 * for one date beats that weekday's standing plan — so "just this Tuesday,
 * cod" does not have to undo "salmon is out from now on".
 */
export async function getMealSwaps(clientId: string, date: string): Promise<IngredientSwap[]> {
  const supabase = await createClient();

  let all: IngredientSwap[];
  if (!supabase) {
    const { mealSwaps } = await demoData();
    all = mealSwaps.filter((s) => s.clientId === clientId);
  } else {
    const { data } = await supabase
      .from("client_meal_swaps")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });
    all = (data ?? []).map((row) => ({
      id: row.id,
      clientId: row.client_id,
      mealId: row.meal_id ?? null,
      replaces: row.replaces,
      name: row.name ?? null,
      quantity: row.quantity === null ? null : Number(row.quantity),
      unit: row.unit ?? null,
      effectiveFrom: row.effective_from,
      onlyOn: row.only_on ?? null,
      createdAt: row.created_at,
    }));
  }

  const inForce = all.filter((s) =>
    s.onlyOn ? s.onlyOn === date : s.effectiveFrom <= date,
  );

  // One swap per ingredient per meal: a date-pinned one wins, then the newest.
  const chosen = new Map<string, IngredientSwap>();
  for (const swap of inForce) {
    const key = `${swap.mealId ?? "*"}:${swap.replaces.trim().toLowerCase()}`;
    const held = chosen.get(key);
    if (!held || (swap.onlyOn && !held.onlyOn) || (Boolean(swap.onlyOn) === Boolean(held.onlyOn) && swap.createdAt >= held.createdAt)) {
      chosen.set(key, swap);
    }
  }
  return [...chosen.values()];
}

/**
 * A meal as this client actually gets it.
 *
 * Applied where a meal is resolved for a person and a date, so the plan
 * editor, their app, the method page and the shopping list all agree without
 * any of them knowing swaps exist. A swap naming a meal beats a blanket one,
 * because "in this meal, use cod" is more specific than "no salmon anywhere".
 */
export function applySwaps(meal: Meal, swaps: IngredientSwap[]): Meal {
  const relevant = swaps.filter((s) => s.mealId === null || s.mealId === meal.id);
  if (relevant.length === 0) return meal;

  const forName = (name: string) => {
    const key = name.trim().toLowerCase();
    const matches = relevant.filter((s) => s.replaces.trim().toLowerCase() === key);
    return matches.find((s) => s.mealId === meal.id) ?? matches[0] ?? null;
  };

  const ingredients = meal.ingredients.flatMap((ingredient) => {
    const swap = forName(ingredient.name);
    if (!swap) return [ingredient];
    if (swap.name === null) return [];
    return [
      {
        ...ingredient,
        name: swap.name,
        quantity: swap.quantity ?? ingredient.quantity,
        unit: swap.unit ?? ingredient.unit,
      },
    ];
  });

  const changed = ingredients.length !== meal.ingredients.length
    || ingredients.some((ing, i) => ing.name !== meal.ingredients[i]?.name);
  return changed ? { ...meal, ingredients } : meal;
}

function buildPlanDay(
  revision: RawRevision | null,
  weekday: number,
  kind: PlanKind,
  exercises: Exercise[],
  meals: Meal[],
  oneOff: boolean,
): PlanDay {
  const byExercise = new Map(exercises.map((e) => [e.id, e]));
  const byMeal = new Map(meals.map((m) => [m.id, m]));

  return {
    revisionId: revision?.id ?? null,
    weekday,
    kind,
    isRest: revision?.isRest ?? false,
    oneOff,
    title: revision?.title ?? null,
    suggestedTime: revision?.suggestedTime ?? null,
    coachNotes: revision?.coachNotes ?? null,
    calorieTarget: revision?.calorieTarget ?? null,
    proteinTarget: revision?.proteinTarget ?? null,
    exercises: (revision?.exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((entry) => {
        const library = byExercise.get(entry.exerciseId);
        return {
          id: entry.id,
          position: entry.position,
          exerciseId: entry.exerciseId,
          // Read live, so a rename or a corrected cue reaches every future day.
          name: library?.name ?? "Removed exercise",
          muscleGroup: library?.muscleGroup ?? null,
          equipment: library?.equipment ?? null,
          howTo: library?.howTo ?? null,
          archived: !library || Boolean(library.archivedAt),
          notes: entry.notes,
          sets: entry.sets.slice().sort((a, b) => a.position - b.position),
        };
      }),
    meals: (revision?.meals ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((entry) => {
        const library = byMeal.get(entry.mealId);
        return {
          id: entry.id,
          slot: entry.slot,
          position: entry.position,
          meal: library ?? {
            id: entry.mealId,
            name: "Removed meal",
            tag: entry.slot,
            calories: null,
            proteinG: null,
            carbsG: null,
            fatG: null,
            ingredients: [],
            method: [],
            archivedAt: new Date(0).toISOString(),
          },
          multiplier: entry.multiplier,
          archived: !library || Boolean(library.archivedAt),
        };
      }),
  };
}

/**
 * Whether this date is actually different from its weekday's standing plan.
 *
 * A pinned revision is not the same thing as a changed day: saving "all future
 * Mondays" pins the Monday being edited as well, so that it changes too. Only
 * a day whose content differs from what the weekday would otherwise give is
 * worth flagging as one of Dean's exceptions.
 */
function differsFromStanding(
  revisions: RawRevision[],
  weekday: number,
  kind: PlanKind,
  date: string,
  picked: { revision: RawRevision | null; oneOff: boolean },
): boolean {
  if (!picked.oneOff || !picked.revision) return false;

  const standing = revisions
    .filter((r) => r.kind === kind && !r.onlyOn && r.weekday === weekday && r.effectiveFrom <= date)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
    .at(-1) ?? null;

  return shapeOf(picked.revision) !== shapeOf(standing);
}

/** A revision reduced to what a person would notice changing. */
function shapeOf(revision: RawRevision | null): string {
  if (!revision) return "";
  return JSON.stringify([
    revision.title,
    revision.suggestedTime,
    revision.isRest,
    revision.calorieTarget,
    revision.exercises.map((e) => [e.exerciseId, e.sets.map((s) => [s.targetWeightKg, s.targetReps])]),
    revision.meals.map((m) => [m.slot, m.mealId, m.multiplier]),
  ]);
}

/**
 * Pick the revision that governs a date.
 *
 * A day written for exactly this date wins; otherwise the newest standing plan
 * for this weekday that has already come into effect. That ordering is the
 * whole of the recurrence rule: saving "all future Mondays" cannot reach back
 * over a Monday somebody has already made special, because the special one is
 * pinned to its date and pinned always wins.
 *
 * Because revisions are only ever inserted, and never dated before today, a
 * past date always resolves to what was true at the time.
 */
function pickRevision(revisions: RawRevision[], weekday: number, kind: PlanKind, date: string) {
  const forKind = revisions.filter((r) => r.kind === kind);

  // The LAST one written for that date, not the first. Editing the same day
  // twice is ordinary — Dean correcting himself, or overriding what a
  // self-planning client chose — and `find` would have kept the earliest
  // version forever while appearing to save the new one.
  const oneOffs = forKind.filter((r) => r.onlyOn === date);
  if (oneOffs.length > 0) return { revision: oneOffs[oneOffs.length - 1], oneOff: true };

  const standing = forKind
    .filter((r) => !r.onlyOn && r.weekday === weekday && r.effectiveFrom <= date)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

  return { revision: standing.at(-1) ?? null, oneOff: false };
}

/**
 * Every revision for a block, oldest first.
 *
 * The order carries meaning — the newest edit to a date wins — so it is
 * asked for explicitly rather than left to whatever the database returns.
 */
async function loadRevisions(clientId: string): Promise<RawRevision[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { planRevisions } = await demoData();
    return [...demoPlanRevisions, ...planRevisions.map(unpackRevision)].filter(
      (r) => r.clientId === clientId,
    );
  }

  const { data } = await supabase
    .from("plan_day_revisions")
    .select("*, plan_exercises(*, plan_sets(*)), plan_meal_slots(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(toRevision);
}

/**
 * What the client is meant to do on a date.
 *
 * Never null: every date resolves, and a date nothing has been written for is
 * a rest day. There is no "before the plan starts" any more — a plan is a
 * pile of days, and an empty one is a day off.
 */
export async function getPlanDay(clientId: string, date: string, kind: PlanKind): Promise<PlanDay> {
  const weekday = weekdayOf(date);
  const [revisions, exercises, meals, swaps] = await Promise.all([
    loadRevisions(clientId),
    getExercises(true),
    getMeals(true),
    getMealSwaps(clientId, date),
  ]);

  const { revision, oneOff } = pickRevision(revisions, weekday, kind, date);
  // Swapped here, at the one seam where a meal meets a person and a date, so
  // the plan editor, their app, the method page and the shopping list all
  // agree without any of them having to know swaps exist.
  const forClient = swaps.length > 0 ? meals.map((meal) => applySwaps(meal, swaps)) : meals;
  return buildPlanDay(revision, weekday, kind, exercises, forClient, oneOff);
}

/** One date of the plan, with everything a day card needs to draw itself. */
export interface PlanListDay {
  date: string;
  weekday: number;
  workout: PlanDay;
  food: PlanDay;
  sessions: CoachSession[];
  /** Notes the client left on this date, newest first. */
  notes: ClientNote[];
  /** Been and gone. Shown, and still editable — Dean corrects the record. */
  past: boolean;
  isToday: boolean;
}

/**
 * A run of dates, resolved one by one — what the plan screen draws.
 *
 * The libraries and revisions load once for the whole run rather than once per
 * day, which is the difference between three round trips and forty-two.
 */
export async function getPlanDays(
  clientId: string,
  from: string,
  days: number,
): Promise<PlanListDay[]> {
  const now = today();
  const [revisions, exercises, meals, sessions, notes] = await Promise.all([
    loadRevisions(clientId),
    getExercises(true),
    getMeals(true),
    getSessions(clientId),
    getNotesBetween(clientId, from, shiftDate(from, days - 1)),
  ]);

  const out: PlanListDay[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = shiftDate(from, offset);
    const weekday = weekdayOf(date);

    // Swaps are per date, so a run spanning a change shows cod after it and
    // salmon before it rather than one answer for the whole stretch.
    const swaps = await getMealSwaps(clientId, date);
    const forClient = swaps.length > 0 ? meals.map((meal) => applySwaps(meal, swaps)) : meals;

    const workout = pickRevision(revisions, weekday, "workout", date);
    const food = pickRevision(revisions, weekday, "food", date);

    out.push({
      date,
      weekday,
      workout: buildPlanDay(
        workout.revision,
        weekday,
        "workout",
        exercises,
        forClient,
        differsFromStanding(revisions, weekday, "workout", date, workout),
      ),
      food: buildPlanDay(
        food.revision,
        weekday,
        "food",
        exercises,
        forClient,
        differsFromStanding(revisions, weekday, "food", date, food),
      ),
      sessions: sessions.filter((session) => session.startsAt.slice(0, 10) === date),
      notes: notes.filter((note) => note.on === date),
      past: date < now,
      isToday: date === now,
    });
  }

  return out;
}

/**
 * The last date before `date` that falls on the same weekday and has something
 * planned — what "copy from last Monday" pulls from.
 *
 * Looks back eight weeks and no further: if he has not trained that weekday in
 * two months there is nothing worth copying, and offering an empty day as a
 * shortcut is worse than not offering one.
 */
export async function findLastLike(
  clientId: string,
  date: string,
  kind: PlanKind,
): Promise<string | null> {
  const revisions = await loadRevisions(clientId);
  const weekday = weekdayOf(date);

  for (let back = 1; back <= 8; back += 1) {
    const cursor = shiftDate(date, -7 * back);
    const { revision } = pickRevision(revisions, weekday, kind, cursor);
    if (!revision) continue;
    const filled = kind === "workout" ? revision.exercises.length > 0 : revision.meals.length > 0;
    if (filled) return cursor;
  }

  return null;
}

/** The Monday of whatever week a date falls in. Weeks start Monday here. */
export function mondayOf(date: string): string {
  return shiftDate(date, -weekdayOf(date));
}

/**
 * Day swap requests — a client's own, or everyone's still waiting.
 *
 * Read from the same place either way so the client's "asked Dean" and Dean's
 * inbox can never disagree about what was asked.
 */
export async function getSwapRequests(clientId: string): Promise<SwapRequest[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { swapRequests } = await demoData();
    return swapRequests
      .filter((request) => request.clientId === clientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data } = await supabase
    .from("day_swap_requests")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toSwapRequest);
}

export async function getPendingSwaps(): Promise<Array<SwapRequest & { clientName: string; avatarUrl: string | null }>> {
  const supabase = await createClient();
  const clients = await getClients();
  const byId = new Map(clients.map((client) => [client.id, client]));
  const name = (request: SwapRequest) => ({
    ...request,
    clientName: byId.get(request.clientId)?.fullName ?? "Client",
    avatarUrl: byId.get(request.clientId)?.avatarUrl ?? null,
  });

  if (!supabase) {
    const { swapRequests } = await demoData();
    return swapRequests
      .filter((request) => request.status === "pending")
      .sort((a, b) => a.fromDate.localeCompare(b.fromDate))
      .map(name);
  }

  const { data } = await supabase
    .from("day_swap_requests")
    .select("*")
    .eq("status", "pending")
    .order("from_date", { ascending: true });
  return (data ?? []).map(toSwapRequest).map(name);
}

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase row */
function toSwapRequest(row: any): SwapRequest {
  return {
    id: row.id,
    clientId: row.client_id,
    fromDate: row.from_date,
    toDate: row.to_date,
    title: row.title ?? null,
    reason: row.reason ?? null,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Everyone's week, in one grid.
 *
 * Thirty clients as cards is thirty scroll-lengths, and the question Dean
 * actually has on a Monday morning is "who has gone quiet" — which is a
 * shape, not a list. One row per client, one cell per day, and the colour
 * carries it.
 *
 * Built per client from bulk reads rather than by asking `getDayProgress`
 * two hundred and ten times: that function is five queries deep and is meant
 * for one day at a time.
 */
export type ComplianceState = "none" | "todo" | "partial" | "done";

export interface ComplianceDay {
  date: string;
  workout: ComplianceState;
  food: ComplianceState;
  weight: ComplianceState;
  session: boolean;
  /** Not yet happened — shown, never judged. */
  future: boolean;
  /** Everything asked of them that day was done. */
  allDone: boolean;
}

export interface ComplianceRow {
  profile: Profile;
  days: ComplianceDay[];
  /** Of the things asked so far this week, how many landed. */
  done: number;
  asked: number;
}

export async function getComplianceBoard(from: string, days = 7): Promise<ComplianceRow[]> {
  const now = today();
  const clients = await getClients();
  const rows: ComplianceRow[] = [];

  for (const profile of clients) {
    const [week, workouts, mealLogs, weights, sessions] = await Promise.all([
      getPlanDays(profile.id, from, days),
      getWorkouts(profile.id),
      getMealLogs(profile.id),
      getWeightEntries(profile.id),
      getSessions(profile.id),
    ]);

    const loggedWorkouts = new Map(workouts.map((workout) => [workout.scheduledFor, workout]));
    const sessionDates = new Set(sessions.map((session) => session.startsAt.slice(0, 10)));
    const weighed = new Set(weights.map((entry) => entry.loggedFor));

    let done = 0;
    let asked = 0;

    const cells = Array.from({ length: days }, (_, offset) => {
      const date = shiftDate(from, offset);
      const planned = week[offset] ?? null;
      const future = date > now;

      const trainingPlanned = Boolean(
        planned && !planned.workout.isRest && planned.workout.exercises.length > 0,
      );
      const logged = loggedWorkouts.get(date);
      const ticked = logged?.items.filter((item) => item.done).length ?? 0;
      const workout: ComplianceState = !trainingPlanned
        ? "none"
        : logged?.completedAt
          ? "done"
          : ticked > 0
            ? "partial"
            : "todo";

      const plannedMeals = planned?.food.meals ?? [];
      const eaten = new Set(
        mealLogs.filter((log) => log.loggedFor === date).map((log) => `${log.slot}:${log.mealId}`),
      );
      const hit = plannedMeals.filter((slot) => eaten.has(`${slot.slot}:${slot.meal.id}`)).length;
      const food: ComplianceState =
        plannedMeals.length === 0
          ? "none"
          : hit === plannedMeals.length
            ? "done"
            : hit > 0
              ? "partial"
              : "todo";

      // A day with nothing on it asks nothing, weigh-in included: marking it
      // red when the client was never given anything to do is noise.
      const asks = trainingPlanned || plannedMeals.length > 0;
      const weight: ComplianceState = !asks ? "none" : weighed.has(date) ? "done" : "todo";

      // Only days that have happened count towards the week's score — a
      // Thursday that has not arrived is not a Thursday they have missed.
      if (!future) {
        for (const state of [workout, food, weight]) {
          if (state === "none") continue;
          asked += 1;
          if (state === "done") done += 1;
        }
      }

      const judged = [workout, food, weight].filter((state) => state !== "none");
      return {
        date,
        workout,
        food,
        weight,
        session: sessionDates.has(date),
        future,
        allDone: judged.length > 0 && judged.every((state) => state === "done"),
      };
    });

    rows.push({ profile, days: cells, done, asked });
  }

  // Whoever needs looking at first. A client with nothing asked of them yet
  // sorts as complete rather than as a crisis.
  return rows.sort((a, b) => {
    const rate = (row: ComplianceRow) => (row.asked === 0 ? 1 : row.done / row.asked);
    return rate(a) - rate(b);
  });
}

/**
 * A plan revision before its library items are joined on. Shared between the
 * Supabase mapper and the demo fixture so both feed the same resolver.
 */
export interface RawRevision {
  id: string;
  clientId: string;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
  kind: PlanKind;
  effectiveFrom: string;
  onlyOn: string | null;
  title: string | null;
  suggestedTime: string | null;
  coachNotes: string | null;
  calorieTarget: number | null;
  proteinTarget: number | null;
  isRest: boolean;
  exercises: Array<{
    id: string;
    position: number;
    exerciseId: string;
    notes: string | null;
    sets: PlanSet[];
  }>;
  meals: Array<{ id: string; slot: Meal["tag"]; position: number; mealId: string; multiplier: number }>;
}

/**
 * What the client last did on an exercise, for the field beside the next
 * target. Skipped and unlogged sessions are ignored — the last real effort is
 * the useful one, not the last date.
 */
export async function getLastEfforts(clientId: string): Promise<Map<string, LastEffort>> {
  const workouts = await getWorkouts(clientId);
  const efforts = new Map<string, LastEffort>();

  // Newest first, so the first hit for an exercise is the most recent.
  for (const workout of [...workouts].sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))) {
    for (const item of workout.items) {
      if (!item.exerciseId || efforts.has(item.exerciseId)) continue;
      const logged = item.sets.filter((set) => set.doneAt);
      if (logged.length === 0) continue;

      efforts.set(item.exerciseId, {
        on: workout.scheduledFor,
        sets: logged.map((set) => ({ weightKg: set.actualWeightKg, reps: set.actualReps })),
        feeling: workout.feeling,
      });
    }
  }

  return efforts;
}

/** Target against actual across recent sessions, per exercise. */
export async function getExerciseTrends(clientId: string, since: string): Promise<ExerciseTrend[]> {
  const workouts = (await getWorkouts(clientId))
    .filter((w) => w.scheduledFor >= since)
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

  const byExercise = new Map<string, ExerciseTrend>();

  for (const workout of workouts) {
    for (const item of workout.items) {
      if (!item.exerciseId) continue;
      const logged = item.sets.filter((set) => set.doneAt);
      if (logged.length === 0) continue;

      const trend = byExercise.get(item.exerciseId) ?? {
        exerciseId: item.exerciseId,
        name: item.label,
        sessions: [],
        slipping: false,
      };

      // The heaviest set is the one worth tracking; the rest are ramp-up.
      const top = logged.reduce((best, set) =>
        (set.actualWeightKg ?? 0) > (best.actualWeightKg ?? 0) ? set : best,
      );

      trend.sessions.push({
        on: workout.scheduledFor,
        targetReps: top.targetReps,
        actualReps: top.actualReps,
        targetWeightKg: top.targetWeightKg,
        actualWeightKg: top.actualWeightKg,
      });
      byExercise.set(item.exerciseId, trend);
    }
  }

  for (const trend of byExercise.values()) {
    const last = trend.sessions.slice(-2);
    trend.slipping =
      last.length === 2 && last.every((s) => s.targetReps !== null && (s.actualReps ?? 0) < s.targetReps);
  }

  return [...byExercise.values()];
}

/**
 * The food plan for a date: from the repeating block when it governs, falling
 * back to the old per-date rows before the block starts. Mirrors how workouts
 * resolve, so the two halves of a day behave the same way.
 */
export async function getPlannedFood(
  clientId: string,
  date: string,
): Promise<{ calorieTarget: number | null; proteinTarget: number | null; meals: PlanMealSlot[] }> {
  const planned = await getPlanDay(clientId, date, "food");

  if (planned.meals.length > 0 || planned.calorieTarget !== null) {
    return {
      calorieTarget: planned.calorieTarget,
      proteinTarget: planned.proteinTarget,
      meals: planned.meals,
    };
  }

  const legacy = await getFoodPlan(clientId, date);
  return {
    calorieTarget: legacy?.calorieTarget ?? null,
    proteinTarget: legacy?.proteinTarget ?? null,
    meals: [],
  };
}

export async function getMealLogs(clientId: string, date?: string): Promise<MealLog[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { mealLogs } = await demoData();
    return mealLogs.filter((log) => log.clientId === clientId && (!date || log.loggedFor === date));
  }

  let query = supabase.from("meal_logs").select("*").eq("client_id", clientId);
  if (date) query = query.eq("logged_for", date);
  const { data } = await query;
  return (data ?? []).map(toMealLog);
}

/** How much of what Dean assigned actually got eaten, over a window. */
export async function getMealAdherence(
  clientId: string,
  from: string,
  to: string,
): Promise<{ assigned: number; eaten: number }> {
  const [revisions, logs] = await Promise.all([loadRevisions(clientId), getMealLogs(clientId)]);
  let assigned = 0;

  for (let cursor = from; cursor <= to; cursor = shiftDate(cursor, 1)) {
    const { revision } = pickRevision(revisions, weekdayOf(cursor), "food", cursor);
    assigned += revision?.meals.length ?? 0;
  }

  const eaten = logs.filter((log) => log.loggedFor >= from && log.loggedFor <= to).length;
  return { assigned, eaten };
}

/**
 * What to buy for the next few days.
 *
 * Walks each day's planned meals, scales every ingredient by that meal's
 * multiplier, then merges lines that are the same ingredient in the same unit.
 * The unit has to match to merge — 200g and 2 whole are different things, and
 * adding them would be worse than listing them twice.
 */
export async function getShoppingList(clientId: string, from: string, days: number): Promise<ShoppingLine[]> {
  const [revisions, meals] = await Promise.all([loadRevisions(clientId), getMeals(true)]);
  const byMeal = new Map(meals.map((meal) => [meal.id, meal]));
  const lines = new Map<string, ShoppingLine>();

  for (let offset = 0; offset < days; offset += 1) {
    const date = shiftDate(from, offset);
    const { revision } = pickRevision(revisions, weekdayOf(date), "food", date);
    // Swaps are per date, so they are read inside the loop — a list that spans
    // a change should buy cod for the days after it and salmon for the days
    // before, not one or the other for the whole trip.
    const swaps = await getMealSwaps(clientId, date);
    for (const slot of revision?.meals ?? []) {
      const library = byMeal.get(slot.mealId);
      if (!library) continue;
      const meal = applySwaps(library, swaps);

      for (const ingredient of scaleMeal(meal, slot.multiplier).ingredients) {
        const key = `${ingredient.name.trim().toLowerCase()}|${ingredient.unit ?? ""}`;
        const existing = lines.get(key);

        if (existing) {
          existing.quantity =
            existing.quantity === null || ingredient.quantity === null
              ? existing.quantity
              : Number((existing.quantity + ingredient.quantity).toFixed(2));
          if (!existing.usedIn.includes(meal.name)) existing.usedIn.push(meal.name);
        } else {
          lines.set(key, {
            name: ingredient.name.trim(),
            unit: ingredient.unit,
            quantity: ingredient.quantity,
            usedIn: [meal.name],
          });
        }
      }
    }
  }

  return [...lines.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The portion Dean set for a meal on a date, or null when it is not on the
 * client's plan that day.
 *
 * Read from the plan rather than taken from the URL: the portion is coaching,
 * so a client must not be able to change it by editing a query string.
 */
export async function getAssignedPortion(
  clientId: string,
  date: string,
  mealId: string,
): Promise<number | null> {
  const planned = await getPlannedFood(clientId, date);
  return planned.meals.find((slot) => slot.meal.id === mealId)?.multiplier ?? null;
}

// ---------------------------------------------------------------------------
// Saved shopping lists
// ---------------------------------------------------------------------------

/** Items always come back in position order — that order is the whole point. */
function sortedItems(list: ShoppingList): ShoppingList {
  return { ...list, items: [...list.items].sort((a, b) => a.position - b.position) };
}

export async function getShoppingLists(clientId: string): Promise<ShoppingList[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { shoppingLists } = await demoData();
    return shoppingLists
      .filter((list) => list.clientId === clientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(sortedItems);
  }

  const { data } = await supabase
    .from("shopping_lists")
    .select("*, shopping_list_items(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toShoppingList);
}

export async function getShoppingListById(id: string): Promise<ShoppingList | null> {
  const supabase = await createClient();
  if (!supabase) {
    const { shoppingLists } = await demoData();
    const stored = shoppingLists.find((list) => list.id === id);
    return stored ? sortedItems(stored) : null;
  }

  const { data } = await supabase
    .from("shopping_lists")
    .select("*, shopping_list_items(*)")
    .eq("id", id)
    .maybeSingle();
  return data ? toShoppingList(data) : null;
}

/**
 * The order the client last left a list in, by ingredient name.
 *
 * Supermarkets are not laid out alphabetically, and nobody wants to re-sort
 * the same thirty items every week — so the shape of their shop is learned
 * from the last list rather than asked for again.
 */
export async function getLearnedOrder(clientId: string): Promise<Map<string, number>> {
  const [previous] = await getShoppingLists(clientId);
  if (!previous) return new Map();

  return new Map(
    [...previous.items]
      .sort((a, b) => a.position - b.position)
      .map((item, index) => [item.name.trim().toLowerCase(), index]),
  );
}

// ---------------------------------------------------------------------------
// The day's progress
// ---------------------------------------------------------------------------

export async function getDaySubmission(clientId: string, date: string): Promise<string | null> {
  return (await getDaySubmissionDetail(clientId, date))?.submittedAt ?? null;
}

/** The submission with what it recorded — what was missed, and why. */
export async function getDaySubmissionDetail(
  clientId: string,
  date: string,
): Promise<DaySubmission | null> {
  const supabase = await createClient();
  if (!supabase) {
    const { daySubmissions } = await demoData();
    return daySubmissions.find((e) => e.clientId === clientId && e.onDate === date) ?? null;
  }

  const { data } = await supabase
    .from("day_submissions")
    .select("*")
    .eq("client_id", clientId)
    .eq("on_date", date)
    .maybeSingle();
  return data
    ? {
        clientId,
        onDate: date,
        submittedAt: data.submitted_at,
        missed: data.missed ?? [],
        note: data.note ?? null,
      }
    : null;
}

/**
 * Recent days the client closed out with something outstanding.
 *
 * This is the list Dean acts on: a finished day with a reason attached tells
 * him whether the plan needs changing or the week was just a hard one.
 */
export async function getMissedDays(
  clientId: string,
  from: string,
  to: string,
): Promise<DaySubmission[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { daySubmissions } = await demoData();
    return daySubmissions
      .filter(
        (e) =>
          e.clientId === clientId && e.onDate >= from && e.onDate <= to && e.missed.length > 0,
      )
      .sort((a, b) => b.onDate.localeCompare(a.onDate));
  }

  const { data } = await supabase
    .from("day_submissions")
    .select("*")
    .eq("client_id", clientId)
    .gte("on_date", from)
    .lte("on_date", to)
    .order("on_date", { ascending: false });
  return (data ?? [])
    .map((row) => ({
      clientId,
      onDate: row.on_date,
      submittedAt: row.submitted_at,
      missed: (row.missed ?? []) as string[],
      note: row.note ?? null,
    }))
    .filter((entry) => entry.missed.length > 0);
}

/**
 * What is left to do today, per tab.
 *
 * Only counts what was actually asked: a rest day is not an outstanding
 * workout, and a day with no meals set is not an outstanding food day. That
 * matters because the tab bar nags in orange, and nagging about something
 * nobody asked for is how people stop reading it.
 */
export async function getDayProgress(clientId: string, date: string): Promise<DayProgress> {
  const [workout, planned, mealLogs, weights, submittedAt] = await Promise.all([
    getWorkoutFor(clientId, date),
    getPlannedFood(clientId, date),
    getMealLogs(clientId, date),
    getWeightEntries(clientId),
    getDaySubmission(clientId, date),
  ]);

  const workoutState: DayTaskState = !workout ? "none" : workout.completedAt ? "done" : "todo";

  const mealsPlanned = planned.meals.length;
  const eaten = new Set(mealLogs.map((log) => `${log.slot}:${log.mealId}`));
  const mealsEaten = planned.meals.filter((slot) =>
    eaten.has(`${slot.slot}:${slot.meal.id}`),
  ).length;
  const foodState: DayTaskState =
    mealsPlanned === 0 ? "none" : mealsEaten === mealsPlanned ? "done" : "todo";

  const weightState: DayTaskState = weights.some((entry) => entry.loggedFor === date)
    ? "done"
    : "todo";

  const states = [workoutState, foodState, weightState];
  const asked = states.filter((state) => state !== "none");
  const allDone = asked.length > 0 && asked.every((state) => state === "done");

  // Named one by one rather than as "food", because "you missed breakfast" is
  // something Dean can act on and "food incomplete" is not.
  const missed: string[] = [];
  if (workoutState === "todo") missed.push(workout?.title ?? "Today's workout");
  for (const slot of planned.meals) {
    if (eaten.has(`${slot.slot}:${slot.meal.id}`)) continue;
    const label = slot.slot.charAt(0).toUpperCase() + slot.slot.slice(1);
    missed.push(`${label} — ${slot.meal.name}`);
  }
  if (weightState === "todo") missed.push("Today's weight");

  return {
    date,
    workout: workoutState,
    food: foodState,
    weight: weightState,
    allDone,
    submittedAt,
    mealsEaten,
    mealsPlanned,
    missed,
  };
}

// ---------------------------------------------------------------------------
// Chat
//
// One thread per client. It is created by the first message rather than at
// signup, so a client who has never written to Dean costs nothing and his
// inbox is the people who have actually said something.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */

function toChatMessage(row: any): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    fromCoach: row.from_coach ?? false,
    body: row.body ?? null,
    attachmentPath: row.attachment_path ?? null,
    attachmentType: row.attachment_type ?? null,
    attachmentName: row.attachment_name ?? null,
    createdAt: row.created_at,
  };
}

function toChatThread(row: any): ChatThread {
  return {
    id: row.id,
    clientId: row.client_id,
    lastMessageAt: row.last_message_at ?? null,
    clientReadAt: row.client_read_at ?? null,
    coachReadAt: row.coach_read_at ?? null,
    closedAt: row.closed_at ?? null,
  };
}

/** The demo thread, assembled from the seed plus anything said since. */
async function demoThread(): Promise<{ thread: ChatThread; messages: ChatMessage[] }> {
  const social = await demoSocial();
  const messages = [...demoChatMessages, ...social.chatMessages].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return {
    thread: {
      id: DEMO_THREAD_ID,
      clientId: DEMO_CLIENT_ID,
      lastMessageAt: messages.at(-1)?.createdAt ?? null,
      clientReadAt: social.chatClientReadAt,
      coachReadAt: social.chatCoachReadAt,
      closedAt: social.chatClosedAt,
    },
    messages,
  };
}

export async function getThreadFor(clientId: string): Promise<ChatThread | null> {
  const supabase = await createClient();
  if (!supabase) return (await demoThread()).thread;

  const { data } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  return data ? toChatThread(data) : null;
}

export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  if (!supabase) return (await demoThread()).messages;

  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(toChatMessage);
}

/**
 * Dean's inbox.
 *
 * Two queries rather than one per thread: the threads with their client, then
 * every message in them in one go, folded down to a preview and an unread
 * count. A dozen threads should not be a dozen round trips.
 */
export async function getChatInbox(): Promise<ChatInboxRow[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { thread, messages } = await demoThread();
    if (messages.length === 0) return [];
    const client = demoProfiles.find((p) => p.id === DEMO_CLIENT_ID);
    return [
      {
        ...thread,
        clientName: client?.fullName ?? "Client",
        avatarUrl: client?.avatarUrl ?? null,
        preview: messages.at(-1)?.body ?? "Sent a file",
        unread: messages.filter(
          (m) => !m.fromCoach && (!thread.coachReadAt || m.createdAt > thread.coachReadAt),
        ).length,
      },
    ];
  }

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("*, client:profiles!chat_threads_client_id_fkey(full_name, avatar_url)")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const rows = threads ?? [];
  if (rows.length === 0) return [];

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("thread_id, body, attachment_name, from_coach, created_at")
    .in(
      "thread_id",
      rows.map((row: any) => row.id),
    )
    .order("created_at", { ascending: true });

  const byThread = new Map<string, any[]>();
  for (const message of messages ?? []) {
    const list = byThread.get(message.thread_id) ?? [];
    list.push(message);
    byThread.set(message.thread_id, list);
  }

  return rows.map((row: any) => {
    const thread = toChatThread(row);
    const list = byThread.get(thread.id) ?? [];
    const last = list.at(-1);
    return {
      ...thread,
      clientName: row.client?.full_name || "Client",
      avatarUrl: row.client?.avatar_url ?? null,
      preview: last ? (last.body || last.attachment_name || "Sent a file") : null,
      unread: list.filter(
        (m) => !m.from_coach && (!thread.coachReadAt || m.created_at > thread.coachReadAt),
      ).length,
    };
  });
}

/**
 * How many messages are waiting for whoever is looking.
 *
 * The badge in the header, and the only thing most page loads need to know
 * about chat — so it counts rather than fetching a conversation.
 */
export async function getUnreadChat(profile: Profile): Promise<number> {
  const supabase = await createClient();
  if (!supabase) {
    const { thread, messages } = await demoThread();
    const coach = profile.role === "admin";
    const since = coach ? thread.coachReadAt : thread.clientReadAt;
    return messages.filter((m) => m.fromCoach !== coach && (!since || m.createdAt > since)).length;
  }

  if (profile.role === "admin") {
    return (await getChatInbox()).reduce((total, row) => total + row.unread, 0);
  }

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id, client_read_at")
    .eq("client_id", profile.id)
    .maybeSingle();
  if (!thread) return 0;

  let query = supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", thread.id)
    .eq("from_coach", true);
  if (thread.client_read_at) query = query.gt("created_at", thread.client_read_at);

  const { count } = await query;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Change requests
// ---------------------------------------------------------------------------

function toChangeRequest(row: any): ChangeRequest {
  return {
    id: row.id,
    clientId: row.client_id,
    field: row.field,
    currentValue: row.current_value ?? null,
    requestedValue: row.requested_value,
    reason: row.reason ?? null,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? null,
  };
}

export async function getMyChangeRequests(clientId: string): Promise<ChangeRequest[]> {
  const supabase = await createClient();
  if (!supabase) {
    const social = await demoSocial();
    return social.changeRequests
      .filter((request) => request.clientId === clientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data } = await supabase
    .from("change_requests")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toChangeRequest);
}

export async function getChangeRequests(): Promise<ChangeRequestRow[]> {
  const supabase = await createClient();
  if (!supabase) {
    const social = await demoSocial();
    return social.changeRequests
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((request) => {
        const client = demoProfiles.find((p) => p.id === request.clientId);
        return {
          ...request,
          clientName: client?.fullName ?? "Client",
          avatarUrl: client?.avatarUrl ?? null,
        };
      });
  }

  const { data } = await supabase
    .from("change_requests")
    .select("*, client:profiles!change_requests_client_id_fkey(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => ({
    ...toChangeRequest(row),
    clientName: row.client?.full_name || "Client",
    avatarUrl: row.client?.avatar_url ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Notifications
//
// No filtering happens here. The select policy decides what comes back — a
// broadcast for everyone, a targeted one for its recipient — so a bug in this
// function cannot show somebody a notification meant for someone else.
// ---------------------------------------------------------------------------

function toNotification(row: any): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id ?? null,
    sentByName: row.sent_by_name || "Dean",
    title: row.title,
    body: row.body ?? null,
    actionHref: row.action_href ?? null,
    createdAt: row.created_at,
  };
}

export async function getNotifications(limit = 40): Promise<Notification[]> {
  const supabase = await createClient();
  if (!supabase) {
    const social = await demoSocial();
    return [...demoNotifications, ...social.notifications]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(toNotification);
}

/**
 * When this person last opened the bell.
 *
 * On their own auth metadata rather than a table, because a row per person per
 * notification to answer one question would be the largest table here inside a
 * year.
 */
export async function getNotificationsReadAt(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return (await demoSocial()).notificationsReadAt;

  const { data } = await supabase.auth.getUser();
  const value = data.user?.user_metadata?.notifications_read_at;
  return typeof value === "string" ? value : null;
}

export async function getUnreadNotifications(): Promise<number> {
  const [notifications, readAt] = await Promise.all([
    getNotifications(),
    getNotificationsReadAt(),
  ]);
  return notifications.filter((n) => !readAt || n.createdAt > readAt).length;
}

// ---------------------------------------------------------------------------
// The board
//
// One page of posts, then every like and every comment on them in one query
// each, then a single call to sign all the media. Three round trips whatever
// is on the wall, rather than three per post.
// ---------------------------------------------------------------------------

export async function getBoard(viewerId: string, limit = 30): Promise<BoardPost[]> {
  const supabase = await createClient();
  if (!supabase) {
    const social = await demoSocial();
    const comments = [...demoBoardComments, ...social.postComments];
    return [...demoPosts, ...social.posts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((post) => ({
        ...post,
        likedByMe: social.likes.includes(post.id),
        likes: post.likes + (social.likes.includes(post.id) ? 1 : 0),
        comments: comments
          .filter((comment) => comment.postId === post.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      }));
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = posts ?? [];
  if (rows.length === 0) return [];
  const ids = rows.map((row: any) => row.id);

  const paths = rows.flatMap((row: any) => (row.media_paths ?? []) as string[]);
  const [likes, comments, signed] = await Promise.all([
    supabase.from("post_likes").select("post_id, user_id").in("post_id", ids),
    supabase
      .from("post_comments")
      .select("*")
      .in("post_id", ids)
      .order("created_at", { ascending: true }),
    paths.length > 0
      ? supabase.storage.from("board").createSignedUrls(paths, SIGNED_URL_SECONDS)
      : Promise.resolve({ data: [] as Array<{ path: string | null; signedUrl: string }> }),
  ]);

  const urlByPath = new Map<string, string>();
  for (const entry of signed.data ?? []) {
    // A path that failed to sign comes back with no URL rather than throwing,
    // so one bad file leaves a gap in a post instead of blanking the board.
    if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
  }

  const likeRows = likes.data ?? [];
  const commentRows = comments.data ?? [];

  return rows.map((row: any) => {
    const mine = likeRows.filter((like: any) => like.post_id === row.id);
    return {
      id: row.id,
      authorId: row.author_id,
      authorName: row.author_name || "Someone",
      authorAvatarUrl: row.author_avatar_url ?? null,
      fromCoach: row.from_coach ?? false,
      body: row.body,
      media: ((row.media_paths ?? []) as string[])
        .map((path) => urlByPath.get(path))
        .filter((url): url is string => Boolean(url)),
      tagged: (row.tagged ?? []) as BoardAudience[],
      likes: mine.length,
      likedByMe: mine.some((like: any) => like.user_id === viewerId),
      comments: commentRows
        .filter((comment: any) => comment.post_id === row.id)
        .map(toBoardComment),
      createdAt: row.created_at,
    };
  });
}

function toBoardComment(row: any): BoardComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: row.author_name || "Someone",
    authorAvatarUrl: row.author_avatar_url ?? null,
    fromCoach: row.from_coach ?? false,
    body: row.body,
    createdAt: row.created_at,
  };
}

/**
 * Whether this person may see the board at all.
 *
 * The same question `has_community_access` asks in every policy on it, asked
 * here so a page never renders a door the database will not open.
 */
export function hasBoardAccess(profile: Profile): boolean {
  return profile.role === "admin" || profile.status === "active" || profile.status === "paused";
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Dean.
 *
 * His profile row is readable by everyone signed in — the "read the coach"
 * policy exists for exactly this — because his name and face are on every
 * message, comment and announcement a client reads.
 */
export async function getCoach(): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return demoProfiles.find((p) => p.role === "admin") ?? null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "admin")
    .order("started_on", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ? toProfile(data) : null;
}
