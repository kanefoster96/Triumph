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
export type CommentTarget = "workout" | "food_log" | "weight_entry" | "session" | "check_in";
export type CheckInOutcome = "continued" | "adjusted";

export interface Profile {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  status: ClientStatus;
  goal: string | null;
  startedOn: string;
}

/**
 * Time with Dean, in person. Online clients do not have these — their coaching
 * is the workouts and food Dean plans for them, so they only ever see
 * `Workout` rows.
 */
export interface CoachSession {
  id: string;
  clientId: string;
  /** ISO timestamp. */
  startsAt: string;
  durationMinutes: number;
  /** Where they are meeting — always a real place. */
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
  /** "18:00" when Dean suggested one, otherwise null — do it any time. */
  suggestedTime: string | null;
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
  /** Only in-person clients ever have one of these. */
  nextSession: CoachSession | null;
  /** The next workout after today — what an online client is looking for. */
  nextWorkout: Workout | null;
  todaysWorkout: Workout | null;
  foodPlan: FoodPlan | null;
  todaysCalories: number;
  latestWeight: WeightEntry | null;
  unreadComments: Comment[];
}

/** One weekly decision about a client: carry on, or change something. */
export interface CheckIn {
  id: string;
  clientId: string;
  coachId: string;
  /** The stretch Dean reviewed. */
  periodStart: string;
  periodEnd: string;
  outcome: CheckInOutcome;
  /** What Dean wrote to the client. */
  note: string;
  /** Weeks written forward by this check-in. */
  weeksPlanned: number;
  nextReviewOn: string;
  createdAt: string;
}

/** Something the client wrote, pulled together for Dean to read in one go. */
export interface ClientNote {
  id: string;
  kind: "workout" | "food" | "weight";
  /** ISO date the note is about. */
  on: string;
  body: string;
  /** The workout title, meal note context, and so on. */
  context: string | null;
}

/**
 * One client's row on the check-in board: how the last stretch actually went,
 * what they said about it, and how far ahead they are covered.
 */
export interface CheckInSummary {
  profile: Profile;
  periodStart: string;
  periodEnd: string;
  workoutsAssigned: number;
  workoutsCompleted: number;
  /** Days in the window with at least one food log. */
  foodLoggedDays: number;
  windowDays: number;
  averageCalories: number | null;
  calorieTarget: number | null;
  /** Negative means they lost weight over the window. */
  weightChangeKg: number | null;
  notes: ClientNote[];
  /**
   * Weekdays they have actually been training on lately (0 = Sunday). This is
   * the shape "continue" repeats, so the UI can name it before Dean commits.
   */
  trainingDays: number[];
  /** Last date with a workout or food plan assigned; null when nothing is. */
  plannedThrough: string | null;
  lastCheckIn: CheckIn | null;
  /** Why this client needs a look. Empty means nothing stands out. */
  flags: string[];
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
