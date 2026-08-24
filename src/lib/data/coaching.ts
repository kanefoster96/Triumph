import type { Feature } from "@/lib/types";

/** The single monthly price. Everything below is included at this price. */
export const coachingPrice = {
  amount: 120,
  cadence: "month" as const,
};

/** What the monthly coaching includes. */
export const included: Feature[] = [
  {
    id: "inc-meal",
    icon: "meal",
    title: "A meal plan built for you",
    body: "Calorie and protein targets set from your body and your goal, with a plan built around food you actually eat. Vegetarian, shift work, fussy kids, eating out — all accounted for, not ignored.",
  },
  {
    id: "inc-workout",
    icon: "workout",
    title: "A workout plan for your gym",
    body: "Written for the equipment you have and the number of days you can genuinely train. Every session laid out set by set, so you never walk in wondering what you are doing.",
  },
  {
    id: "inc-checkin",
    icon: "checkin",
    title: "Regular check-ins",
    body: "We review what actually happened each week — weight, training, sleep, how the week felt — and I come back to you with what to change and why.",
  },
  {
    id: "inc-adjust",
    icon: "adjust",
    title: "Real adjustments, not a static PDF",
    body: "Your plan moves as you do. Stalled for two weeks, picked up an injury, got a holiday coming? The plan changes. That is the whole point of having a coach.",
  },
  {
    id: "inc-chat",
    icon: "chat",
    title: "Direct line to me",
    body: "Message me when something comes up — a dodgy knee, a menu you cannot read, a session you are not sure about. You are not filing a support ticket; you are texting your coach.",
  },
  {
    id: "inc-community",
    icon: "community",
    title: "The members' community",
    body: "Everyone training with me, in one place. Wins, questions, and the accountability that comes from other people knowing you said you would train today.",
  },
];

/**
 * The members' area — the product surfaces behind the login, and the screens
 * the marketing site previews.
 *
 * Nothing here is labelled as unfinished any more, which means everything here
 * is advertised as working and has to exist behind the login. Three of these
 * do. `mem-community` does not: there is no feed route, no service and no
 * table for it. Build it or drop the entry — leaving it listed is a claim the
 * product cannot keep.
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
    body: "A short call about where you are, what you want, and whether I am the right coach for it. No pressure and no script.",
  },
  {
    title: "Your starting picture",
    body: "Height, weight, training history, injuries, what your week really looks like, and what food you like. This is what the plan gets built from.",
  },
  {
    title: "Your plan lands",
    body: "Calorie and protein targets plus a full training plan for your gym and your available days — usually within 48 hours.",
  },
  {
    title: "Check in, adjust, repeat",
    body: "You log your days, we review each week, and I adjust. That loop is what makes the difference between a plan and coaching.",
  },
];
