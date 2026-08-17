import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_ADMIN_ID,
  DEMO_CLIENT_ID,
  demoComments,
  demoDayPlans,
  demoFoodLogs,
  demoFoodPlans,
  demoProfiles,
  demoSessionPlans,
  demoSessions,
  demoWeightEntries,
  demoWorkouts,
} from "./demo";
import type {
  ClientOverview,
  CoachSession,
  Comment,
  CommentTarget,
  DashboardSummary,
  DayPlan,
  FoodLog,
  FoodPlan,
  Profile,
  SessionPlan,
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
    completedAt: row.completed_at ?? null,
    items: (row.workout_items ?? [])
      .map((item: any) => ({
        id: item.id,
        workoutId: item.workout_id,
        position: item.position,
        label: item.label,
        target: item.target ?? null,
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
    .select("*, workout_items(*)")
    .eq("client_id", clientId)
    .order("scheduled_for", { ascending: false });
  return (data ?? []).map(toWorkout);
}

export async function getWorkoutFor(clientId: string, date: string): Promise<Workout | null> {
  const workouts = await getWorkouts(clientId);
  return workouts.find((w) => w.scheduledFor === date) ?? null;
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
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboard(profile: Profile): Promise<DashboardSummary> {
  const date = today();
  const [sessions, workouts, workout, foodPlan, foodLogs, weights, comments] = await Promise.all([
    getSessions(profile.id),
    getWorkouts(profile.id),
    getWorkoutFor(profile.id, date),
    getFoodPlan(profile.id),
    getFoodLogs(profile.id, date),
    getWeightEntries(profile.id),
    getComments(profile.id),
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

  return {
    profile,
    nextSession,
    nextWorkout,
    todaysWorkout: workout,
    foodPlan,
    todaysCalories: sumCalories(foodLogs),
    latestWeight: weights[0] ?? null,
    unreadComments: comments.filter((c) => c.readAt === null && c.authorRole === "admin"),
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
