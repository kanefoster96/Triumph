/**
 * Members' area domain models.
 *
 * These mirror the tables in supabase/migrations/0001_init.sql. Like the
 * marketing types they carry no React or DOM dependency, so the React Native
 * app can import them as-is.
 */

export type UserRole = "client" | "admin";
/**
 * "applicant" is somebody who has signed up and is waiting on Dean. They have
 * a real account and can sign in — they just have no plan yet, and they are
 * not in his client list until he enrols them.
 */
/**
 * What an account is to Dean.
 *
 * `basic` is somebody who made an account and nothing more — they can sign in
 * and look round, they are not waiting on him and they are not his client.
 * `applicant` has asked to train. `active` is somebody he has taken on.
 */
export type ClientStatus = "basic" | "applicant" | "active" | "paused";
export type SessionStatus = "scheduled" | "completed" | "cancelled";
export type CommentTarget = "workout" | "food_log" | "weight_entry" | "session" | "check_in";
export type CheckInOutcome = "continued" | "adjusted";

/**
 * Who builds a client's food week.
 *
 * "coach" is the default and how Dean works with most people: he assigns the
 * meals and the client simply follows the finished plan. "self" is for a
 * client who plans their own food to the targets Dean sets — they get the same
 * slot editor he has, against a read-only meal library.
 *
 * The mode only decides who may edit. Everything downstream — shopping lists,
 * method pages, tick-offs, adherence, check-in flags — reads the same plan and
 * does not care who wrote it.
 */
export type FoodMode = "coach" | "self";

/**
 * How somebody is coached.
 *
 * "online" is most people: their week is the workouts and food Dean plans, and
 * they never see him. "one_to_one" is somebody he trains in person as well —
 * they get everything an online client gets, plus sessions in the diary. It
 * changes what Dean books, not what they can use.
 *
 * Only ever set by Dean, when he enrols somebody. The public site offers
 * online, because that is what somebody can sign up to without talking to him.
 */
export type CoachingMode = "online" | "one_to_one";

export const COACHING_LABELS: Record<CoachingMode, string> = {
  online: "Online",
  one_to_one: "1-to-1",
};

