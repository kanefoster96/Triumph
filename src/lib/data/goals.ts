import type { Goal } from "@/lib/types";

/**
 * The five people who come to Dean, named as themselves rather than as
 * training styles. Every one is delivered through the same monthly coaching —
 * these are not products, and there is no price or level attached to any of
 * them.
 *
 * They are drawn from the specialties on Dean's own profile, so the goals and
 * the about page say the same thing.
 */
export const goals: Goal[] = [
  {
    id: "goal-parents",
    slug: "busy-parents",
    name: "Busy parents",
    tagline: "Fit enough to keep up with them",
    summary:
      "The reason I started. Training built around nap times, night wakings and a week you do not fully control — short enough that it actually happens, hard enough to be worth doing.",
    whoFor: [
      "You have not trained properly since the kids arrived",
      "Your time is not really your own",
      "You want energy for family life, not a six-pack",
    ],
    howIHelp: [
      "Three sessions of 30–45 minutes, at home or the gym",
      "Sessions that still count on four hours of sleep",
      "Food targets that survive a chaotic week",
      "The plan moves when your week does",
    ],
    outcomes: [
      "Noticeably more energy through the day",
      "Strength back in the movements family life asks for",
      "A routine that holds together when the week does not",
    ],
    visual: "mobility",
    popular: true,
  },
  {
    id: "goal-fat-loss",
    slug: "lost-it-before",
    name: "Dieted before, it came back",
    tagline: "Lose it once, and keep it off",
    summary:
      "A calorie target you can actually live on, built from the food you already eat, with training that protects the muscle underneath. No shakes, no banned foods, no starting again on Monday.",
    whoFor: [
      "You have lost weight before and watched it come back",
      "You eat out, travel, or cook for other people",
      "You want it gone for good, not for one holiday",
    ],
    howIHelp: [
      "Calorie and protein targets set from your body, not a chart",
      "Meals built from the food you already like eating",
      "Three or four lifting sessions to hold onto muscle",
      "A daily step target instead of punishment cardio",
    ],
    outcomes: [
      "Steady loss without the energy crash",
      "Strength kept, or improved, through the deficit",
      "A maintenance plan for the day you hit the number",
    ],
    visual: "nutrition",
  },
  {
    id: "goal-restart",
    slug: "back-after-time-off",
    name: "Back after time off",
    tagline: "Start properly, without feeling lost",
    summary:
      "For anyone who has not trained in years, or never really has. We build the handful of movements you will use forever, and turn training into a habit before we make it hard.",
    whoFor: [
      "The gym feels intimidating and you are not sure where to start",
      "You have never followed a real plan",
      "You want to know you are doing it right",
    ],
    howIHelp: [
      "Two or three straightforward full-body sessions",
      "Video form checks, so technique is right early",
      "One habit at a time rather than all of them at once",
      "Everything explained, so you know why you are doing it",
    ],
    outcomes: [
      "Confidence walking into any gym",
      "Clean technique on the movements that matter",
      "First real strength numbers to build from",
    ],
    visual: "conditioning",
  },
  {
    id: "goal-shift-work",
    slug: "shift-work-and-travel",
    name: "Shift work and travel",
    tagline: "A plan that survives your rota",
    summary:
      "Nights, early starts, airports, and a week that never looks the same twice. The plan assumes the disruption rather than pretending it away, so one bad rota does not cost you the month.",
    whoFor: [
      "Your shifts rotate, or you are away most weeks",
      "Every plan you have tried assumed a normal week",
      "You train in whatever gym you can get to",
    ],
    howIHelp: [
      "Sessions that work in a hotel gym or a full one",
      "Training placed around your rota, not a fixed week",
      "Food sorted for service stations and hotels",
      "Missed days moved, not written off",
    ],
    outcomes: [
      "Training that keeps going through a bad rota",
      "Eating handled when you are nowhere near your kitchen",
      "Progress measured over months, not perfect weeks",
    ],
    visual: "online",
  },
  {
    id: "goal-plateau",
    slug: "stuck-at-the-same-numbers",
    name: "Stuck at the same numbers",
    tagline: "Get them moving again",
    summary:
      "You already train, and it has stopped paying you back. Progressive work on the lifts that matter, scaled to the sessions you can genuinely commit to and tracked week to week, so progress is a fact rather than a feeling.",
    whoFor: [
      "You train hard already but nothing is moving",
      "You have changed programme three times this year",
      "You want to look like you lift, not just feel tired",
    ],
    howIHelp: [
      "Three to five sessions, scaled to what you can commit to",
      "Main lifts progressed deliberately, week on week",
      "Accessory work chosen for your weak points, not as filler",
      "Numbers logged, so we can see what is actually working",
    ],
    outcomes: [
      "Meaningful increases on your main lifts",
      "Visible size where you have been chasing it",
      "A clear plan for the block after this one",
    ],
    visual: "strength",
  },
];
