import type { Plan } from "@/lib/types";

export const plans: Plan[] = [
  {
    id: "plan-online",
    name: "Online",
    price: 180,
    cadence: "month",
    description: "Full programming and coaching, delivered remotely. Train in your own gym, on your own clock.",
    features: [
      "Bespoke programme, rebuilt every 4 weeks",
      "Unlimited video technique review",
      "Weekly written check-in",
      "Nutrition targets and habit tracking",
      "Direct message access, next-day replies",
    ],
    ctaLabel: "Start online",
  },
  {
    id: "plan-hybrid",
    name: "Hybrid",
    price: 340,
    cadence: "month",
    description: "One coached session a week in the studio, everything else programmed for you. The sweet spot for most people.",
    features: [
      "4 coached 1:1 sessions per month",
      "Everything in Online",
      "Monthly testing and body composition review",
      "Priority booking on studio slots",
      "Guest pass for a training partner each month",
    ],
    popular: true,
    ctaLabel: "Book a consult",
  },
  {
    id: "plan-private",
    name: "Private",
    price: 620,
    cadence: "month",
    description: "Two or three sessions a week, face to face. The fastest route if technique or accountability is the bottleneck.",
    features: [
      "8–12 coached 1:1 sessions per month",
      "Everything in Hybrid",
      "Same-day message replies",
      "Quarterly full assessment and re-test",
      "Programme continues through holidays",
    ],
    ctaLabel: "Check availability",
  },
];

export const payAsYouGo: Plan = {
  id: "plan-payg",
  name: "Single session",
  price: 65,
  cadence: "session",
  description: "One-off session for technique work, a programme review, or a taster before committing.",
  features: ["60 minutes 1:1", "Movement screen included", "Written summary afterwards"],
  ctaLabel: "Book a session",
};
