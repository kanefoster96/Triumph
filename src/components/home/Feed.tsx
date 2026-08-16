import { getPosts } from "@/lib/services/content";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PostCard } from "@/components/cards/PostCard";

/**
 * The coach feed. On the site it shows what training here is like day to day;
 * in the app this same list becomes the home timeline.
 */
export async function Feed() {
  const posts = await getPosts(4);

  return (
    <Section id="feed">
      <SectionHeader
        eyebrow="From the studio"
        title="What this actually looks like"
        description="Session notes, client wins and the coaching opinions I will not shut up about. Updated weekly."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {posts.map((post, i) => (
          <Reveal key={post.id} delay={(i % 2) * 70} className="h-full">
            <PostCard post={post} className="h-full" />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
