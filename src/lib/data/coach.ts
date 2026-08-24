import type { Coach } from "@/lib/types";

export const coach: Coach = {
  id: "coach-1",
  name: "Dean Foster",
  role: "Online coach & founder",
  location: "Newcastle upon Tyne",
  headline: "I got in shape around a full-time job and two kids. Now I do it for people like you.",
  intro:
    "I got in shape around a full-time job and two kids — no secrets, just tracking what I did and adjusting every week. I have coached people across the UK the same way ever since. Whatever your goal, you get a plan built for your life and a coach who changes it when your life changes.",
  bio: [
    "No secrets, no hacks. I tracked what I did, checked in weekly, and adjusted as life happened. That’s the exact system every client gets — and it’s why they get results whether their goal is fat loss, strength, or just feeling good again.",
  ],
  highlights: [
    "80+ clients coached across the UK",
    "In-person in Newcastle upon Tyne",
    "Whatever your goal, the plan fits your life",
    "Checked and adjusted every single week",
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
