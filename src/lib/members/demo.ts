import type { RawRevision } from "./service";
import type {
  CheckIn,
  CoachSession,
  Exercise,
  FoodDayFeedback,
  Meal,
  MealLog,
  PlanBlock,
  PlanSet,
  ShoppingList,
  Comment,
  DayPlan,
  FoodLog,
  FoodPlan,
  Profile,
  SessionPlan,
  WeightEntry,
  Workout,
} from "./types";

/**
 * Demo dataset for reviewing the members' area before Supabase is connected.
 *
 * Dates are generated relative to the current day so "today's workout" is
 * genuinely today. Held in module state, so edits survive within a running
 * server but reset on restart — it is a fixture, not a database.
 */

export const DEMO_CLIENT_ID = "demo-client-1";
export const DEMO_ADMIN_ID = "demo-admin";

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function isoTime(offsetDays: number, hour: number): string {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString();
}

export const demoProfiles: Profile[] = [
  {
    id: DEMO_ADMIN_ID,
    fullName: "Dean Foster",
    email: "dean@triumphtraining.fit",
    role: "admin",
    status: "active",
    goal: null,
    startedOn: isoDate(-900),
  },
  {
    id: DEMO_CLIENT_ID,
    fullName: "Priya Raman",
    email: "priya@example.com",
    role: "client",
    status: "active",
    goal: "Fat loss without losing strength",
    startedOn: isoDate(-84),
  },
  {
    id: "demo-client-2",
    fullName: "Danny O'Connell",
    email: "danny@example.com",
    role: "client",
    status: "active",
    goal: "Get strong around night shifts",
    startedOn: isoDate(-240),
  },
  {
    id: "demo-client-3",
    fullName: "Sofia Marchetti",
    email: "sofia@example.com",
    role: "client",
    status: "active",
    goal: "Back to training after two kids",
    startedOn: isoDate(-31),
  },
  {
    id: "demo-client-4",
    fullName: "Tom Whitaker",
    email: "tom@example.com",
    role: "client",
    status: "paused",
    goal: "Maintain through a house move",
    startedOn: isoDate(-410),
  },
];

/**
 * In-person sessions only, and only for the Newcastle clients.
 *
 * Priya is the client demo and is coached online, so she has none — her
 * coaching is entirely the workouts and food plans Dean assigns her, which is
 * what most clients see.
 */
export const demoSessions: CoachSession[] = [
  {
    id: "s-1",
    clientId: "demo-client-2",
    startsAt: isoTime(1, 7),
    durationMinutes: 60,
    location: "Newcastle upon Tyne — studio",
    status: "scheduled",
    coachNotes: null,
  },
  {
    id: "s-2",
    clientId: "demo-client-2",
    startsAt: isoTime(4, 7),
    durationMinutes: 60,
    location: "Newcastle upon Tyne — studio",
    status: "scheduled",
    coachNotes: null,
  },
  {
    id: "s-3",
    clientId: "demo-client-2",
    startsAt: isoTime(-6, 7),
    durationMinutes: 60,
    location: "Newcastle upon Tyne — studio",
    status: "completed",
    coachNotes:
      "Squat depth much better with the heels raised. Deadlift felt heavy off the floor after nights — moved it to the front of the session next time.",
  },
  {
    id: "s-4",
    clientId: "demo-client-3",
    startsAt: isoTime(3, 11),
    durationMinutes: 45,
    location: "Client's gym",
    status: "scheduled",
    coachNotes: null,
  },
];

export const demoWorkouts: Workout[] = [
  {
    id: "w-today",
    clientId: DEMO_CLIENT_ID,
    scheduledFor: isoDate(0),
    title: "Lower body — strength",
    suggestedTime: "18:00",
    coachNotes: "Leave two reps in the tank on the squats. If the knee grumbles, drop the depth.",
    clientNote: null,
    feeling: null,
    fromPlan: false,
    completedAt: null,
    items: [
      {
        id: "wi-1",
        workoutId: "w-today",
        position: 0,
        label: "Back squat",
        target: "4 × 5 @ 70kg",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: false,
        doneAt: null,
      },
      {
        id: "wi-2",
        workoutId: "w-today",
        position: 1,
        label: "Romanian deadlift",
        target: "3 × 8 @ 60kg",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: false,
        doneAt: null,
      },
      {
        id: "wi-3",
        workoutId: "w-today",
        position: 2,
        label: "Walking lunges",
        target: "3 × 10 each leg",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: false,
        doneAt: null,
      },
      {
        id: "wi-4",
        workoutId: "w-today",
        position: 3,
        label: "Leg curl",
        target: "3 × 12",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: false,
        doneAt: null,
      },
      {
        id: "wi-5",
        workoutId: "w-today",
        position: 4,
        label: "Plank",
        target: "3 × 45 seconds",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: false,
        doneAt: null,
      },
    ],
  },
  {
    id: "w-1",
    clientId: DEMO_CLIENT_ID,
    scheduledFor: isoDate(-2),
    title: "Upper body — push",
    suggestedTime: null,
    coachNotes: null,
    clientNote: "Bench felt strong, went up to 45kg on the last set. Shoulder fine.",
    feeling: null,
    fromPlan: false,
    completedAt: isoTime(-2, 19),
    items: [
      {
        id: "wi-6",
        workoutId: "w-1",
        position: 0,
        label: "Bench press",
        target: "4 × 6 @ 42.5kg",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: true,
        doneAt: isoTime(-2, 18),
      },
      {
        id: "wi-7",
        workoutId: "w-1",
        position: 1,
        label: "Overhead press",
        target: "3 × 8 @ 25kg",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: true,
        doneAt: isoTime(-2, 18),
      },
      {
        id: "wi-8",
        workoutId: "w-1",
        position: 2,
        label: "Incline dumbbell press",
        target: "3 × 10",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: true,
        doneAt: isoTime(-2, 19),
      },
      {
        id: "wi-9",
        workoutId: "w-1",
        position: 3,
        label: "Cable fly",
        target: "3 × 12",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: true,
        doneAt: isoTime(-2, 19),
      },
    ],
  },
  {
    id: "w-2",
    clientId: DEMO_CLIENT_ID,
    scheduledFor: isoDate(-4),
    title: "Full body — conditioning",
    suggestedTime: null,
    coachNotes: null,
    clientNote: "Ran out of time, skipped the carries.",
    feeling: null,
    fromPlan: false,
    completedAt: isoTime(-4, 20),
    items: [
      {
        id: "wi-10",
        workoutId: "w-2",
        position: 0,
        label: "Goblet squat",
        target: "3 × 12",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: true,
        doneAt: isoTime(-4, 19),
      },
      {
        id: "wi-11",
        workoutId: "w-2",
        position: 1,
        label: "Row machine",
        target: "5 × 250m",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: true,
        doneAt: isoTime(-4, 20),
      },
      {
        id: "wi-12",
        workoutId: "w-2",
        position: 2,
        label: "Farmer's carry",
        target: "4 × 40m",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: false,
        doneAt: null,
      },
    ],
  },
];