export interface Profile {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  status: ClientStatus;
  goal: string | null;
  startedOn: string;
  foodMode: FoodMode;
  coachingMode: CoachingMode;
  /**
   * A photo, when there is one. Null falls back to initials — which is most of
   * the time, and has to look deliberate rather than like a missing image.
   */
  avatarUrl: string | null;
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




/**
 * Something eaten that was not on the plan.
 *
 * Macros are optional: a client who knows them can put them in and keep the
 * ring honest, and one who does not should still be able to log the calories
 * rather than log nothing. What is unaccounted for is shown as such instead of
 * being silently left out of the breakdown.
 */
export interface FoodLog {
  id: string;
  clientId: string;
  loggedFor: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
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
  /**
   * Days they closed out with something still outstanding, newest first. Each
   * carries their own reason — the difference between a plan that does not fit
   * and a week that was simply hard.
   */
  missedDays: DaySubmission[];
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
// The plan
// ---------------------------------------------------------------------------

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
 * One date's plan. `revisionId` is null when nothing has ever been set for
 * that date, which reads as a rest day.
 */
export interface PlanDay {
  revisionId: string | null;
  /** 0 = Monday … 6 = Sunday. Which weekday's standing plan this came from. */
  weekday: number;
  kind: PlanKind;
  isRest: boolean;
  /** Set for this date alone, rather than inherited from the weekday. */
  oneOff: boolean;
  title: string | null;
  suggestedTime: string | null;
  coachNotes: string | null;
  calorieTarget: number | null;
  proteinTarget: number | null;
  exercises: PlanExercise[];
  meals: PlanMealSlot[];
}

/**
 * One ingredient swapped out for a client.
 *
 * The meal library is shared, so editing a meal there changes it for everyone.
 * A client who does not want salmon needs the swap to belong to *them* — not
 * to the recipe, and not to a single plan revision, which is rewritten every
 * time the day is saved and would take the swap with it.
 *
 * Matched on the ingredient's name rather than its id: library ingredients are
 * re-created whenever a meal is edited, so an id would quietly stop matching
 * while looking perfectly fine.
 */
export interface IngredientSwap {
  id: string;
  clientId: string;
  /** The meal it applies to, or null for every meal that uses the ingredient. */
  mealId: string | null;
  /** Ingredient name being replaced, matched case-insensitively. */
  replaces: string;
  /** What to use instead. Null removes the ingredient outright. */
  name: string | null;
  /** Per single serving, like every other amount. Null keeps the original. */
  quantity: number | null;
  unit: string | null;
  /** Applies from this date on, unless `onlyOn` pins it to one day. */
  effectiveFrom: string;
  onlyOn: string | null;
  createdAt: string;
}

/** How far an edit reaches. */
export type EditScope = "date" | "weekday";

// ---------------------------------------------------------------------------
// Logged training
// ---------------------------------------------------------------------------

/**
 * A one-off question from the website.
 *
 * Deliberately not an application: somebody asking whether Dean coaches
 * runners has not applied to train, and putting them in the same list as
 * people waiting to be enrolled would make both lists useless.
 */
export interface Question {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
  answeredAt: string | null;
}

/**
 * Somebody applying to train with Dean.
 *
 * There is no plan to pick and no price to choose at signup, because there is
 * no shelf of programmes — Dean builds one per person. So this is an
 * application rather than a purchase: they tell him who they are and what they
 * are after, he reads it, and he either enrols them or he does not.
 *
 * Everything the wizard collects lands here rather than on the profile, so the
 * answers stay as they were given even after Dean has edited their goal or
 * their weight has moved on.
 */
export type GoalType = "muscle" | "lose" | "fitness" | "other";

export const GOAL_LABELS: Record<GoalType, string> = {
  muscle: "Build muscle",
  lose: "Lose weight",
  fitness: "Just get fitter",
  other: "Something else",
};

export type ApplicationStatus = "pending" | "approved" | "declined";

export interface Application {
  id: string;
  /** The account they created on the way through. */
  accountId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  /** Both optional — "if you know it" is the whole point of asking this way. */
  currentWeightKg: number | null;
  goalWeightKg: number | null;
  goalType: GoalType;
  /** What they typed when they picked "Something else". */
  goalOther: string | null;
  status: ApplicationStatus;
  createdAt: string;
  decidedAt: string | null;
}

/**
 * A client asking to train on a different day.
 *
 * Life moves a session more often than a coach does — a shift swapped, a
 * child off school. The alternative was a note in a comment thread that Dean
 * had to read, understand and then act on by hand, which meant the plan and
 * the week the client was actually having drifted apart.
 *
 * A request, not a change: the plan is coaching and it stays Dean's. He
 * approves or declines in one tap, and only an approval moves anything.
 */
export type SwapStatus = "pending" | "approved" | "declined";

export interface SwapRequest {
  id: string;
  clientId: string;
  /** The date the session is on now, and where they are asking for it. */
  fromDate: string;
  toDate: string;
  /** What was on that day when they asked, so the request still reads later. */
  title: string | null;
  reason: string | null;
  status: SwapStatus;
  createdAt: string;
  decidedAt: string | null;
}

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

/**
 * Whether a category has anything outstanding today.
 *
 * "none" means nothing was asked — a rest day, or a day with no meals set — so
 * it neither nags nor counts towards finishing.
 */
export type DayTaskState = "none" | "todo" | "done";

export interface DayProgress {
  date: string;
  workout: DayTaskState;
  food: DayTaskState;
  weight: DayTaskState;
  /** Everything asked of them today is done. */
  allDone: boolean;
  submittedAt: string | null;
  /** Filled in for the food tab: 3 of 4 meals ticked. */
  mealsEaten: number;
  mealsPlanned: number;
  /**
   * Exactly what is still outstanding, named the way the client would say it
   * — "Breakfast — Peanut butter oats", not "food". A day can be finished with
   * things on this list, but only with a reason attached.
   */
  missed: string[];
}

/**
 * A day the client has closed out.
 *
 * `missed` and `note` are a snapshot taken at the moment they pressed finish.
 * Ticking a meal the next morning does not rewrite what they told Dean, and a
 * plan Dean changes later does not quietly make a missed day look complete.
 */
export interface DaySubmission {
  clientId: string;
  onDate: string;
  submittedAt: string;
  missed: string[];
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

export interface ShoppingItem {
  id: string;
  position: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  usedIn: string | null;
  checkedAt: string | null;
}

/**
 * A list as saved when the client pressed create — a snapshot, not a live view
 * of the plan, so what they are holding in a shop cannot change underneath
 * them.
 */
export interface ShoppingList {
  id: string;
  clientId: string;
  fromDate: string;
  toDate: string;
  createdAt: string;
  items: ShoppingItem[];
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

// ---------------------------------------------------------------------------
// Chat
//
// One thread per client, forever. Dean coaches a few dozen people rather than
// a queue of strangers, so there is nothing to route and nothing to assign —
// the pair of them have one conversation and it is the same one in a year.
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  /** Which way round it is drawn. Snapshotted, not derived from a role today. */
  fromCoach: boolean;
  body: string | null;
  /**
   * A path in the private bucket, never a URL. Anything shown is a signed URL
   * minted at read time and good for an hour.
   */
  attachmentPath: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  createdAt: string;
  /**
   * Set on a message that has been sent but not yet acknowledged, so the
   * bubble can be drawn faint. Never comes back from the database.
   */
  pending?: boolean;
}

export interface ChatThread {
  id: string;
  clientId: string;
  lastMessageAt: string | null;
  clientReadAt: string | null;
  coachReadAt: string | null;
  /** Dean saying "that's dealt with". Any new message clears it. */
  closedAt: string | null;
}

/** A row in Dean's inbox: the thread, who it is with, and the last thing said. */
export interface ChatInboxRow extends ChatThread {
  clientName: string;
  avatarUrl: string | null;
  preview: string | null;
  unread: number;
}

// ---------------------------------------------------------------------------
// Change requests
//
// A client asking Dean to change something about how they are coached. The
// same shape as a day swap and for the same reason: their goal and their mode
// are coaching decisions, so a client may ask and only Dean's yes moves
// anything.
// ---------------------------------------------------------------------------

export type ChangeField =
  | "full_name"
  | "goal"
  | "goal_weight"
  | "coaching_mode"
  | "food_mode";

export const CHANGE_LABELS: Record<ChangeField, string> = {
  full_name: "Their name",
  goal: "What they're working towards",
  goal_weight: "Goal weight",
  coaching_mode: "How they're coached",
  food_mode: "Who plans their food",
};

/** How the client is asked for it — first person, because they are reading it. */
export const CHANGE_ASKS: Record<ChangeField, string> = {
  full_name: "Change my name",
  goal: "Change what I'm working towards",
  goal_weight: "Change my goal weight",
  coaching_mode: "Change how I'm coached",
  food_mode: "Change who plans my food",
};

/**
 * The same five fields as the client owns them, for anything written to them.
 *
 * `CHANGE_LABELS` is Dean's inbox reading about somebody else — "their name".
 * A notification lands in the client's own app, so it has to say "your name"
 * or it reads like it was meant for a different person.
 */
export const CHANGE_MINE: Record<ChangeField, string> = {
  full_name: "Your name",
  goal: "What you're working towards",
  goal_weight: "Your goal weight",
  coaching_mode: "How you're coached",
  food_mode: "Who plans your food",
};

/**
 * A requested value, in words.
 *
 * Two of these fields are a choice between things Dean offers, and the value
 * stored is the token the database uses. Showing that token to either of them
 * would put "one_to_one" on a client's screen, which is a database column
 * leaking into a conversation between two people.
 */
export function changeValueLabel(field: ChangeField, value: string | null): string {
  if (!value) return "—";
  if (field === "coaching_mode") {
    return value === "online" || value === "one_to_one" ? COACHING_LABELS[value] : value;
  }
  if (field === "food_mode") {
    if (value === "coach") return "Dean plans it";
    if (value === "self") return "They plan it to Dean's targets";
    return value;
  }
  if (field === "goal_weight") return `${value}kg`;
  return value;
}

export type ChangeStatus = "pending" | "approved" | "declined";

export interface ChangeRequest {
  id: string;
  clientId: string;
  field: ChangeField;
  /** What it was when they asked, so the request still reads months later. */
  currentValue: string | null;
  requestedValue: string;
  reason: string | null;
  status: ChangeStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface ChangeRequestRow extends ChangeRequest {
  clientName: string;
  avatarUrl: string | null;
}

// ---------------------------------------------------------------------------
// Notifications
//
// One row is either for everybody (`recipientId` null) or for one person. Who
// has read what is a single timestamp on the reader's own account rather than
// a row per person per notification, because the only question the bell asks
// is "anything since I last looked".
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  /** Null is everyone. */
  recipientId: string | null;
  sentByName: string;
  title: string;
  body: string | null;
  /** Where it takes you when tapped. An in-app path, never an absolute URL. */
  actionHref: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// The board
//
// The one place in the product where clients see each other. Author name and
// photo are snapshotted onto the row, so a wall of posts renders without a
// join per post and a post still reads after somebody leaves.
// ---------------------------------------------------------------------------

/**
 * Who Dean meant a post for. It fans out notifications; it does not restrict
 * who can see the post, or it would stop being a board.
 */
export type BoardAudience = "everyone" | "online" | "one_to_one";

export const AUDIENCE_TAGS: Record<BoardAudience, string> = {
  everyone: "@everyone",
  online: "@online",
  one_to_one: "@1to1",
};

export interface BoardComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  fromCoach: boolean;
  body: string;
  createdAt: string;
}

export interface BoardPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  fromCoach: boolean;
  body: string;
  /** Signed URLs, minted in one batch when the page renders. */
  media: string[];
  tagged: BoardAudience[];
  likes: number;
  likedByMe: boolean;
  comments: BoardComment[];
  createdAt: string;
}
