import type { Coach } from "@/lib/types";

export const coach: Coach = {
  id: "coach-1",
  name: "Dean Foster",
  role: "Online coach & founder",
  location: "Newcastle upon Tyne",
  headline: "I started training so I could keep up with my kids. Now I help other people do the same.",
  bio: [
    "Becoming a parent changed what fitness was for. It stopped being about how I looked and started being about energy, health, and being around properly — for the school run, the park, the years after that. So I started training seriously, around a young family and a full schedule.",
    "It worked faster than I expected. Not because I found a secret, but because I stopped programme-hopping, tracked what I was actually doing, and adjusted week by week instead of starting again every January.",
    "Now I coach other people through the same thing, online. Everything I build is personal to you — your food, your gym, your week, your body. No copy-and-paste plan with someone else's name scrubbed off it.",
  ],
  highlights: [
    "Coaching clients online across the UK",
    "In-person sessions in Newcastle upon Tyne",
    "Plans built around real family schedules",
    "Plans adjusted every week, not every quarter",
  ],
  // Intentionally empty — add real certifications here and they render
  // automatically. Nothing is invented on your behalf.
  qualifications: [],
  specialties: [
    "Fat loss without crash dieting",
    "Strength for busy parents",
    "Building a routine that survives a bad week",
    "Training around shift work and travel",
    "Getting started after years off",
  ],
  since: 2021,
};