export const demoFoodPlans: FoodPlan[] = [
  {
    id: "fp-1",
    clientId: DEMO_CLIENT_ID,
    assignedFor: isoDate(0),
    calorieTarget: 1950,
    proteinTarget: 130,
    notes: "Front-load protein at breakfast — it makes the afternoons much easier.",
    meals: [
      {
        id: "m-1",
        position: 0,
        name: "Breakfast — Greek yoghurt bowl",
        ingredients: "200g 0% Greek yoghurt, 40g granola, 100g berries, 1 tbsp honey",
        calories: 420,
      },
      {
        id: "m-2",
        position: 1,
        name: "Lunch — chicken and rice",
        ingredients: "150g chicken breast, 60g rice (dry), mixed veg, 1 tsp olive oil",
        calories: 560,
      },
      {
        id: "m-3",
        position: 2,
        name: "Dinner — salmon and potatoes",
        ingredients: "150g salmon, 250g new potatoes, green beans, lemon",
        calories: 640,
      },
      {
        id: "m-4",
        position: 3,
        name: "Snacks",
        ingredients: "Whey shake, an apple, or a small handful of nuts",
        calories: 330,
      },
    ],
  },
  {
    id: "fp-2",
    clientId: "demo-client-2",
    assignedFor: isoDate(0),
    calorieTarget: 2600,
    proteinTarget: 180,
    notes: "Night shifts: keep the big meal before you leave, not at 3am.",
    meals: [],
  },
  {
    id: "fp-3",
    clientId: "demo-client-3",
    assignedFor: isoDate(-6),
    calorieTarget: 1700,
    proteinTarget: 120,
    notes: null,
    meals: [],
  },
];

/**
 * Danny's completed week, plus the block he is planned into. He is the client
 * who needs nothing changing, so the check-in board has an "on track" row.
 */
function dannyWorkout(offset: number, title: string, completed: boolean): Workout {
  const id = `w-c2-${offset}`;
  return {
    id,
    clientId: "demo-client-2",
    scheduledFor: isoDate(offset),
    title,
    suggestedTime: "07:00",
    coachNotes: null,
    clientNote: null,
    feeling: null,
    fromPlan: false,
    completedAt: completed ? isoTime(offset, 8) : null,
    items: [
      {
        id: `${id}-a`,
        workoutId: id,
        position: 0,
        label: "Trap bar deadlift",
        target: "4 × 5 @ 120kg",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: completed,
        doneAt: completed ? isoTime(offset, 8) : null,
      },
      {
        id: `${id}-b`,
        workoutId: id,
        position: 1,
        label: "Bench press",
        target: "4 × 6 @ 80kg",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: completed,
        doneAt: completed ? isoTime(offset, 8) : null,
      },
      {
        id: `${id}-c`,
        workoutId: id,
        position: 2,
        label: "Pull-ups",
        target: "4 × 8",
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: completed,
        doneAt: completed ? isoTime(offset, 8) : null,
      },
    ],
  };
}

demoWorkouts.push(
  dannyWorkout(-1, "Full body — heavy", true),
  dannyWorkout(-3, "Full body — volume", true),
  dannyWorkout(-6, "Full body — heavy", true),
  dannyWorkout(4, "Full body — heavy", false),
  dannyWorkout(6, "Full body — volume", false),
  dannyWorkout(11, "Full body — heavy", false),
  dannyWorkout(13, "Full body — volume", false),
);

