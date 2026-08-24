import type { Post } from "@/lib/types";

/**
 * Dean's coaching notes. On the website this shows what working with him is
 * like; in the members' area the same shape becomes the community feed.
 */
export const posts: Post[] = [
  {
    id: "p-1",
    kind: "tip",
    title: "You are not plateaued, you are inconsistent",
    body: "Nine times out of ten, a client who says progress has stalled has trained eleven of the last twenty sessions. Before we change the plan, we count the sessions that actually happened. The fix is usually attendance, not exercise selection.",
    date: "2026-08-11",
    likes: 302,
    comments: 41,
    tags: ["Coaching", "Mindset"],
  },
  {
    id: "p-2",
    kind: "note",
    title: "Why I do not send meal plans",
    body: "A meal plan tells you what to eat on a perfect day. You do not have perfect days — you have a school run, a work lunch and a Friday night. Targets plus a structure you can hit in a real week beat a perfect plan you abandon by Wednesday.",
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
