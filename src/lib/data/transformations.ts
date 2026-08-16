import type { Transformation } from "@/lib/types";

/**
 * PLACEHOLDER CONTENT — these are not real clients or real results.
 * Replace every entry with genuine, verifiable numbers before promoting the
 * site. Published results claims need to be true.
 */
export const transformations: Transformation[] = [
  {
    id: "tr-1",
    name: "Tom",
    age: 41,
    weeks: 16,
    headline: "14kg down, without giving up eating out",
    quote: "It took longer than a crash diet. It also stayed off.",
    metrics: [
      { label: "Bodyweight", value: "104 → 90kg", direction: "down" },
      { label: "Waist", value: "104 → 88cm", direction: "down" },
      { label: "Bench press", value: "80 → 85kg", direction: "up" },
    ],
    programmeSlug: "fat-loss",
    visual: "conditioning",
  },
  {
    id: "tr-2",
    name: "Priya",
    age: 34,
    weeks: 12,
    headline: "Stalled for a year, then moving again",
    quote: "Same five lifts for three months. That was the point.",
    metrics: [
      { label: "Deadlift", value: "90 → 140kg", direction: "up" },
      { label: "Back squat", value: "70 → 102kg", direction: "up" },
      { label: "Bodyweight", value: "62kg held", direction: "flat" },
    ],
    programmeSlug: "strength-and-muscle",
    visual: "strength",
  },
  {
    id: "tr-3",
    name: "Sofia",
    age: 33,
    weeks: 24,
    headline: "Back to training with two under four",
    quote: "We started with 20 minutes. Six months later I did three chin-ups.",
    metrics: [
      { label: "Chin-ups", value: "0 → 3", direction: "up" },
      { label: "Sessions hit", value: "89%", direction: "up" },
      { label: "Injuries", value: "None", direction: "flat" },
    ],
    programmeSlug: "parent-reset",
    visual: "mobility",
  },
  {
    id: "tr-4",
    name: "Michelle",
    age: 38,
    weeks: 20,
    headline: "9kg lost around a rotating shift pattern",
    quote: "The plan assumed I would be tired. That is why it worked.",
    metrics: [
      { label: "Bodyweight", value: "78 → 69kg", direction: "down" },
      { label: "10k", value: "58:40 → 51:15", direction: "down" },
      { label: "Sessions hit", value: "91%", direction: "up" },
    ],
    programmeSlug: "fat-loss",
    visual: "online",
  },
  {
    id: "tr-5",
    name: "Alex",
    age: 29,
    weeks: 12,
    headline: "Sub-40 10k with a heavier squat",
    quote: "Lifting and running only fight each other if you plan them badly.",
    metrics: [
      { label: "10k", value: "42:10 → 38:52", direction: "down" },
      { label: "Back squat", value: "120 → 130kg", direction: "up" },
      { label: "Weekly km", value: "28 → 52", direction: "up" },
    ],
    programmeSlug: "hybrid",
    visual: "hybrid",
  },
  {
    id: "tr-6",
    name: "Danny",
    age: 47,
    weeks: 32,
    headline: "Eight months in, still training around nights",
    quote: "First plan I have ever kept going past February.",
    metrics: [
      { label: "Bodyweight", value: "98 → 88kg", direction: "down" },
      { label: "Deadlift", value: "100 → 150kg", direction: "up" },
      { label: "Weeks on plan", value: "32", direction: "up" },
    ],
    programmeSlug: "strength-and-muscle",
    visual: "strength",
  },
];