export const demoFoodLogs: FoodLog[] = [
  {
    id: "fl-1",
    clientId: DEMO_CLIENT_ID,
    loggedFor: isoDate(0),
    calories: 420,
    note: "Breakfast",
    createdAt: isoTime(0, 8),
  },
  {
    id: "fl-2",
    clientId: DEMO_CLIENT_ID,
    loggedFor: isoDate(0),
    calories: 610,
    note: "Lunch — swapped rice for a jacket potato",
    createdAt: isoTime(0, 13),
  },
  {
    id: "fl-3",
    clientId: DEMO_CLIENT_ID,
    loggedFor: isoDate(-1),
    calories: 1890,
    note: "End of day total. Felt easy.",
    createdAt: isoTime(-1, 21),
  },
  {
    id: "fl-4",
    clientId: DEMO_CLIENT_ID,
    loggedFor: isoDate(-2),
    calories: 2210,
    note: "Meal out — went over.",
    createdAt: isoTime(-2, 22),
  },
  {
    id: "fl-5",
    clientId: "demo-client-2",
    loggedFor: isoDate(0),
    calories: 1450,
    note: null,
    createdAt: isoTime(0, 12),
  },
  // Danny logs every day and lands near target — the "on track" case on the
  // check-in board, so both states are visible in the demo.
  {
    id: "fl-6",
    clientId: "demo-client-2",
    loggedFor: isoDate(-1),
    calories: 2580,
    note: null,
    createdAt: isoTime(-1, 21),
  },
  {
    id: "fl-7",
    clientId: "demo-client-2",
    loggedFor: isoDate(-2),
    calories: 2640,
    note: null,
    createdAt: isoTime(-2, 21),
  },
  {
    id: "fl-8",
    clientId: "demo-client-2",
    loggedFor: isoDate(-3),
    calories: 2510,
    note: null,
    createdAt: isoTime(-3, 20),
  },
  {
    id: "fl-9",
    clientId: "demo-client-2",
    loggedFor: isoDate(-4),
    calories: 2700,
    note: null,
    createdAt: isoTime(-4, 22),
  },
  {
    id: "fl-10",
    clientId: "demo-client-2",
    loggedFor: isoDate(-5),
    calories: 2555,
    note: null,
    createdAt: isoTime(-5, 21),
  },
  {
    id: "fl-11",
    clientId: "demo-client-2",
    loggedFor: isoDate(-6),
    calories: 2620,
    note: null,
    createdAt: isoTime(-6, 20),
  },
  // Sofia has just started and is already telling Dean something.
  {
    id: "fl-12",
    clientId: "demo-client-3",
    loggedFor: isoDate(-1),
    calories: 1620,
    note: "Struggled with the salmon again — is there something else I can swap it for?",
    createdAt: isoTime(-1, 19),
  },
  {
    id: "fl-13",
    clientId: "demo-client-3",
    loggedFor: isoDate(-2),
    calories: 1710,
    note: null,
    createdAt: isoTime(-2, 20),
  },
];

export const demoWeightEntries: WeightEntry[] = [
  { id: "we-1", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-1), weightKg: 71.4, note: null },
  { id: "we-2", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-2), weightKg: 71.6, note: null },
  {
    id: "we-3",
    clientId: DEMO_CLIENT_ID,
    loggedFor: isoDate(-3),
    weightKg: 71.9,
    note: "Salty meal yesterday",
  },
  { id: "we-4", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-4), weightKg: 71.5, note: null },
  { id: "we-5", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-5), weightKg: 72.0, note: null },
  { id: "we-6", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-6), weightKg: 72.2, note: null },
  { id: "we-7", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-7), weightKg: 72.3, note: null },
  { id: "we-8", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-10), weightKg: 72.8, note: null },
  { id: "we-9", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-14), weightKg: 73.4, note: null },
  { id: "we-10", clientId: "demo-client-2", loggedFor: isoDate(0), weightKg: 88.2, note: null },
];

export const demoSessionPlans: SessionPlan[] = [
  {
    id: "sp-1",
    name: "Lower body — strength",
    notes: "Leave two reps in the tank on the squats.",
    items: [
      { id: "spi-1", position: 0, label: "Back squat", target: "4 × 5 @ 70kg" },
      { id: "spi-2", position: 1, label: "Romanian deadlift", target: "3 × 8 @ 60kg" },
      { id: "spi-3", position: 2, label: "Walking lunges", target: "3 × 10 each leg" },
      { id: "spi-4", position: 3, label: "Leg curl", target: "3 × 12" },
      { id: "spi-5", position: 4, label: "Plank", target: "3 × 45 seconds" },
    ],
  },
  {
    id: "sp-2",
    name: "Push day",
    notes: null,
    items: [
      { id: "spi-6", position: 0, label: "Bench press", target: "4 × 6" },
      { id: "spi-7", position: 1, label: "Overhead press", target: "3 × 8" },
      { id: "spi-8", position: 2, label: "Incline dumbbell press", target: "3 × 10" },
      { id: "spi-9", position: 3, label: "Cable fly", target: "3 × 12" },
      { id: "spi-10", position: 4, label: "Triceps pushdown", target: "3 × 12" },
    ],
  },
  {
    id: "sp-3",
    name: "Pull day",
    notes: null,
    items: [
      { id: "spi-11", position: 0, label: "Deadlift", target: "4 × 5" },
      { id: "spi-12", position: 1, label: "Pull-ups", target: "4 × max" },
      { id: "spi-13", position: 2, label: "Barbell row", target: "3 × 8" },
      { id: "spi-14", position: 3, label: "Face pull", target: "3 × 15" },
    ],
  },
  {
    id: "sp-4",
    name: "Short session — 30 minutes",
    notes: "For the days that fall apart. Two lifts and something for the back.",
    items: [
      { id: "spi-15", position: 0, label: "Goblet squat", target: "3 × 12" },
      { id: "spi-16", position: 1, label: "Dumbbell press", target: "3 × 10" },
      { id: "spi-17", position: 2, label: "Single-arm row", target: "3 × 12 each" },
    ],
  },
];

