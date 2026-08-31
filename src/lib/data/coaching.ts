import type { Feature } from "@/lib/types";

/** The single monthly price. Everything below is included at this price. */
export const coachingPrice = {
  amount: 120,
  cadence: "month" as const,
};

/**
 * What the monthly coaching includes.
 *
 * The home page shows the first three, so those three are the ones that have to
 * carry the offer on their own — food, training, and somebody watching. Titles
 * are a few words and bodies are one line: the rail underneath already lists
 * every last thing, and saying it twice at length was most of why the page read
 * as heavy.
 */
export const included: Feature[] = [
  {
    id: "inc-meal",
    icon: "meal",
    title: "Food you actually like",
    body: "Your targets, your meals. No chicken and rice.",
  },
  {
    id: "inc-workout",
    icon: "workout",
    title: "Workouts, set by set",
    body: "Built for your gym and your week. Open the app and go.",
  },
  {
    id: "inc-checkin",
    icon: "checkin",
    title: "Dean checks in weekly",
    body: "He reads your week and helps you figure out what is next.",
  },
  {
    id: "inc-adjust",
    icon: "adjust",
    title: "The plan keeps up",
    body: "Stalled, injured, away? It changes with you.",
  },
  {
    id: "inc-chat",
    icon: "chat",
    title: "Message him any time",
    body: "Stuck on a lift or a menu? Ask and get an answer.",
  },
  {
    id: "inc-community",
    icon: "community",
    title: "A community behind you",
    body: "Every client in one place. Wins get noticed.",
  },
];

/**
 * The members' area — the product surfaces behind the login, and the screens
 * the marketing site previews.
 *
 * Nothing here is labelled as unfinished any more, which means everything here
 * is advertised as working and has to exist behind the login. All four now do:
 * `mem-community` is the board at `/app/board`, built rather than dropped.
 * Anything added to this list has to be a claim the product can keep.
 */
export const memberArea: Feature[] = [
  {
    id: "mem-plan",
    icon: "plan",
    title: "Your plan page",
    body: "Your calorie targets and your workout for the day, in one place. Open it in the gym, work down the list, tick sessions off as you go.",
    preview: {
      kind: "plan",
      calorieTarget: 1950,
      caloriesSoFar: 1030,
      workout: "Lower body — strength",
      exercises: [
        { name: "Back squat", target: "4 × 5 @ 70kg", done: true },
        { name: "Romanian deadlift", target: "3 × 8 @ 60kg", done: true },
        { name: "Walking lunges", target: "3 × 10 each leg", done: false },
        { name: "Leg curl", target: "3 × 12", done: false },
      ],
    },
  },
  {
    id: "mem-log",
    icon: "log",
    title: "Daily logging",
    body: "Enter your final calorie total and any notes from the session — what felt heavy, what you had to swap, what hurt. That is what your next adjustment is built from.",
    preview: {
      kind: "log",
      calories: 1890,
      meals: [
        { name: "Breakfast", done: true },
        { name: "Lunch", done: true },
        { name: "Dinner", done: true },
        { name: "Snack", done: false },
      ],
      note: "Bench felt strong — went up to 45kg on the last set. Shoulder fine.",
    },
  },
  {
    id: "mem-community",
    icon: "community",
    title: "Community feed",
    body: "A members-only feed for everyone being coached. Ask questions, post wins, and see that everyone else has hard weeks too.",
    preview: {
      kind: "feed",
      posts: [
        {
          id: "fp-1",
          name: "Sofia M.",
          when: "2h",
          body: "First unassisted chin-up this morning. Six months ago I could not hang off the bar.",
          likes: 14,
          replies: 5,
        },
        {
          id: "fp-2",
          name: "Danny O.",
          when: "Yesterday",
          body: "Third week of nights and I have still hit every session. Writing the plan around the rota is the only reason.",
          likes: 9,
          replies: 3,
        },
      ],
    },
  },
  {
    id: "mem-chat",
    icon: "chat",
    title: "Chat with Dean",
    body: "Message me directly from inside the app, with your plan and your logs right there in the conversation.",
    preview: {
      kind: "chat",
      messages: [
        { id: "m-1", from: "you", body: "Knee felt off on squats today so I dropped to 60kg." },
        { id: "m-2", from: "dean", body: "Good call. Leave it there this week and we will reassess Friday." },
        { id: "m-3", from: "you", body: "Should I still do the lunges?" },
        { id: "m-4", from: "dean", body: "Swap them for a leg press. Same job, kinder on the knee." },
      ],
    },
  },
];

/** How coaching actually runs, start to steady state. */
export const process = [
  {
    title: "Free consult",
    body: "Tell Dean your goal. He’ll tell you exactly how he’d get you there. No pressure, no card needed.",
  },
  {
    title: "Your starting point",
    body: "A few quick details about you, your week and your food — so the plan fits your life, not someone else’s.",
  },
  {
    title: "Your plan lands in 48 hours",
    body: "Food targets and a full training plan, built for you, in your app, ready to go.",
  },
  {
    title: "Check in. Stay on target. Win.",
    body: "You track, Dean reviews weekly and adjusts. That loop is what keeps you moving.",
  },
];

/**
 * Everything a client gets, as short phrases rather than sentences.
 *
 * These scroll past on the home page and stand still under reduced motion, so
 * each one has to make sense on its own and at a glance. Value, not mechanics:
 * what they get, never how it is built.
 */
export const everything: string[] = [
  "Your calorie target, every day",
  "Every meal, with the amounts",
  "A shopping list that writes itself",
  "Swap a meal you do not fancy",
  "Recipes with the method",
  "Protein and macro targets",
  "Your workout, set by set",
  "Tick sessions off as you go",
  "Personal bests tracked",
  "Every weight and rep logged",
  "Your whole training history",
  "Weekly check-ins",
  "Weigh-ins and the trend",
  "Progress photos",
  "24-hour access to your coach",
  "Request an adjustment",
  "Move a session when life moves",
  "Message Dean directly",
  "A note back on every session",
  "The members' community",
  "Train at home or in the gym",
  "Holidays planned around",
  "Injured? The plan changes",
  "A plan for the week ahead",
];
