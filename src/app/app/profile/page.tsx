import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, LogOut } from "lucide-react";
import { getCurrentProfile } from "@/lib/members/service";
import { displayName } from "@/lib/utils";
import { saveMyProfile } from "@/lib/members/actions";
import { Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { AvatarUpload } from "@/components/members/AvatarUpload";

export const dynamic = "force-dynamic";

/**
 * Their name and their face — the two things the signup deliberately did not
 * ask for. Both optional, both theirs alone to change.
 */
export default async function MyProfilePage({ searchParams }: PageProps<"/app/profile">) {
  const [profile, query] = await Promise.all([getCurrentProfile(), searchParams]);
  if (!profile) redirect("/login");

  return (
    <>
      <Link
        href="/app"
        className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <ScreenTitle title="Your profile" subtitle="Both of these are optional." />

      <div className="space-y-5">
        <Panel>
          <form action={saveMyProfile} className="space-y-5">
            <AvatarUpload
              name={displayName(profile)}
              ownerId={profile.id}
              initial={profile.avatarUrl}
              hint="Optional. It shows on your day and on anything you send me."
            />

            <div>
              <label className={fieldLabel} htmlFor="me-name">
                Your name
              </label>
              <input
                id="me-name"
                className={field}
                name="fullName"
                defaultValue={profile.fullName}
                placeholder="Alex Morgan"
                autoComplete="name"
              />
            </div>

            <button type="submit" className={submitButton}>
              Save my profile
            </button>

            {query.saved === "1" ? (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                <Check className="h-4 w-4" />
                Saved.
              </p>
            ) : null}
          </form>
        </Panel>

        <Panel title="Account">
          <dl className="divide-y divide-line">
            <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
              <dt className="text-sm text-faint">Email</dt>
              <dd className="min-w-0 truncate text-sm font-semibold">{profile.email ?? "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-sm text-faint">Coaching</dt>
              <dd className="text-sm font-semibold">
                {profile.status === "active" || profile.status === "paused"
                  ? "Training with Dean"
                  : profile.status === "applicant"
                    ? "Applied — waiting on Dean"
                    : "Not training with Dean yet"}
              </dd>
            </div>
          </dl>

          {profile.status === "basic" ? (
            <Link
              href="/join"
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
            >
              Apply for training
            </Link>
          ) : null}

          <Link
            href="/logout"
            prefetch={false}
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Link>
        </Panel>
      </div>
    </>
  );
}
