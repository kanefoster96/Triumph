import type { NextConfig } from "next";

/**
 * The goals used to be named after training styles, and those URLs were live.
 * Each one points at the goal that now covers the same person, so an old link
 * or a search result lands somewhere sensible rather than on a 404.
 *
 * "hybrid" has no successor — running and lifting is not one of the five
 * people Dean coaches — so it goes to the closest fit, somebody who already
 * trains.
 */
const retiredGoals: Record<string, string> = {
  "fat-loss": "lost-it-before",
  "strength-and-muscle": "stuck-at-the-same-numbers",
  "parent-reset": "busy-parents",
  foundations: "back-after-time-off",
  hybrid: "stuck-at-the-same-numbers",
};

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(retiredGoals).map(([from, to]) => ({
      source: `/coaching/${from}`,
      destination: `/coaching/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
