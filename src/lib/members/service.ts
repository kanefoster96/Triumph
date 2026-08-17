import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_ADMIN_ID,
  DEMO_CLIENT_ID,
  demoCheckIns,
  demoComments,
  demoExercises,
  demoMeals,
  demoMealLogs,
  demoPlanBlocks,
  demoPlanRevisions,
  demoDayPlans,
  demoFoodLogs,
  demoFoodPlans,
  demoProfiles,
  demoSessionPlans,
  demoSessions,
  demoShoppingLists,
  demoWeightEntries,
  demoWorkouts,
} from "./demo";
import type {
  CheckIn,
  CheckInSummary,
  ClientNote,
  ClientOverview,
  CoachSession,
  Comment,
  CommentTarget,
  DashboardSummary,
  DayPlan,
  Exercise,
  ExerciseTrend,
  LastEffort,
  FoodLog,
  FoodPlan,
  Meal,
  MealLog,
  PlanBlock,
  PlanDay,
  PlanKind,
  PlanMealSlot,
  PlanSet,
  Profile,
  ScaledMeal,
  SessionPlan,
  ShoppingLine,
  ShoppingList,
  SessionStatus,
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

function toPlanBlock(row: any): PlanBlock {
  return {
    id: row.id,
    clientId: row.client_id,
    cycleWeeks: row.cycle_weeks,
    startsOn: row.starts_on,
  };
}

function toRevision(row: any): RawRevision {
  return {
    id: row.id,
    blockId: row.block_id,
    dayIndex: row.day_index,
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
    const role = store.get(DEMO_ROLE_COOKIE)?.value;
    if (role !== "client" && role !== "admin") return null;
    const id = role === "admin" ? DEMO_ADMIN_ID : DEMO_CLIENT_ID;
    return demoProfiles.find((p) => p.id === id) ?? null;
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

export async function getWorkouts(clientId: string): Promise<Workout[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoWorkouts
      .filter((w) => w.clientId === clientId)
      .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
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
 * did. Otherwise it is generated from the repeating plan. Dates before the
 * block starts have no plan to generate from, which is how every day assigned
 * under the old system stays exactly as it was.
 */
export async function getWorkoutFor(clientId: string, date: string): Promise<Workout | null> {
  const [workouts, block] = await Promise.all([getWorkouts(clientId), getPlanBlock(clientId)]);
  const logged = workouts.find((w) => w.scheduledFor === date);
  if (logged) return logged;
  if (!block) return null;

  const planned = await getPlanDay(block, date, "workout");
  if (!planned || planned.isRest || planned.exercises.length === 0) return null;
  return workoutFromPlan(clientId, date, planned);
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
  const [workouts, block] = await Promise.all([getWorkouts(clientId), getPlanBlock(clientId)]);
  const dates = new Set(
    workouts.filter((w) => w.scheduledFor >= from && w.scheduledFor <= to).map((w) => w.scheduledFor),
  );

  if (block) {
    const revisions = await loadRevisions(block.id);
    for (let cursor = from; cursor <= to; cursor = shiftDate(cursor, 1)) {
      const dayIndex = dayIndexFor(block, cursor);
      if (dayIndex === null) continue;
      const { revision } = pickRevision(revisions, dayIndex, "workout", cursor);
      if (revision && !revision.isRest && revision.exercises.length > 0) dates.add(cursor);
    }
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

export async function getSessionPlans(): Promise<SessionPlan[]> {
  const supabase = await createClient();
  if (!supabase) return demoSessionPlans;

  const { data } = await supabase.from("session_plans").select("*, session_plan_items(*)").order("name");

  /* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    notes: row.notes ?? null,
    items: (row.session_plan_items ?? [])
      .map((item: any) => ({
        id: item.id,
        position: item.position,
        label: item.label,
        target: item.target ?? null,
      }))
      .sort((a: any, b: any) => a.position - b.position),
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function getDayPlans(): Promise<DayPlan[]> {
  const supabase = await createClient();
  if (!supabase) return demoDayPlans;

  const { data } = await supabase.from("day_plans").select("*, day_plan_meals(*)").order("name");

  /* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    calorieTarget: row.calorie_target ?? null,
    proteinTarget: row.protein_target ?? null,
    notes: row.notes ?? null,
    meals: (row.day_plan_meals ?? [])
      .map((meal: any) => ({
        id: meal.id,
        position: meal.position,
        name: meal.name,
        ingredients: meal.ingredients ?? null,
        calories: meal.calories ?? null,
      }))
      .sort((a: any, b: any) => a.position - b.position),
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function getFoodLogs(clientId: string, date?: string): Promise<FoodLog[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoFoodLogs
      .filter((l) => l.clientId === clientId && (!date || l.loggedFor === date))
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
    return demoWeightEntries
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
    return demoComments
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
function gatherNotes(
  workouts: Workout[],
  foodLogs: FoodLog[],
  weights: WeightEntry[],
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
      const [workouts, foodLogs, weights, assignedFood, foodPlan, checkIns, comments] = await Promise.all([
        getWorkouts(profile.id),
        getFoodLogs(profile.id),
        getWeightEntries(profile.id),
        getAssignedFoodDates(profile.id),
        getFoodPlan(profile.id),
        getCheckIns(profile.id),
        getComments(profile.id),
      ]);

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

      const lastWorkoutDay =
        workouts
          .map((w) => w.scheduledFor)
          .sort()
          .at(-1) ?? null;
      const lastFoodDay =
        assignedFood
          .map((p) => p.assignedFor)
          .sort()
          .at(-1) ?? null;
      const plannedThrough =
        [lastWorkoutDay, lastFoodDay]
          .filter((d): d is string => Boolean(d))
          .sort()
          .at(-1) ?? null;

      // What "adjust" would replace: everything queued from tomorrow onwards.
      const tomorrow = shiftDate(periodEnd, 1);
      const plannedAhead = {
        workouts: workouts.filter((w) => w.scheduledFor >= tomorrow).length,
        foodDays: assignedFood.filter((p) => p.assignedFor >= tomorrow).length,
      };

      const notes = gatherNotes(workouts, foodLogs, weights, periodStart, periodEnd);
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
      if (notes.length > 0) {
        flags.push(notes.length === 1 ? "Left a note" : `Left ${notes.length} notes`);
      }
      if (!plannedThrough) {
        flags.push("Nothing assigned");
      } else if (plannedThrough < shiftDate(periodEnd, 7)) {
        flags.push("Plan runs out within a week");
      }
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
        plannedThrough,
        plannedAhead,
        lastCheckIn,
        recentCheckIns,
        checkInComments,
        flags,
      };
    }),
  );

  // Anyone needing a look comes first, then whoever runs out of plan soonest.
  return rows.sort((a, b) => {
    if (Boolean(a.flags.length) !== Boolean(b.flags.length)) return a.flags.length ? -1 : 1;
    const aThrough = a.plannedThrough ?? "";
    const bThrough = b.plannedThrough ?? "";
    if (aThrough !== bThrough) return aThrough.localeCompare(bThrough);
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

  const profiles = supabase
    ? ((await supabase.from("profiles").select("*").eq("role", "client").order("full_name")).data ?? []).map(
        toProfile,
      )
    : demoProfiles.filter((p) => p.role === "client");

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
export async function getClients(): Promise<Profile[]> {
  const supabase = await createClient();
  if (!supabase) {
    return demoProfiles
      .filter((p) => p.role === "client")
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  const { data } = await supabase.from("profiles").select("*").eq("role", "client").order("full_name");
  return (data ?? []).map(toProfile);
}

export async function getProfile(clientId: string): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return demoProfiles.find((p) => p.id === clientId) ?? null;

  const { data } = await supabase.from("profiles").select("*").eq("id", clientId).single();
  return data ? toProfile(data) : null;
}

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
 * Which day of the cycle a date lands on. Negative dates — before the block
 * starts — return null, because the block does not govern them.
 */
export function dayIndexFor(block: PlanBlock, date: string): number | null {
  const offset = daysBetween(block.startsOn, date);
  if (offset < 0) return null;
  return offset % (block.cycleWeeks * 7);
}

export async function getPlanBlock(clientId: string): Promise<PlanBlock | null> {
  const supabase = await createClient();
  if (!supabase) return demoPlanBlocks.find((b) => b.clientId === clientId) ?? null;

  const { data } = await supabase.from("plan_blocks").select("*").eq("client_id", clientId).maybeSingle();
  return data ? toPlanBlock(data) : null;
}

/** Hydrate a revision's exercises and meals from the libraries. */
function buildPlanDay(
  revision: RawRevision | null,
  dayIndex: number,
  kind: PlanKind,
  exercises: Exercise[],
  meals: Meal[],
  oneOff: boolean,
): PlanDay {
  const byExercise = new Map(exercises.map((e) => [e.id, e]));
  const byMeal = new Map(meals.map((m) => [m.id, m]));

  return {
    revisionId: revision?.id ?? null,
    dayIndex,
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
 * Pick the revision that governs a date.
 *
 * A one-off for exactly this date wins; otherwise the newest revision for this
 * weekday that has already come into effect. Because revisions are only ever
 * inserted, and never dated before today, a past date always resolves to what
 * was true at the time.
 */
function pickRevision(revisions: RawRevision[], dayIndex: number, kind: PlanKind, date: string) {
  const forKind = revisions.filter((r) => r.kind === kind);

  const oneOff = forKind.find((r) => r.onlyOn === date);
  if (oneOff) return { revision: oneOff, oneOff: true };

  const repeating = forKind
    .filter((r) => !r.onlyOn && r.dayIndex === dayIndex && r.effectiveFrom <= date)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

  return { revision: repeating.at(-1) ?? null, oneOff: false };
}

async function loadRevisions(blockId: string): Promise<RawRevision[]> {
  const supabase = await createClient();
  if (!supabase) return demoPlanRevisions.filter((r) => r.blockId === blockId);

  const { data } = await supabase
    .from("plan_day_revisions")
    .select("*, plan_exercises(*, plan_sets(*)), plan_meal_slots(*)")
    .eq("block_id", blockId);
  return (data ?? []).map(toRevision);
}

/** What the client is meant to do on a date, or null if the block predates it. */
export async function getPlanDay(block: PlanBlock, date: string, kind: PlanKind): Promise<PlanDay | null> {
  const dayIndex = dayIndexFor(block, date);
  if (dayIndex === null) return null;

  const [revisions, exercises, meals] = await Promise.all([
    loadRevisions(block.id),
    getExercises(true),
    getMeals(true),
  ]);

  const { revision, oneOff } = pickRevision(revisions, dayIndex, kind, date);
  return buildPlanDay(revision, dayIndex, kind, exercises, meals, oneOff);
}

/**
 * The whole cycle as it stands on a date — what the editor shows. One entry per
 * day of the block, in order.
 */
export async function getPlanCycle(block: PlanBlock, onDate: string, kind: PlanKind): Promise<PlanDay[]> {
  const [revisions, exercises, meals] = await Promise.all([
    loadRevisions(block.id),
    getExercises(true),
    getMeals(true),
  ]);

  return Array.from({ length: block.cycleWeeks * 7 }, (_, dayIndex) => {
    // The cycle view is about the repeating shape, so one-off changes to a
    // particular date are deliberately not folded in here.
    const repeating = revisions
      .filter((r) => r.kind === kind && !r.onlyOn && r.dayIndex === dayIndex && r.effectiveFrom <= onDate)
      .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

    return buildPlanDay(repeating.at(-1) ?? null, dayIndex, kind, exercises, meals, false);
  });
}

/**
 * A plan revision before its library items are joined on. Shared between the
 * Supabase mapper and the demo fixture so both feed the same resolver.
 */
export interface RawRevision {
  id: string;
  blockId: string;
  dayIndex: number;
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
  const block = await getPlanBlock(clientId);
  const planned = block ? await getPlanDay(block, date, "food") : null;

  if (planned && (planned.meals.length > 0 || planned.calorieTarget !== null)) {
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
    return demoMealLogs.filter((log) => log.clientId === clientId && (!date || log.loggedFor === date));
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
  const block = await getPlanBlock(clientId);
  if (!block) return { assigned: 0, eaten: 0 };

  const [revisions, logs] = await Promise.all([loadRevisions(block.id), getMealLogs(clientId)]);
  let assigned = 0;

  for (let cursor = from; cursor <= to; cursor = shiftDate(cursor, 1)) {
    const dayIndex = dayIndexFor(block, cursor);
    if (dayIndex === null) continue;
    const { revision } = pickRevision(revisions, dayIndex, "food", cursor);
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
  const block = await getPlanBlock(clientId);
  if (!block) return [];

  const [revisions, meals] = await Promise.all([loadRevisions(block.id), getMeals(true)]);
  const byMeal = new Map(meals.map((meal) => [meal.id, meal]));
  const lines = new Map<string, ShoppingLine>();

  for (let offset = 0; offset < days; offset += 1) {
    const date = shiftDate(from, offset);
    const dayIndex = dayIndexFor(block, date);
    if (dayIndex === null) continue;

    const { revision } = pickRevision(revisions, dayIndex, "food", date);
    for (const slot of revision?.meals ?? []) {
      const meal = byMeal.get(slot.mealId);
      if (!meal) continue;

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
    return demoShoppingLists
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
    const stored = demoShoppingLists.find((list) => list.id === id);
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
