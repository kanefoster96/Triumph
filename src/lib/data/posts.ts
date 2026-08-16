import type { Post } from "@/lib/types";

/**
 * The coach feed. On the website this is a "what training here is actually
 * like" surface; in the app it becomes the home timeline, so the shape already
 * carries engagement counts and tags.
 */
export const posts: Post[] = [
  {
    id: "p-1",
    kind: "win",
    title: "Priya pulled 140kg this morning",
    body: "Twelve weeks ago this was 90kg and it moved like it was bolted down. Nothing clever in the programme — the same five lifts, a little more load each week, and she showed up for every session.",
    date: "2026-08-14",
    likes: 184,
    comments: 23,
    tags: ["Strength Block", "Deadlift"],
  },
  {
    id: "p-2",
    kind: "tip",
    title: "You are not plateaued, you are inconsistent",
    body: "Nine times out of ten the client who says their progress stalled has trained eleven of the last twenty sessions. Before you change the programme, count the sessions you actually did. The fix is usually attendance, not exercise selection.",
    date: "2026-08-11",
    likes: 302,
    comments: 41,
    tags: ["Coaching", "Mindset"],
  },
  {
    id: "p-3",
    kind: "session",
    title: "Wednesday small group: tempo squats and carries",
    body: "Four sets of five at a three-second lowering, then loaded carries until posture breaks. Brutal on paper, thirty-eight minutes in practice. Two spots opening up in the 6:30am group from September.",
    date: "2026-08-09",
    likes: 96,
    comments: 12,
    tags: ["Small group", "Studio"],
  },
  {
    id: "p-4",
    kind: "note",
    title: "On tracking food without losing your mind",
    body: "Log for two weeks to find out what you actually eat, then stop. The point of tracking is information, not a permanent tax on every meal. Most clients weigh food for a fortnight and never open the app again.",
    date: "2026-08-04",
    likes: 221,
    comments: 34,
    tags: ["Nutrition"],
  },
];
