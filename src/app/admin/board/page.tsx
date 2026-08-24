import { redirect } from "next/navigation";
import { getBoard, getCurrentProfile } from "@/lib/members/service";
import { Board } from "@/components/members/Board";
import { NewPost } from "@/components/members/NewPost";
import { Panel, ScreenTitle } from "@/components/members/ui";

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/app");

  const posts = await getBoard(profile.id);

  return (
    <>
      <ScreenTitle title="The board" subtitle="What everyone you coach can see." />

      <div className="space-y-5">
        <Panel>
          <NewPost
            authorId={profile.id}
            asCoach
            placeholder="Something for the whole gym."
          />
        </Panel>

        <Board posts={posts} viewerId={profile.id} isCoach />
      </div>
    </>
  );
}
