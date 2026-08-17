import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_ADMIN_ID,
  DEMO_CLIENT_ID,
  demoCheckIns,
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
  CheckIn,
  CheckInSummary,
  ClientNote,
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
      const [workouts, foodLogs, weights, assignedFood, foodPlan, checkIns] = await Promise.all([
        getWorkouts(profile.id),
        getFoodLogs(profile.id),
        getWeightEntries(profile.id),
        getAssignedFoodDates(profile.id),
        getFoodPlan(profile.id),
        getCheckIns(profile.id),
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

      // Oldest to newest inside the window, so the change reads as a delta.
      const windowWeights = weights.filter((w) => inWindow(w.loggedFor)).reverse();
      const weightChangeKg =
        windowWeights.length >= 2
          ? Number((windowWeights[windowWeights.length - 1].weightKg - windowWeights[0].weightKg).toFixed(1))
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

      const notes = gatherNotes(workouts, foodLogs, weights, periodStart, periodEnd);
      const lastCheckIn = checkIns[0] ?? null;
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
        weightChangeKg,
        notes,
        trainingDays,
        plannedThrough,
        lastCheckIn,
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
