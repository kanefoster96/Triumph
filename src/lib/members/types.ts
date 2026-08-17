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
  /** Legacy free-text target. Days built from the library use `sets` instead. */
  target: string | null;
  /** Links back to the library for trends; null on legacy free-text days. */
  exerciseId: string | null;
  muscleGroup: string | null;
  equipment: string | null;
  howTo: string | null;
  /** Set when the client passed on it, with their reason. */
  skippedReason: string | null;
  sets: WorkoutSet[];
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
  /** 5 (most positive) down to 1, asked once the workout is finished. */
  feeling: number | null;
  completedAt: string | null;
  items: WorkoutItem[];
  /** True when this day came from the plan and has not been started yet. */
  fromPlan: boolean;
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
  /** Dean's latest word on how it is going, and the thread under it. */
  latestCheckIn: CheckIn | null;
  checkInComments: Comment[];
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
  /** Mean weight across the window. Day-to-day readings swing too much to use. */
  averageWeightKg: number | null;
  /**
   * This window's average against the previous window's average. Negative means
   * they lost weight. Null until there are entries in both windows — an
   * endpoint-to-endpoint delta would report water, not progress.
   */
  weightChangeKg: number | null;
  notes: ClientNote[];
  /**
   * Weekdays they have actually been training on lately (0 = Sunday). This is
   * the shape "continue" repeats, so the UI can name it before Dean commits.
   */
  trainingDays: number[];
  /** Last date with a workout or food plan assigned; null when nothing is. */
  plannedThrough: string | null;
  /** What is already queued from tomorrow — what "adjust" would replace. */
  plannedAhead: { workouts: number; foodDays: number };
  lastCheckIn: CheckIn | null;
  /** Most recent first, so Dean can see what he said before writing again. */
  recentCheckIns: CheckIn[];
  /** Replies on those check-ins, both directions. */
  checkInComments: Comment[];
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

// ---------------------------------------------------------------------------
// Libraries
// ---------------------------------------------------------------------------

export type MealTag = "breakfast" | "lunch" | "dinner" | "snack";
export type PlanKind = "workout" | "food";

/** Reusable across every client. Archived rather than deleted. */
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  /** Optional cue, shown to the client while they train. */
  howTo: string | null;
  archivedAt: string | null;
}

/**
 * The units an ingredient can be measured in.
 *
 * A closed list rather than free text because the shopping list merges lines
 * by name and unit — "200 g" and "200 grams" have to be the same thing or the
 * list doubles up. "whole" covers a banana or an egg, which is why a quantity
 * can always carry a unit.
 */
export const UNITS = ["g", "kg", "ml", "l", "whole", "slice", "clove", "tbsp", "tsp", "handful"] as const;

export type Unit = (typeof UNITS)[number];

export interface Ingredient {
  id: string;
  position: number;
  name: string;
  /** Kept apart from the unit so a shopping list can scale and merge. */
  quantity: number | null;
  /** Required whenever there is a quantity; null only for "some parsley". */
  unit: string | null;
}

/** An ingredient with an amount but no unit cannot be scaled or merged. */
export function needsUnit(ingredient: Pick<Ingredient, "quantity" | "unit">): boolean {
  return ingredient.quantity !== null && !ingredient.unit;
}

/** Units that are counted rather than measured, so they take a plural. */
const COUNTABLE = new Set(["slice", "clove", "handful"]);

/**
 * An amount as a person would write it: "2 slices", "250 ml", and a bare "3"
 * for whole things, because nobody says "3 whole eggs" on a shopping list.
 */
export function formatAmount(quantity: number | null, unit: string | null): string {
  if (quantity === null) return "—";
  const value = Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(2)));

  if (!unit || unit === "whole") return value;
  if (COUNTABLE.has(unit)) return `${value} ${unit}${quantity === 1 ? "" : "s"}`;
  return `${value} ${unit}`;
}

export interface Meal {
  id: string;
  name: string;
  tag: MealTag;
  /** Per single serving; a plan slot scales these. */
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  ingredients: Ingredient[];
  /** Ordered steps, never containing quantities. May be empty. */
  method: string[];
  archivedAt: string | null;
}

/** A meal with every amount already scaled by a client's multiplier. */
export interface ScaledMeal {
  meal: Meal;
  multiplier: number;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  ingredients: Array<Ingredient & { quantity: number | null }>;
}

// ---------------------------------------------------------------------------
// The repeating plan
// ---------------------------------------------------------------------------

export interface PlanBlock {
  id: string;
  clientId: string;
  /** 1 = the same week every week, 2 = alternating weeks. */
  cycleWeeks: number;
  /** Anchors day 0 and is the date the block takes over from the old system. */
  startsOn: string;
}

/** One set's target. Sets differ — 10 / 8 / 6 up a ladder is the normal case. */
export interface PlanSet {
  id: string;
  position: number;
  targetWeightKg: number | null;
  targetReps: number | null;
}

export interface PlanExercise {
  id: string;
  position: number;
  exerciseId: string;
  /** Snapshot-free: read live from the library so corrections propagate. */
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  howTo: string | null;
  /** True when the library item has been archived out from under the plan. */
  archived: boolean;
  notes: string | null;
  sets: PlanSet[];
}

export interface PlanMealSlot {
  id: string;
  slot: MealTag;
  position: number;
  meal: Meal;
  multiplier: number;
  archived: boolean;
}

/**
 * One day of the cycle as it stands on a given date. `revisionId` is null when
 * the day has never been set.
 */
export interface PlanDay {
  revisionId: string | null;
  dayIndex: number;
  kind: PlanKind;
  isRest: boolean;
  /** Whether this came from a one-off change rather than the repeating shape. */
  oneOff: boolean;
  title: string | null;
  suggestedTime: string | null;
  coachNotes: string | null;
  calorieTarget: number | null;
  proteinTarget: number | null;
  exercises: PlanExercise[];
  meals: PlanMealSlot[];
}

/** How far an edit reaches. */
export type EditScope = "date" | "weekday";

// ---------------------------------------------------------------------------
// Logged training
// ---------------------------------------------------------------------------

export interface WorkoutSet {
  id: string;
  position: number;
  targetWeightKg: number | null;
  targetReps: number | null;
  actualWeightKg: number | null;
  actualReps: number | null;
  doneAt: string | null;
}

/** What the client last did on an exercise, shown beside the next target. */
export interface LastEffort {
  on: string;
  sets: Array<{ weightKg: number | null; reps: number | null }>;
  feeling: number | null;
}

export interface MealLog {
  id: string;
  clientId: string;
  loggedFor: string;
  slot: MealTag;
  mealId: string | null;
  name: string;
  multiplier: number;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

export interface FoodDayFeedback {
  clientId: string;
  loggedFor: string;
  feeling: number | null;
  note: string | null;
}

/** One line of a shopping list, merged across every meal that needs it. */
export interface ShoppingLine {
  name: string;
  unit: string | null;
  quantity: number | null;
  /** Meals it is needed for, so the client can see why it is on the list. */
  usedIn: string[];
}

// ---------------------------------------------------------------------------
// Review signals
// ---------------------------------------------------------------------------

/** Target against actual for one exercise across recent sessions. */
export interface ExerciseTrend {
  exerciseId: string;
  name: string;
  sessions: Array<{
    on: string;
    targetReps: number | null;
    actualReps: number | null;
    targetWeightKg: number | null;
    actualWeightKg: number | null;
  }>;
  /** True when actual reps fell short of target in the last two sessions. */
  slipping: boolean;
}
