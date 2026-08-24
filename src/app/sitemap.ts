import type { MetadataRoute } from "next";
import { getGoalSlugs } from "@/lib/services/content";

/** Set NEXT_PUBLIC_SITE_URL in the deploy environment. */
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://triumph.fit";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getGoalSlugs();
  const staticRoutes = ["", "/coaching", "/results", "/pricing", "/about", "/contact"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...slugs.map((slug) => ({
      url: `${baseUrl}/coaching/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
