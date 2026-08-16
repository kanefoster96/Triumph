/**
 * Members' area domain models.
 *
 * These mirror the tables in supabase/migrations/0001_init.sql. Like the
 * marketing types they carry no React or DOM dependency, so the React Native
 * app can import them as-is.
 */

export type UserRole = "client" | "admin";
export type ClientStatus = "active" | "paused";
export type SessionStatus = "scheduled" | "completed" | "cancelled";
export type CommentTarget = "workout" | "food_log" | "weight_entry" | "session";

export interface Profile {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  status: ClientStatus;
  goal: string | null;
  startedOn: string;
}

export interface CoachSession {
  id: string;
  clientId: string;
  /** ISO timestamp. */
  startsAt: string;
  durationMinutes: number;
  /** "Online" or a Newcastle address. */
  location: string;
  status: SessionStatus;
  coachNotes: string | null;
}

export interface WorkoutItem {
  id: string;
  workoutId: string;
  position: number;
  label: string;
  target: string | null;
  done: boolean;
  doneAt: string | null;
}

export interface Workout {
  id: string;
  clientId: string;
  /** ISO date, no time. */
  scheduledFor: string;
  title: string;
  coachNotes: string | null;
  clientNote: string | null;
  completedAt: string | null;
  items: WorkoutItem[];
}

export interface FoodPlanMeal {
  id: string;
  position: number;
  name: string;
  ingredients: string | null;
  calories: number | null;
}

export interface FoodPlan {
  id: string;
  clientId: string;
  /** The date this plan applies to. */
  assignedFor: string;
  /** Either of these may be null — Dean can set meals, a target, or both. */
  calorieTarget: number | null;
  proteinTarget: number | null;
  notes: string | null;
  meals: FoodPlanMeal[];
}

/** A reusable workout Dean builds once and assigns to many days. */
export interface SessionPlan {
  id: string;
  name: string;
  notes: string | null;
  items: Array<{ id: string; position: number; label: string; target: string | null }>;
}

/** A reusable day of food — a calorie target, meals, or both. */
export interface DayPlan {
  id: string;
  name: string;
  calorieTarget: number | null;
  proteinTarget: number | null;
  notes: string | null;
  meals: FoodPlanMeal[];
}

/** Result of painting a plan across a date range. */
export interface AssignmentResult {
  assigned: number;
  skipped: number;
  from: string;
  to: string;
}

export interface FoodLog {
  id: string;
  clientId: string;
  loggedFor: string;
  calories: number;
  note: string | null;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  clientId: string;
  loggedFor: string;
  weightKg: number;
  note: string | null;
}

export interface Comment {
  id: string;
  clientId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  targetType: CommentTarget;
  targetId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

/** Everything the client dashboard needs, in one round trip. */
export interface DashboardSummary {
  profile: Profile;
  nextSession: CoachSession | null;
  todaysWorkout: Workout | null;
  foodPlan: FoodPlan | null;
  todaysCalories: number;
  latestWeight: WeightEntry | null;
  unreadComments: Comment[];
}

/** A row in Dean's client list. */
export interface ClientOverview {
  profile: Profile;
  lastActivityAt: string | null;
  /** Simple heuristic — see `deriveTrack`. */
  onTrack: boolean;
  todaysWorkoutDone: boolean;
  /** Ticked items over total, for today's workout. */
  todaysWorkoutProgress: { done: number; total: number } | null;
  todaysCalories: number;
  calorieTarget: number | null;
  latestWeight: WeightEntry | null;
  nextSession: CoachSession | null;
}
