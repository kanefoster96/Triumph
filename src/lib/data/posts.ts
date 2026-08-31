import type { Post } from "@/lib/types";

/**
 * Dean's coaching notes. On the website this shows what working with him is
 * like; in the members' area the same shape becomes the community feed.
 */
export const posts: Post[] = [
  {
    id: "p-1",
    kind: "tip",
    title: "A stall almost never means the plan is wrong",
    body: "Nine times out of ten, when someone tells me progress has stalled, life just got busy for a few weeks — a handful of sessions missed, nothing to feel bad about. Before I touch the plan, we look at what actually happened. Most of the time the fix is not a new programme, it is picking back up where you left off — and I would rather help you do that than make you feel guilty about it.",
    date: "2026-08-11",
    likes: 302,
    comments: 41,
    tags: ["Coaching", "Mindset"],
  },
  {
    id: "p-2",
    kind: "note",
    title: "Meal plan, or just the numbers — whatever you will use",
    body: "Some people want to know exactly what to eat, meal by meal, so that is where we start. Others find a meal plan is one more thing to manage on top of a school run, a work lunch and a Friday night — for them I strip it right back to a calorie and protein target so they can build their own day around it. Neither one is the 'proper' way to do it. The right one is whichever you are still doing in a month.",
    date: "2026-08-08",
    likes: 221,
    comments: 34,
    tags: ["Nutrition"],
  },
  {
    id: "p-3",
    kind: "win",
    title: "Eight months of consistency beats eight weeks of intensity",
    body: "One of my clients works rotating nights. His plan is not clever — it is three sessions, written so they still work on four hours of sleep. Eight months in, he is down 10kg and stronger than he has ever been. Nothing about it was dramatic.",
    date: "2026-08-04",
    likes: 184,
    comments: 23,
    tags: ["Consistency", "Shift work"],
  },
  {
    id: "p-4",
    kind: "session",
    title: "Thirty minutes counts",
    body: "The session you fit in during nap time is worth infinitely more than the ninety-minute one you keep planning for next week. Two hard compound lifts and something for your back will do more over a year than any perfect goal you never start.",
    date: "2026-07-30",
    likes: 96,
    comments: 12,
    tags: ["Parents", "Training"],
  },
];
