import type { ScheduleSlot } from "@/lib/types";

export const schedule: ScheduleSlot[] = [
  { id: "s-1", day: "Mon", time: "06:30", title: "Strength — small group", format: "Small group", location: "Bengal Works", spots: 2, capacity: 6 },
  { id: "s-2", day: "Mon", time: "18:00", title: "1:1 coaching", format: "1:1", location: "Bengal Works", spots: 1, capacity: 1 },
  { id: "s-3", day: "Tue", time: "07:00", title: "Conditioning — small group", format: "Small group", location: "Bengal Works", spots: 0, capacity: 6 },
  { id: "s-4", day: "Tue", time: "19:00", title: "Online check-in calls", format: "Online", location: "Video", spots: 4, capacity: 6 },
  { id: "s-5", day: "Wed", time: "06:30", title: "Strength — small group", format: "Small group", location: "Bengal Works", spots: 3, capacity: 6 },
  { id: "s-6", day: "Wed", time: "12:00", title: "1:1 coaching", format: "1:1", location: "Bengal Works", spots: 1, capacity: 1 },
  { id: "s-7", day: "Thu", time: "07:00", title: "Hybrid — track session", format: "Small group", location: "Sportcity", spots: 5, capacity: 10 },
  { id: "s-8", day: "Thu", time: "18:00", title: "1:1 coaching", format: "1:1", location: "Bengal Works", spots: 0, capacity: 1 },
  { id: "s-9", day: "Fri", time: "06:30", title: "Strength — small group", format: "Small group", location: "Bengal Works", spots: 1, capacity: 6 },
  { id: "s-10", day: "Sat", time: "09:00", title: "Open studio + form clinic", format: "Hybrid", location: "Bengal Works", spots: 6, capacity: 12 },
];
