import type { Coach } from "@/lib/types";

export const coach: Coach = {
  id: "coach-1",
  name: "Dean Foster",
  role: "Online coach & founder",
  location: "Newcastle upon Tyne",
  headline: "I got in shape around a full-time job and two kids. Now I do it for people like you.",
  intro:
    "I got in shape around a full-time job and two kids — no secrets, just tracking what I did and adjusting every week when life got in the way, which it always does. I have coached people across the UK the same way ever since, and I care about how your week actually went, not just the number on the scale. Whatever your goal, you get a plan built for your life, a coach who changes it when your life changes, and someone in your corner on the weeks that do not go to plan.",
  bio: [
    "No secrets, no hacks. I tracked what I did, checked in weekly, and adjusted as life happened. That’s the exact system every client gets — and it’s why they get results whether their goal is fat loss, strength, or just feeling good again.",
    "An off week does not undo anything with me — it is just what we adjust around next. I ask how your week actually went because I want to know, not to catch you out, and the clients who stick around longest are usually the ones who had a rough patch early on and found out I meant it.",
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
  photo: "/coach/dean.jpg",
  photoLarge: "/coach/dean-training.jpg",
  since: 2021,
};
