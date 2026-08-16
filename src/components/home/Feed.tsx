import { Radio } from "lucide-react";
import { getPosts } from "@/lib/services/content";
import { Container, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PostCard } from "@/components/cards/PostCard";
import { Chip } from "@/components/ui/Chip";

/**
 * The coach feed. On the site it shows what training here is like day to day;
 * in the app this same list becomes the home timeline.
 */
export async function Feed() {
  const posts = await getPosts(4);

  return (
    <section id="feed" className="py-16 sm:py-24">
      <Container>
        <SectionHeader
          eyebrow="From the studio"
          title="What this actually looks like"
          description="Session notes, client wins and the coaching opinions I will not shut up about."
          action={
            <Chip tone="accent" size="md">
              <Radio className="h-3.5 w-3.5" />
              Updated weekly
            </Chip>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 70} className="h-full">
              <PostCard post={post} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