export const demoDayPlans: DayPlan[] = [
  {
    id: "dp-1",
    name: "1,950 kcal — training day",
    calorieTarget: 1950,
    proteinTarget: 130,
    notes: "Front-load protein at breakfast.",
    meals: [
      {
        id: "dpm-1",
        position: 0,
        name: "Breakfast — Greek yoghurt bowl",
        ingredients: "200g 0% Greek yoghurt, 40g granola, 100g berries, 1 tbsp honey",
        calories: 420,
      },
      {
        id: "dpm-2",
        position: 1,
        name: "Lunch — chicken and rice",
        ingredients: "150g chicken breast, 60g rice (dry), mixed veg, 1 tsp olive oil",
        calories: 560,
      },
      {
        id: "dpm-3",
        position: 2,
        name: "Dinner — salmon and potatoes",
        ingredients: "150g salmon, 250g new potatoes, green beans, lemon",
        calories: 640,
      },
      {
        id: "dpm-4",
        position: 3,
        name: "Snacks",
        ingredients: "Whey shake, an apple, or a small handful of nuts",
        calories: 330,
      },
    ],
  },
  {
    id: "dp-2",
    name: "1,700 kcal — rest day",
    calorieTarget: 1700,
    proteinTarget: 130,
    notes: "Slightly lower on the days you are not training.",
    meals: [
      {
        id: "dpm-5",
        position: 0,
        name: "Breakfast — eggs on toast",
        ingredients: "3 eggs, 2 slices wholemeal, tomatoes",
        calories: 400,
      },
      {
        id: "dpm-6",
        position: 1,
        name: "Lunch — big salad with chicken",
        ingredients: "150g chicken, salad, 30g feta, olive oil",
        calories: 480,
      },
      {
        id: "dpm-7",
        position: 2,
        name: "Dinner — chilli and rice",
        ingredients: "150g lean mince, kidney beans, 50g rice (dry)",
        calories: 620,
      },
      { id: "dpm-8", position: 3, name: "Snack", ingredients: "Greek yoghurt", calories: 200 },
    ],
  },
  {
    id: "dp-3",
    name: "2,600 kcal — shift worker",
    calorieTarget: 2600,
    proteinTarget: 180,
    notes: "Keep the big meal before the shift, not at 3am.",
    meals: [],
  },
  {
    id: "dp-4",
    name: "Target only — 1,800 kcal",
    calorieTarget: 1800,
    proteinTarget: 120,
    notes: "No meals set — the client eats their own food to the target.",
    meals: [],
  },
];

export const demoComments: Comment[] = [
  {
    id: "c-1",
    clientId: DEMO_CLIENT_ID,
    authorId: DEMO_ADMIN_ID,
    authorName: "Dean Foster",
    authorRole: "admin",
    targetType: "workout",
    targetId: "w-1",
    body: "45kg is a big jump — nice. Let's hold there for two more sessions before we add again.",
    readAt: null,
    createdAt: isoTime(-1, 9),
  },
  {
    id: "c-2",
    clientId: DEMO_CLIENT_ID,
    authorId: DEMO_ADMIN_ID,
    authorName: "Dean Foster",
    authorRole: "admin",
    targetType: "food_log",
    targetId: "fl-4",
    body: "One meal out does not undo a week. Carry on as normal today — no need to make it up.",
    readAt: null,
    createdAt: isoTime(-1, 10),
  },
  {
    id: "c-3",
    clientId: DEMO_CLIENT_ID,
    authorId: DEMO_ADMIN_ID,
    authorName: "Dean Foster",
    authorRole: "admin",
    targetType: "workout",
    targetId: "w-2",
    body: "Skipping the carries is fine when time is tight — always drop the last accessory first.",
    readAt: isoTime(-3, 12),
    createdAt: isoTime(-3, 11),
  },
];

/**
 * Past check-ins, so the board has history to show. Priya was reviewed a week
 * ago and is due again; Danny was adjusted after missing sessions.
 */
export const demoCheckIns: CheckIn[] = [
  {
    id: "ci-1",
    clientId: DEMO_CLIENT_ID,
    coachId: DEMO_ADMIN_ID,
    periodStart: isoDate(-13),
    periodEnd: isoDate(-7),
    outcome: "continued",
    note: "Really consistent fortnight — weight is coming down at the rate we want and the sessions are all getting finished. Nothing to change. Same plan for the next four weeks, I'll look again in a week.",
    weeksPlanned: 4,
    nextReviewOn: isoDate(0),
    createdAt: isoTime(-7, 9),
  },
  {
    id: "ci-2",
    clientId: "demo-client-2",
    coachId: DEMO_ADMIN_ID,
    periodStart: isoDate(-20),
    periodEnd: isoDate(-14),
    outcome: "adjusted",
    note: "Nights knocked two sessions out, so I've moved the heavy work to the front and dropped you to three days instead of four. Easier to hit, and we lose nothing.",
    weeksPlanned: 3,
    nextReviewOn: isoDate(4),
    createdAt: isoTime(-14, 8),
  },
];

// ---------------------------------------------------------------------------
// Libraries
// ---------------------------------------------------------------------------

