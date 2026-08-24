import Link from "next/link";
import { redirect } from "next/navigation";
import { getBoard, getCurrentProfile, hasBoardAccess } from "@/lib/members/service";
import { Board } from "@/components/members/Board";
import { NewPost } from "@/components/members/NewPost";
import { Panel, ScreenTitle } from "@/components/members/ui";

export const dynamic = "force-dynamic";

/**
 * The one place in the product where clients see each other.
 *
 * `hasBoardAccess` asks exactly what the policies on every table behind this
 * page ask, so somebody who has made an account but is not training yet is
 * told plainly rather than shown an empty wall the database would refuse to
 * fill.
 */
export default async function BoardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (!hasBoardAccess(profile)) {
    return (
      <>
        <ScreenTitle title="The board" />
        <Panel>
          <p className="text-sm leading-relaxed text-muted">
            The board is for people I&rsquo;m coaching. Apply for training and I&rsquo;ll get you on it.
          </p>
          <Link
            href="/join"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
          >
            Apply for training
          </Link>
        </Panel>
      </>
    );
  }

  const posts = await getBoard(profile.id);

  return (
    <>
      <ScreenTitle title="The board" subtitle="Everyone I coach, in one place." />

      <div className="space-y-5">
        <Panel>
          <NewPost
            authorId={profile.id}
            asCoach={false}
            placeholder="A win, a question, a photo of the bar."
          />
        </Panel>

        <Board posts={posts} viewerId={profile.id} isCoach={false} />
      </div>
    </>
  );
}
