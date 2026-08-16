/**
 * Domain models for Triumph.
 *
 * Deliberately free of React and web types: the same models back the website
 * today and the React Native app later. Anything visual (icons, gradients) is
 * referenced by key, not by component, so each platform can map it itself.
 */

export type TrainingFormat = "1:1" | "Small group" | "Online" | "Hybrid";
export type Level = "Beginner" | "Intermediate" | "Advanced" | "All levels";

/** Keys map to a gradient pair in `MediaFrame`, so no image asset is required. */
export type VisualKey =
  | "strength"
  | "conditioning"
  | "hybrid"
  | "online"
  | "mobility"
  | "nutrition";

export interface Coach {
  id: string;
  name: string;
  role: string;
  location: string;
  headline: string;
  bio: string[];
  /** How he works — deliberately not professional certifications. */
  highlights: string[];
  /**
   * Real qualifications. Left empty until Dean supplies them: inventing
   * certifications for a named person would be a false claim.
   */
  qualifications: string[];
  specialties: string[];
  /** Optional photo path under /public. Falls back to a generated visual. */
  photo?: string;
  since: number;
}

/**
 * A goal a client's programme gets built around. These are not separate
 * products — every one is delivered through the same monthly coaching.
 */
export interface Programme {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  level: Level;
  whoFor: string[];
  typicalWeek: string[];
  outcomes: string[];
  visual: VisualKey;
  popular?: boolean;
}

/** Something the monthly coaching includes, or a members' area feature. */
export interface Feature {
  id: string;
  icon: FeatureIcon;
  title: string;
  body: string;
  /** Marks a feature that is planned rather than live. */
  comingSoon?: boolean;
}

export type FeatureIcon =
  | "meal"
  | "workout"
  | "checkin"
  | "adjust"
  | "community"
  | "chat"
  | "plan"
  | "log"
  | "person";

export interface Plan {
  id: string;
  name: string;
  price: number;
  cadence: "week" | "month" | "session";
  description: string;
  features: string[];
  popular?: boolean;
  ctaLabel: string;
}

export interface MetricDelta {
  label: string;
  value: string;
  direction: "up" | "down" | "flat";
}

export interface Transformation {
  id: string;
  name: string;
  age: number;
  weeks: number;
  headline: string;
  quote: string;
  metrics: MetricDelta[];
  programmeSlug: string;
  visual: VisualKey;
}

export interface Testimonial {
  id: string;
  name: string;
  handle: string;
  role: string;
  body: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** ISO date. */
  date: string;
  programme: string;
}

/** A coach post — the social-feed surface that carries straight into the app. */
export interface Post {
  id: string;
  kind: "tip" | "win" | "session" | "note";
  title: string;
  body: string;
  date: string;
  likes: number;
  comments: number;
  tags: string[];
}

export interface ScheduleSlot {
  id: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  time: string;
  title: string;
  format: TrainingFormat;
  location: string;
  spots: number;
  capacity: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Stat {
  label: string;
  value: string;
  suffix?: string;
}

export interface EnquiryDraft {
  name: string;
  email: string;
  phone?: string;
  goal: string;
  programmeSlug?: string;
  experience: Level;
  /** Online, in person, or both. */
  coachingType?: string;
  message?: string;
}

export interface EnquiryResult {
  ok: boolean;
  reference: string;
  message: string;
}
