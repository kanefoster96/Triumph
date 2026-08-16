import type { Programme } from "@/lib/types";

/**
 * Goals a plan gets built around — not separate products. Every one of these
 * is delivered through the same monthly online coaching.
 */
export const programmes: Programme[] = [
  {
    id: "prog-fat-loss",
    slug: "fat-loss",
    name: "Fat loss",
    tagline: "Lose the weight and keep your strength",
    summary:
      "A calorie target you can actually live on, built around the food you already eat, with training that protects the muscle you have. No shakes, no cutting out entire food groups, no starting again on Monday.",
    level: "All levels",
    whoFor: [
      "You have lost weight before and put it back on",
      "You eat out, travel, or cook for a family",
      "You want it gone for good, not for a holiday",
    ],
    typicalWeek: [
      "3–4 resistance sessions, 45–60 minutes",
      "A daily step target rather than punishment cardio",
      "Calorie and protein targets you log each day",
    ],
    outcomes: [
      "Steady, sustainable loss without energy crashes",
      "Strength maintained or improved through the deficit",
      "A maintenance plan for when you hit the target",
    ],
    visual: "conditioning",
    popular: true,
  },
  {
    id: "prog-strength",
    slug: "strength-and-muscle",
    name: "Strength & muscle",
    tagline: "Get properly strong, on the days you have",
    summary:
      "Progressive training built around the lifts that matter, scaled to the number of sessions you can genuinely commit to. Numbers tracked week to week so progress is a fact rather than a feeling.",
    level: "Intermediate",
    whoFor: [
      "You already train but the numbers have stopped moving",
      "You want to look like you lift, not just feel tired",
      "You are tired of switching programme every six weeks",
    ],
    typicalWeek: [
      "3–5 lifting sessions depending on your schedule",
      "Main lifts progressed deliberately, week on week",
      "Accessory work chosen for your weak points",
    ],
    outcomes: [
      "Meaningful increases on your main lifts",
      "Visible size where you have been chasing it",
      "A clear plan for the block after this one",
    ],
    visual: "strength",
  },
  {
    id: "prog-parent",
    slug: "parent-reset",
    name: "The parent reset",
    tagline: "Get fit enough to enjoy your family",
    summary:
      "The reason I started. Training built around nap times, night wakings and a schedule you do not fully control — short enough to actually happen, hard enough to work.",
    level: "Beginner",
    whoFor: [
      "You have not trained properly since the kids arrived",
      "Your time is not really yours",
      "You want energy for family life, not a six-pack",
    ],
    typicalWeek: [
      "3 sessions of 30–45 minutes, home or gym",
      "Sessions that still count when you are short on sleep",
      "Food targets that survive a chaotic week",
    ],
    outcomes: [
      "Noticeably more energy through the day",
      "Strength back in the movements daily life needs",
      "A routine that holds together when the week does not",
    ],
    visual: "mobility",
  },
  {
    id: "prog-foundations",
    slug: "foundations",
    name: "Foundations",
    tagline: "Start properly, from wherever you are",
    summary:
      "For a complete beginner or anyone coming back after years away. We build the handful of movements you will use forever and turn training into a habit before we make it hard.",
    level: "Beginner",
    whoFor: [
      "The gym feels intimidating and you are not sure where to start",
      "You have never followed a real plan",
      "You want to know you are doing it right",
    ],
    typicalWeek: [
      "2–3 straightforward full-body sessions",
      "Video form checks so technique is right early",
      "One habit at a time rather than everything at once",
    ],
    outcomes: [
      "Confidence walking into any gym",
      "Clean technique on the movements that matter",
      "First real strength numbers to build from",
    ],
    visual: "strength",
  },
  {
    id: "prog-hybrid",
    slug: "hybrid",
    name: "Run & lift",
    tagline: "An engine and some strength, at the same time",
    summary:
      "For runners who want to be strong and lifters who want to be able to run. The two are sequenced so they stop competing with each other, with enough recovery built in to keep you off the physio bench.",
    level: "Intermediate",
    whoFor: [
      "You run but keep picking up niggles",
      "You lift but get out of breath on the stairs",
      "You have an event in the diary",
    ],
    typicalWeek: [
      "2–3 lifting sessions plus structured running",
      "Easy running kept genuinely easy",
      "Load managed so mileage can climb safely",
    ],
    outcomes: [
      "Faster times without losing strength",
      "Fewer niggles as the mileage goes up",
      "A clear taper into your event",
    ],
    visual: "hybrid",
  },
];
