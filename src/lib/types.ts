/**
 * Domain models for Triumph.
 *
 * Deliberately free of React and web types: the same models back the website
 * today and the React Native app later. Anything visual (icons, gradients) is
 * referenced by key, not by component, so each platform can map it itself.
 */

export type TrainingFormat = "1:1" | "Small group" | "Online" | "Hybrid";

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
 * A goal somebody comes with, named after the person rather than a training
 * style. These are not separate products — every one is delivered through the
 * same monthly coaching, which is why there is no level and no price here.
 *
 * The three lists are the three questions a visitor actually has, in order:
 * is this me, what would you do about it, and where does it get me.
 */
export interface Goal {
  id: string;
  slug: string;
  /** Who they are — "Busy parents", not "Strength & muscle". */
  name: string;
  /** What they get, in a line. */
  tagline: string;
  summary: string;
  /** Is this me? */
  whoFor: string[];
  /** What I would do about it. */
  howIHelp: string[];
  /** Where it gets them. */
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
  /** A still of the screen, for features the marketing site previews. */
  preview?: AppPreview;
}

/**
 * One members'-area screen, as data rather than a screenshot.
 *
 * There are no image assets in this project, and a screenshot of a screen that
 * is still being built would age the moment it changed. Each variant carries
 * only what its screen shows, so the preview is edited here rather than in
 * markup — and so nothing in it can drift into claiming a feature works.
 */
export type AppPreview =
  | {
      kind: "plan";
      calorieTarget: number;
      caloriesSoFar: number;
      workout: string;
      exercises: { name: string; target: string; done: boolean }[];
    }
  | {
      kind: "log";
      calories: number;
      meals: { name: string; done: boolean }[];
      note: string;
    }
  | {
      kind: "feed";
      posts: { id: string; name: string; when: string; body: string; likes: number; replies: number }[];
    }
  | {
      kind: "chat";
      messages: { id: string; from: "you" | "dean"; body: string }[];
    };

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
  goalSlug: string;
  visual: VisualKey;
  /**
   * Paths under /public. Both optional: the card shows a labelled empty frame
   * until there is a real photo, because a made-up before-and-after is exactly
   * the thing this page says it does not do.
   */
  before?: string;
  after?: string;
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
  goal: string;
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


