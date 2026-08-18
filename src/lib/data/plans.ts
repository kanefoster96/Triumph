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
    ctaLabel: "Request a free consultation",
  },
];
