import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/members/service";
import { ClientTabs } from "@/components/members/ClientTabs";
import { Chip } from "@/components/ui/Chip";
import { COACHING_LABELS } from "@/lib/members/types";
import { Avatar } from "@/components/members/Avatar";
import { relativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Shared chrome for every tab of one client. */
export default async function AdminClientLayout({
  children,
  params,
}: LayoutProps<"/admin/clients/[slug]">) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  return (
    <>
      <Link
        href="/admin"
        className="-my-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      {/* Whose plan this is, at the top of every tab — Dean can be four
          screens into a week and still be sure who he is editing.

          Compact on a phone: the full-size version was an avatar, a name, a
          wrapped goal and a status chip on four separate lines, and the week
          he opened the page for started below the fold because of it. */}
      <div className="mt-4 flex items-center gap-3 sm:mt-6 sm:gap-4">
        <Avatar
          name={profile.fullName}
          src={profile.avatarUrl}
          size="md"
          ring
          className="sm:hidden"
        />
        <Avatar
          name={profile.fullName}
          src={profile.avatarUrl}
          size="lg"
          ring
          className="hidden sm:grid"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 truncate text-xl sm:text-3xl">{profile.fullName}</h1>
            {/* How he coaches them, where he can see it from any tab — it is
                what decides whether there are sessions to book. */}
            <Chip tone={profile.coachingMode === "one_to_one" ? "accent" : "default"}>
              {COACHING_LABELS[profile.coachingMode]}
            </Chip>
            {profile.status !== "active" ? <Chip>{profile.status}</Chip> : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted sm:mt-1.5 sm:whitespace-normal">
            {profile.goal ?? "No goal set"} · with Dean since {relativeDate(profile.startedOn)}
          </p>
        </div>
      </div>

      <div className="mt-5 sm:mt-8" />

      <ClientTabs clientId={profile.id} />

      {children}
    </>
  );
}
