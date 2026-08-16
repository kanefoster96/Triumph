import type { Plan } from "@/lib/types";

/**
 * One product. Online coaching is the business; in-person is a local extra
 * for people who can get to Newcastle.
 */
export const plans: Plan[] = [
  {
    id: "plan-online",
    name: "Online Coaching",
    price: 120,
    cadence: "month",
    description:
      "Everything, for one monthly price. Your meal plan, your training plan, regular check-ins and a coach who adjusts both as you go.",
    features: [
      "Personalised calorie and protein targets",
      "A meal plan built around food you actually eat",
      "Training plan written for your gym and your days",
      "Regular check-ins with real adjustments",
      "Direct messaging with Dean",
      "Members' community access",
      "No contract — cancel any time",
    ],
    popular: true,
    ctaLabel: "Book a free consult",
  },
  {
    id: "plan-in-person",
    name: "In-person, Newcastle",
    price: 45,
    cadence: "session",
    description:
      "Face-to-face sessions in Newcastle upon Tyne. Good for nailing technique early, or as a regular add-on alongside your online coaching.",
    features: [
      "One-to-one coaching in person",
      "Technique work on the main lifts",
      "Available alongside online coaching",
      "Block booking available",
    ],
    ctaLabel: "Ask about availability",
  },
];
