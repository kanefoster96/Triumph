import type {
  CoachSession,
  Comment,
  FoodLog,
  FoodPlan,
  Profile,
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

export const demoSessions: CoachSession[] = [
  {
    id: "s-1",
    clientId: DEMO_CLIENT_ID,
    startsAt: isoTime(2, 18),
    durationMinutes: 45,
    location: "Online",
    status: "scheduled",
    coachNotes: null,
  },
  {
    id: "s-2",
    clientId: DEMO_CLIENT_ID,
    startsAt: isoTime(-12, 18),
    durationMinutes: 45,
    location: "Online",
    status: "completed",
    coachNotes:
      "Good check-in. Weight trending down about 0.4kg a week, which is where we want it. Agreed to add a fourth session while the evenings are quiet.",
  },
  {
    id: "s-3",
    clientId: DEMO_CLIENT_ID,
    startsAt: isoTime(-33, 17),
    durationMinutes: 60,
    location: "Online",
    status: "completed",
    coachNotes: "Onboarding call. Set the starting calorie target at 1,950 and mapped out the week.",
  },
  {
    id: "s-4",
    clientId: "demo-client-2",
    startsAt: isoTime(1, 7),
    durationMinutes: 60,
    location: "Newcastle upon Tyne",
    status: "scheduled",
    coachNotes: null,
  },
  {
    id: "s-5",
    clientId: "demo-client-3",
    startsAt: isoTime(3, 11),
    durationMinutes: 45,
    location: "Online",
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
    coachNotes: "Leave two reps in the tank on the squats. If the knee grumbles, drop the depth.",
    clientNote: null,
    completedAt: null,
    items: [
      { id: "wi-1", workoutId: "w-today", position: 0, label: "Back squat", target: "4 × 5 @ 70kg", done: false, doneAt: null },
      { id: "wi-2", workoutId: "w-today", position: 1, label: "Romanian deadlift", target: "3 × 8 @ 60kg", done: false, doneAt: null },
      { id: "wi-3", workoutId: "w-today", position: 2, label: "Walking lunges", target: "3 × 10 each leg", done: false, doneAt: null },
      { id: "wi-4", workoutId: "w-today", position: 3, label: "Leg curl", target: "3 × 12", done: false, doneAt: null },
      { id: "wi-5", workoutId: "w-today", position: 4, label: "Plank", target: "3 × 45 seconds", done: false, doneAt: null },
    ],
  },
  {
    id: "w-1",
    clientId: DEMO_CLIENT_ID,
    scheduledFor: isoDate(-2),
    title: "Upper body — push",
    coachNotes: null,
    clientNote: "Bench felt strong, went up to 45kg on the last set. Shoulder fine.",
    completedAt: isoTime(-2, 19),
    items: [
      { id: "wi-6", workoutId: "w-1", position: 0, label: "Bench press", target: "4 × 6 @ 42.5kg", done: true, doneAt: isoTime(-2, 18) },
      { id: "wi-7", workoutId: "w-1", position: 1, label: "Overhead press", target: "3 × 8 @ 25kg", done: true, doneAt: isoTime(-2, 18) },
      { id: "wi-8", workoutId: "w-1", position: 2, label: "Incline dumbbell press", target: "3 × 10", done: true, doneAt: isoTime(-2, 19) },
      { id: "wi-9", workoutId: "w-1", position: 3, label: "Cable fly", target: "3 × 12", done: true, doneAt: isoTime(-2, 19) },
    ],
  },
  {
    id: "w-2",
    clientId: DEMO_CLIENT_ID,
    scheduledFor: isoDate(-4),
    title: "Full body — conditioning",
    coachNotes: null,
    clientNote: "Ran out of time, skipped the carries.",
    completedAt: isoTime(-4, 20),
    items: [
      { id: "wi-10", workoutId: "w-2", position: 0, label: "Goblet squat", target: "3 × 12", done: true, doneAt: isoTime(-4, 19) },
      { id: "wi-11", workoutId: "w-2", position: 1, label: "Row machine", target: "5 × 250m", done: true, doneAt: isoTime(-4, 20) },
      { id: "wi-12", workoutId: "w-2", position: 2, label: "Farmer's carry", target: "4 × 40m", done: false, doneAt: null },
    ],
  },
];

export const demoFoodPlans: FoodPlan[] = [
  {
    id: "fp-1",
    clientId: DEMO_CLIENT_ID,
    effectiveFrom: isoDate(-14),
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
    effectiveFrom: isoDate(-30),
    calorieTarget: 2600,
    proteinTarget: 180,
    notes: "Night shifts: keep the big meal before you leave, not at 3am.",
    meals: [],
  },
];

export const demoFoodLogs: FoodLog[] = [
  { id: "fl-1", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(0), calories: 420, note: "Breakfast", createdAt: isoTime(0, 8) },
  { id: "fl-2", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(0), calories: 610, note: "Lunch — swapped rice for a jacket potato", createdAt: isoTime(0, 13) },
  { id: "fl-3", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-1), calories: 1890, note: "End of day total. Felt easy.", createdAt: isoTime(-1, 21) },
  { id: "fl-4", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-2), calories: 2210, note: "Meal out — went over.", createdAt: isoTime(-2, 22) },
  { id: "fl-5", clientId: "demo-client-2", loggedFor: isoDate(0), calories: 1450, note: null, createdAt: isoTime(0, 12) },
];

export const demoWeightEntries: WeightEntry[] = [
  { id: "we-1", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-1), weightKg: 71.4, note: null },
  { id: "we-2", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-2), weightKg: 71.6, note: null },
  { id: "we-3", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-3), weightKg: 71.9, note: "Salty meal yesterday" },
  { id: "we-4", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-4), weightKg: 71.5, note: null },
  { id: "we-5", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-5), weightKg: 72.0, note: null },
  { id: "we-6", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-6), weightKg: 72.2, note: null },
  { id: "we-7", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-7), weightKg: 72.3, note: null },
  { id: "we-8", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-10), weightKg: 72.8, note: null },
  { id: "we-9", clientId: DEMO_CLIENT_ID, loggedFor: isoDate(-14), weightKg: 73.4, note: null },
  { id: "we-10", clientId: "demo-client-2", loggedFor: isoDate(0), weightKg: 88.2, note: null },
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
