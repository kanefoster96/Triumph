import { coach } from "@/lib/data/coach";
import { coachingPrice, everything, included, memberArea, process } from "@/lib/data/coaching";
import { faqs } from "@/lib/data/faqs";
import { plans } from "@/lib/data/plans";
import { posts } from "@/lib/data/posts";
import { goals } from "@/lib/data/goals";
import { clientCount } from "@/lib/data/site";
import { testimonials } from "@/lib/data/testimonials";
import { transformations } from "@/lib/data/transformations";
import type {
  Coach,
  FaqItem,
  Feature,
  Plan,
  Post,
  Goal,
  Testimonial,
  Transformation,
} from "@/lib/types";

/**
 * The single seam between the UI and wherever content lives.
 *
 * Everything is async and returns plain serialisable data, so replacing these
 * bodies with `fetch` / Supabase calls later touches this file only — and the
 * React Native app can import this module unchanged.
 */

export async function getCoach(): Promise<Coach> {
  return coach;
}

export async function getGoals(): Promise<Goal[]> {
  return goals;
}

export async function getGoal(slug: string): Promise<Goal | undefined> {
  return goals.find((p) => p.slug === slug);
}

export async function getGoalSlugs(): Promise<string[]> {
  return goals.map((p) => p.slug);
}

export async function getPlans(): Promise<Plan[]> {
  return plans;
}

/** The headline monthly price for the online coaching. */
export async function getCoachingPrice(): Promise<typeof coachingPrice> {
  return coachingPrice;
}

/** What the monthly coaching includes. */
export async function getEverything(): Promise<string[]> {
  return everything;
}

export async function getIncluded(): Promise<Feature[]> {
  return included;
}

/** Members' area surfaces, some of which are still to be built. */
export async function getMemberArea(): Promise<Feature[]> {
  return memberArea;
}

export async function getProcess(): Promise<typeof process> {
  return process;
}

export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  const sorted = [...testimonials].sort((a, b) => b.date.localeCompare(a.date));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

/**
 * The proof line under the hero's buttons: who is training, and how they rate
 * it.
 *
 * Both halves come from the reviews rather than from figures typed beside
 * them, so the stars here and the wall of reviews further down the page
 * cannot drift apart. The faces are the review authors for the same reason —
 * they are the clients, so replacing the placeholder reviews with real ones
 * replaces this too, and adding a photo to `public/clients` lights it up
 * without touching this file.
 */
export async function getSocialProof(): Promise<{
  people: { name: string; photo?: string }[];
  /** Averaged across every review, to one decimal. */
  rating: number;
  reviews: number;
  clients: typeof clientCount;
}> {
  const all = await getTestimonials();
  const total = all.reduce((sum, entry) => sum + entry.rating, 0);
  return {
    people: all.slice(0, 5).map(({ name, photo }) => ({ name, photo })),
    rating: all.length ? Math.round((total / all.length) * 10) / 10 : 0,
    reviews: all.length,
    clients: clientCount,
  };
}

export async function getTransformations(limit?: number): Promise<Transformation[]> {
  return typeof limit === "number" ? transformations.slice(0, limit) : transformations;
}

export async function getTransformationsByGoal(slug: string): Promise<Transformation[]> {
  return transformations.filter((t) => t.goalSlug === slug);
}

export async function getPosts(limit?: number): Promise<Post[]> {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function getFaqs(limit?: number): Promise<FaqItem[]> {
  return typeof limit === "number" ? faqs.slice(0, limit) : faqs;
}