export const demoExercises: Exercise[] = [
  {
    id: "ex-squat",
    name: "Back squat",
    muscleGroup: "Legs",
    equipment: "Barbell",
    howTo: "Brace before you unrack. Sit between your hips, knees tracking over your toes.",
    archivedAt: null,
  },
  {
    id: "ex-rdl",
    name: "Romanian deadlift",
    muscleGroup: "Hamstrings",
    equipment: "Barbell",
    howTo:
      "Push your hips back, bar close to your legs. Stop when your hamstrings say so, not when the floor does.",
    archivedAt: null,
  },
  {
    id: "ex-lunge",
    name: "Walking lunge",
    muscleGroup: "Legs",
    equipment: "Dumbbells",
    howTo: null,
    archivedAt: null,
  },
  {
    id: "ex-legcurl",
    name: "Leg curl",
    muscleGroup: "Hamstrings",
    equipment: "Machine",
    howTo: null,
    archivedAt: null,
  },
  {
    id: "ex-bench",
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    howTo: "Shoulder blades pinned back. Bar to the bottom of your chest, elbows at about 45 degrees.",
    archivedAt: null,
  },
  {
    id: "ex-ohp",
    name: "Overhead press",
    muscleGroup: "Shoulders",
    equipment: "Barbell",
    howTo: null,
    archivedAt: null,
  },
  {
    id: "ex-incline",
    name: "Incline dumbbell press",
    muscleGroup: "Chest",
    equipment: "Dumbbells",
    howTo: null,
    archivedAt: null,
  },
  {
    id: "ex-fly",
    name: "Cable fly",
    muscleGroup: "Chest",
    equipment: "Cable",
    howTo: null,
    archivedAt: null,
  },
  {
    id: "ex-row",
    name: "Barbell row",
    muscleGroup: "Back",
    equipment: "Barbell",
    howTo: "Hinge to about 45 degrees and hold it. Pull to your belly button, not your chest.",
    archivedAt: null,
  },
  {
    id: "ex-pullup",
    name: "Pull-up",
    muscleGroup: "Back",
    equipment: "Bodyweight",
    howTo: null,
    archivedAt: null,
  },
  {
    id: "ex-trapbar",
    name: "Trap bar deadlift",
    muscleGroup: "Full body",
    equipment: "Trap bar",
    howTo: null,
    archivedAt: null,
  },
  {
    id: "ex-plank",
    name: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    howTo: null,
    archivedAt: null,
  },
];

