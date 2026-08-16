import { coach } from "@/lib/data/coach";
import { faqs } from "@/lib/data/faqs";
import { payAsYouGo, plans } from "@/lib/data/plans";
import { posts } from "@/lib/data/posts";
import { programmes } from "@/lib/data/programmes";
import { schedule } from "@/lib/data/schedule";
import { testimonials } from "@/lib/data/testimonials";
import { transformations } from "@/lib/data/transformations";
import type {
  Coach,
  FaqItem,
  Plan,
  Post,
  Programme,
  ScheduleSlot,
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

export async function getProgrammes(): Promise<Programme[]> {
  return programmes;
}

export async function getProgramme(slug: string): Promise<Programme | undefined> {
  return programmes.find((p) => p.slug === slug);
}

export async function getProgrammeSlugs(): Promise<string[]> {
  return programmes.map((p) => p.slug);
}

export async function getPlans(): Promise<Plan[]> {
  return plans;
}

export async function getPayAsYouGo(): Promise<Plan> {
  return payAsYouGo;
}

export async function getTestimonials(limit?: number): Promise<Testimonial[]> {
  const sorted = [...testimonials].sort((a, b) => b.date.localeCompare(a.date));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function getTransformations(limit?: number): Promise<Transformation[]> {
  return typeof limit === "number" ? transformations.slice(0, limit) : transformations;
}

export async function getTransformationsByProgramme(slug: string): Promise<Transformation[]> {
  return transformations.filter((t) => t.programmeSlug === slug);
}

export async function getPosts(limit?: number): Promise<Post[]> {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function getSchedule(): Promise<ScheduleSlot[]> {
  return schedule;
}

export async function getFaqs(limit?: number): Promise<FaqItem[]> {
  return typeof limit === "number" ? faqs.slice(0, limit) : faqs;
}

export { submitEnquiry, validateEnquiry } from "@/lib/services/enquiry";