export const demoMeals: Meal[] = [
  // ------------------------------------------------------------- breakfast
  {
    id: "meal-oats",
    name: "Peanut butter oats",
    tag: "breakfast",
    calories: 575,
    proteinG: 22,
    carbsG: 77,
    fatG: 20,
    ingredients: [
      { id: "in-oats-1", position: 0, name: "Porridge oats", quantity: 60, unit: "g" },
      { id: "in-oats-2", position: 1, name: "Semi-skimmed milk", quantity: 250, unit: "ml" },
      { id: "in-oats-3", position: 2, name: "Peanut butter", quantity: 20, unit: "g" },
      { id: "in-oats-4", position: 3, name: "Banana", quantity: 1, unit: "whole" },
    ],
    method: [
      "Put the oats and milk in a pan over a medium heat.",
      "Stir until it thickens, about five minutes.",
      "Take it off the heat and stir the peanut butter through.",
      "Slice the banana over the top.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-eggs",
    name: "Eggs on toast",
    tag: "breakfast",
    calories: 470,
    proteinG: 27,
    carbsG: 34,
    fatG: 25,
    ingredients: [
      { id: "in-eggs-1", position: 0, name: "Eggs", quantity: 3, unit: "whole" },
      { id: "in-eggs-2", position: 1, name: "Wholemeal bread", quantity: 2, unit: "slice" },
      { id: "in-eggs-3", position: 2, name: "Butter", quantity: 8, unit: "g" },
    ],
    method: [
      "Toast the bread.",
      "Scramble the eggs over a low heat, stirring so they stay soft.",
      "Butter the toast and pile the eggs on.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-granola",
    name: "Yoghurt, berries and granola",
    tag: "breakfast",
    calories: 425,
    proteinG: 26,
    carbsG: 58,
    fatG: 10,
    ingredients: [
      { id: "in-gran-1", position: 0, name: "Greek yoghurt", quantity: 200, unit: "g" },
      { id: "in-gran-2", position: 1, name: "Mixed berries", quantity: 100, unit: "g" },
      { id: "in-gran-3", position: 2, name: "Granola", quantity: 50, unit: "g" },
      { id: "in-gran-4", position: 3, name: "Honey", quantity: 10, unit: "g" },
    ],
    method: [
      "Spoon the yoghurt into a bowl.",
      "Scatter the berries and granola over it.",
      "Finish with the honey.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-bagel",
    name: "Smoked salmon bagel",
    tag: "breakfast",
    calories: 415,
    proteinG: 25,
    carbsG: 50,
    fatG: 13,
    ingredients: [
      { id: "in-bag-1", position: 0, name: "Bagel", quantity: 1, unit: "whole" },
      { id: "in-bag-2", position: 1, name: "Smoked salmon", quantity: 60, unit: "g" },
      { id: "in-bag-3", position: 2, name: "Light cream cheese", quantity: 30, unit: "g" },
      { id: "in-bag-4", position: 3, name: "Lemon", quantity: 0.5, unit: "whole" },
    ],
    method: [
      "Split and toast the bagel.",
      "Spread both halves with the cream cheese.",
      "Lay the salmon over and squeeze the lemon on top.",
    ],
    archivedAt: null,
  },

  // ----------------------------------------------------------------- lunch
  {
    id: "meal-chicken-rice",
    name: "Chicken and rice bowl",
    tag: "lunch",
    calories: 560,
    proteinG: 46,
    carbsG: 66,
    fatG: 13,
    ingredients: [
      { id: "in-cr-1", position: 0, name: "Chicken breast", quantity: 150, unit: "g" },
      { id: "in-cr-2", position: 1, name: "Basmati rice", quantity: 75, unit: "g" },
      { id: "in-cr-3", position: 2, name: "Tenderstem broccoli", quantity: 100, unit: "g" },
      { id: "in-cr-4", position: 3, name: "Olive oil", quantity: 10, unit: "ml" },
      { id: "in-cr-5", position: 4, name: "Soy sauce", quantity: 15, unit: "ml" },
    ],
    method: [
      "Get the rice on — it takes the longest.",
      "Slice the chicken and fry it in the oil until golden and cooked through.",
      "Steam or boil the broccoli until it still has a bit of bite.",
      "Tip everything into a bowl and finish with the soy sauce.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-jacket",
    name: "Jacket potato and tuna",
    tag: "lunch",
    calories: 465,
    proteinG: 43,
    carbsG: 56,
    fatG: 8,
    ingredients: [
      { id: "in-jp-1", position: 0, name: "Baking potato", quantity: 1, unit: "whole" },
      { id: "in-jp-2", position: 1, name: "Tuna in spring water", quantity: 145, unit: "g" },
      { id: "in-jp-3", position: 2, name: "Light mayonnaise", quantity: 25, unit: "g" },
      { id: "in-jp-4", position: 3, name: "Sweetcorn", quantity: 60, unit: "g" },
    ],
    method: [
      "Prick the potato and bake it until the skin crisps and a knife goes through easily.",
      "Drain the tuna and mix it with the mayonnaise and sweetcorn.",
      "Split the potato and spoon the tuna over.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-couscous",
    name: "Chicken and chickpea couscous",
    tag: "lunch",
    calories: 565,
    proteinG: 43,
    carbsG: 67,
    fatG: 14,
    ingredients: [
      { id: "in-cc-1", position: 0, name: "Couscous", quantity: 60, unit: "g" },
      { id: "in-cc-2", position: 1, name: "Chicken breast", quantity: 120, unit: "g" },
      { id: "in-cc-3", position: 2, name: "Chickpeas", quantity: 80, unit: "g" },
      { id: "in-cc-4", position: 3, name: "Cherry tomatoes", quantity: 80, unit: "g" },
      { id: "in-cc-5", position: 4, name: "Olive oil", quantity: 10, unit: "ml" },
    ],
    method: [
      "Cover the couscous with boiling water and leave it to sit for five minutes.",
      "Fry the chicken in the oil until cooked through.",
      "Fork the couscous through and stir in the chickpeas and halved tomatoes.",
      "Slice the chicken over the top.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-burrito",
    name: "Beef burrito bowl",
    tag: "lunch",
    calories: 600,
    proteinG: 46,
    carbsG: 73,
    fatG: 14,
    ingredients: [
      { id: "in-bb-1", position: 0, name: "Beef mince 5%", quantity: 125, unit: "g" },
      { id: "in-bb-2", position: 1, name: "Brown rice", quantity: 70, unit: "g" },
      { id: "in-bb-3", position: 2, name: "Black beans", quantity: 80, unit: "g" },
      { id: "in-bb-4", position: 3, name: "Salsa", quantity: 40, unit: "g" },
      { id: "in-bb-5", position: 4, name: "Cheddar", quantity: 15, unit: "g" },
    ],
    method: [
      "Cook the rice.",
      "Brown the mince in a dry pan, breaking it up as you go.",
      "Warm the beans through with the mince.",
      "Layer the rice, mince and beans in a bowl, then top with salsa and grated cheddar.",
    ],
    archivedAt: null,
  },

  // ---------------------------------------------------------------- dinner
  {
    id: "meal-cod",
    name: "Cod, potatoes and greens",
    tag: "dinner",
    calories: 485,
    proteinG: 40,
    carbsG: 56,
    fatG: 12,
    ingredients: [
      { id: "in-cod-1", position: 0, name: "Cod fillet", quantity: 180, unit: "g" },
      { id: "in-cod-2", position: 1, name: "New potatoes", quantity: 250, unit: "g" },
      { id: "in-cod-3", position: 2, name: "Green beans", quantity: 120, unit: "g" },
      { id: "in-cod-4", position: 3, name: "Olive oil", quantity: 10, unit: "ml" },
      { id: "in-cod-5", position: 4, name: "Lemon", quantity: 1, unit: "whole" },
    ],
    method: [
      "Boil the potatoes until tender.",
      "Pan-fry the cod in the oil, skin side down first, until it flakes.",
      "Steam the beans while the fish cooks.",
      "Squeeze the lemon over everything before serving.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-bolognese",
    name: "Turkey bolognese",
    tag: "dinner",
    calories: 595,
    proteinG: 46,
    carbsG: 67,
    fatG: 16,
    ingredients: [
      { id: "in-bol-1", position: 0, name: "Turkey mince 5%", quantity: 130, unit: "g" },
      { id: "in-bol-2", position: 1, name: "Wholewheat spaghetti", quantity: 65, unit: "g" },
      { id: "in-bol-3", position: 2, name: "Chopped tomatoes", quantity: 200, unit: "g" },
      { id: "in-bol-4", position: 3, name: "Onion", quantity: 1, unit: "whole" },
      { id: "in-bol-5", position: 4, name: "Garlic", quantity: 2, unit: "clove" },
      { id: "in-bol-6", position: 5, name: "Olive oil", quantity: 7, unit: "ml" },
    ],
    method: [
      "Cook the pasta.",
      "Soften the onion and garlic in the oil.",
      "Add the mince and brown it, breaking it up as you go.",
      "Pour in the tomatoes and simmer while the pasta finishes.",
      "Drain the pasta and stir it through the sauce.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-salmon",
    name: "Salmon, sweet potato and broccoli",
    tag: "dinner",
    calories: 525,
    proteinG: 33,
    carbsG: 48,
    fatG: 23,
    ingredients: [
      { id: "in-sal-1", position: 0, name: "Salmon fillet", quantity: 130, unit: "g" },
      { id: "in-sal-2", position: 1, name: "Sweet potato", quantity: 200, unit: "g" },
      { id: "in-sal-3", position: 2, name: "Tenderstem broccoli", quantity: 120, unit: "g" },
      { id: "in-sal-4", position: 3, name: "Olive oil", quantity: 5, unit: "ml" },
    ],
    method: [
      "Cut the sweet potato into wedges and roast until the edges catch.",
      "Put the salmon in for the last twelve minutes.",
      "Steam the broccoli while everything finishes.",
    ],
    archivedAt: null,
  },
  {
    id: "meal-fajita",
    name: "Chicken fajita wraps",
    tag: "dinner",
    calories: 520,
    proteinG: 42,
    carbsG: 59,
    fatG: 13,
    ingredients: [
      { id: "in-faj-1", position: 0, name: "Chicken breast", quantity: 140, unit: "g" },
      { id: "in-faj-2", position: 1, name: "Tortilla wraps", quantity: 2, unit: "whole" },
      { id: "in-faj-3", position: 2, name: "Peppers", quantity: 100, unit: "g" },
      { id: "in-faj-4", position: 3, name: "Onion", quantity: 0.5, unit: "whole" },
      { id: "in-faj-5", position: 4, name: "Olive oil", quantity: 5, unit: "ml" },
      { id: "in-faj-6", position: 5, name: "Fajita seasoning", quantity: 1, unit: "tbsp" },
    ],
    method: [
      "Slice the chicken, peppers and onion into strips.",
      "Fry the chicken in the oil until it colours, then add the vegetables and seasoning.",
      "Cook until the peppers soften but still have some bite.",
      "Warm the wraps and fill them.",
    ],
    archivedAt: null,
  },

  // ---------------------------------------------------------------- snacks
  {
    id: "meal-shake",
    name: "Whey shake",
    tag: "snack",
    calories: 110,
    proteinG: 23,
    carbsG: 2,
    fatG: 1,
    ingredients: [{ id: "in-shk-1", position: 0, name: "Whey protein", quantity: 30, unit: "g" }],
    method: ["Shake with about 300ml of cold water."],
    archivedAt: null,
  },
  {
    id: "meal-yoghurt",
    name: "Greek yoghurt and berries",
    tag: "snack",
    calories: 165,
    proteinG: 18,
    carbsG: 23,
    fatG: 1,
    ingredients: [
      { id: "in-yog-1", position: 0, name: "Greek yoghurt", quantity: 170, unit: "g" },
      { id: "in-yog-2", position: 1, name: "Mixed berries", quantity: 80, unit: "g" },
      { id: "in-yog-3", position: 2, name: "Honey", quantity: 10, unit: "g" },
    ],
    method: ["Spoon the yoghurt into a bowl.", "Top with the berries and drizzle the honey over."],
    archivedAt: null,
  },
  {
    id: "meal-apple-almonds",
    name: "Apple and almonds",
    tag: "snack",
    calories: 225,
    proteinG: 5,
    carbsG: 29,
    fatG: 10,
    ingredients: [
      { id: "in-app-1", position: 0, name: "Apple", quantity: 1, unit: "whole" },
      { id: "in-app-2", position: 1, name: "Almonds", quantity: 20, unit: "g" },
    ],
    method: [],
    archivedAt: null,
  },
  {
    id: "meal-cottage",
    name: "Cottage cheese and rice cakes",
    tag: "snack",
    calories: 245,
    proteinG: 19,
    carbsG: 26,
    fatG: 7,
    ingredients: [
      { id: "in-cot-1", position: 0, name: "Cottage cheese", quantity: 150, unit: "g" },
      { id: "in-cot-2", position: 1, name: "Rice cakes", quantity: 3, unit: "whole" },
    ],
    method: ["Spoon the cottage cheese onto the rice cakes."],
    archivedAt: null,
  },
];

// ---------------------------------------------------------------------------
// Repeating plans
//
// Priya is on a one week block that took over today: everything before it is
// the days the old per-date system assigned, still there and still readable.
// Danny is on a fortnight. Sofia has no block yet, so the editor's empty state
// is reachable.
// ---------------------------------------------------------------------------

export const demoPlanBlocks: PlanBlock[] = [
  { id: "blk-priya", clientId: DEMO_CLIENT_ID, cycleWeeks: 1, startsOn: isoDate(0) },
  { id: "blk-danny", clientId: "demo-client-2", cycleWeeks: 2, startsOn: isoDate(-7) },
];

const sets = (rows: Array<[number, number]>, prefix: string): PlanSet[] =>
  rows.map(([weight, reps], position) => ({
    id: `${prefix}-s${position}`,
    position,
    targetWeightKg: weight,
    targetReps: reps,
  }));

export const demoPlanRevisions: RawRevision[] = [
  // --- Priya, one week -----------------------------------------------------
  {
    id: "rev-p0",
    blockId: "blk-priya",
    dayIndex: 0,
    kind: "workout",
    effectiveFrom: isoDate(0),
    onlyOn: null,
    title: "Lower body — strength",
    suggestedTime: "18:00",
    coachNotes: "Leave two reps in the tank on the squats.",
    calorieTarget: null,
    proteinTarget: null,
    isRest: false,
    exercises: [
      {
        id: "pe-1",
        position: 0,
        exerciseId: "ex-squat",
        notes: null,
        sets: sets(
          [
            [60, 10],
            [65, 8],
            [70, 6],
          ],
          "pe-1",
        ),
      },
      {
        id: "pe-2",
        position: 1,
        exerciseId: "ex-rdl",
        notes: null,
        sets: sets(
          [
            [60, 8],
            [60, 8],
            [60, 8],
          ],
          "pe-2",
        ),
      },
      {
        id: "pe-3",
        position: 2,
        exerciseId: "ex-lunge",
        notes: null,
        sets: sets(
          [
            [12, 10],
            [12, 10],
          ],
          "pe-3",
        ),
      },
      {
        id: "pe-4",
        position: 3,
        exerciseId: "ex-plank",
        notes: "45 seconds a side",
        sets: sets(
          [
            [0, 1],
            [0, 1],
            [0, 1],
          ],
          "pe-4",
        ),
      },
    ],
    meals: [],
  },
  {
    id: "rev-p2",
    blockId: "blk-priya",
    dayIndex: 2,
    kind: "workout",
    effectiveFrom: isoDate(0),
    onlyOn: null,
    title: "Upper body — push",
    suggestedTime: "18:00",
    coachNotes: null,
    calorieTarget: null,
    proteinTarget: null,
    isRest: false,
    exercises: [
      {
        id: "pe-5",
        position: 0,
        exerciseId: "ex-bench",
        notes: null,
        sets: sets(
          [
            [40, 8],
            [42.5, 6],
            [45, 6],
          ],
          "pe-5",
        ),
      },
      {
        id: "pe-6",
        position: 1,
        exerciseId: "ex-ohp",
        notes: null,
        sets: sets(
          [
            [25, 8],
            [25, 8],
            [25, 8],
          ],
          "pe-6",
        ),
      },
      {
        id: "pe-7",
        position: 2,
        exerciseId: "ex-incline",
        notes: null,
        sets: sets(
          [
            [14, 10],
            [14, 10],
            [14, 10],
          ],
          "pe-7",
        ),
      },
      {
        id: "pe-8",
        position: 3,
        exerciseId: "ex-fly",
        notes: null,
        sets: sets(
          [
            [10, 12],
            [10, 12],
            [10, 12],
          ],
          "pe-8",
        ),
      },
    ],
    meals: [],
  },
  {
    id: "rev-p4",
    blockId: "blk-priya",
    dayIndex: 4,
    kind: "workout",
    effectiveFrom: isoDate(0),
    onlyOn: null,
    title: "Full body — pull",
    suggestedTime: null,
    coachNotes: null,
    calorieTarget: null,
    proteinTarget: null,
    isRest: false,
    exercises: [
      {
        id: "pe-9",
        position: 0,
        exerciseId: "ex-row",
        notes: null,
        sets: sets(
          [
            [40, 8],
            [40, 8],
            [40, 8],
          ],
          "pe-9",
        ),
      },
      {
        id: "pe-10",
        position: 1,
        exerciseId: "ex-pullup",
        notes: "Band assisted is fine",
        sets: sets(
          [
            [0, 6],
            [0, 6],
            [0, 6],
          ],
          "pe-10",
        ),
      },
      {
        id: "pe-11",
        position: 2,
        exerciseId: "ex-legcurl",
        notes: null,
        sets: sets(
          [
            [30, 12],
            [30, 12],
            [30, 12],
          ],
          "pe-11",
        ),
      },
    ],
    meals: [],
  },
  // Priya's food: the same day every day, meals plus a target.
  ...[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => ({
    id: `rev-pf${dayIndex}`,
    blockId: "blk-priya",
    dayIndex,
    kind: "food" as const,
    effectiveFrom: isoDate(0),
    onlyOn: null,
    title: null,
    suggestedTime: null,
    coachNotes: null,
    calorieTarget: 1950,
    proteinTarget: 130,
    isRest: false,
    exercises: [],
    meals: [
      { id: `pm-${dayIndex}-1`, slot: "breakfast" as const, position: 0, mealId: "meal-oats", multiplier: 1 },
      {
        id: `pm-${dayIndex}-2`,
        slot: "lunch" as const,
        position: 0,
        mealId: dayIndex % 2 === 0 ? "meal-chicken-rice" : "meal-jacket",
        multiplier: 1,
      },
      {
        id: `pm-${dayIndex}-3`,
        slot: "dinner" as const,
        position: 0,
        mealId: dayIndex % 2 === 0 ? "meal-cod" : "meal-bolognese",
        multiplier: 1,
      },
      { id: `pm-${dayIndex}-4`, slot: "snack" as const, position: 0, mealId: "meal-yoghurt", multiplier: 1 },
    ],
  })),

  // --- Danny, a fortnight: heavy week, then a lighter one ------------------
  ...[0, 3, 5, 7, 10, 12].map((dayIndex, i) => ({
    id: `rev-d${dayIndex}`,
    blockId: "blk-danny",
    dayIndex,
    kind: "workout" as const,
    effectiveFrom: isoDate(-7),
    onlyOn: null,
    title: dayIndex < 7 ? "Full body — heavy" : "Full body — volume",
    suggestedTime: "07:00",
    coachNotes: null,
    calorieTarget: null,
    proteinTarget: null,
    isRest: false,
    exercises: [
      {
        id: `de-${i}-1`,
        position: 0,
        exerciseId: "ex-trapbar",
        notes: null,
        sets: sets(
          dayIndex < 7
            ? [
                [120, 5],
                [125, 5],
                [130, 3],
              ]
            : [
                [100, 8],
                [100, 8],
                [100, 8],
              ],
          `de-${i}-1`,
        ),
      },
      {
        id: `de-${i}-2`,
        position: 1,
        exerciseId: "ex-bench",
        notes: null,
        sets: sets(
          dayIndex < 7
            ? [
                [80, 6],
                [82.5, 5],
                [85, 4],
              ]
            : [
                [70, 10],
                [70, 10],
                [70, 10],
              ],
          `de-${i}-2`,
        ),
      },
      {
        id: `de-${i}-3`,
        position: 2,
        exerciseId: "ex-pullup",
        notes: null,
        sets: sets(
          [
            [0, 8],
            [0, 8],
            [0, 8],
          ],
          `de-${i}-3`,
        ),
      },
    ],
    meals: [],
  })),
];

export const demoMealLogs: MealLog[] = [];
export const demoFoodDayFeedback: FoodDayFeedback[] = [];

/** Saved shopping lists. Empty to start — the client makes their own. */
export const demoShoppingLists: ShoppingList[] = [];
