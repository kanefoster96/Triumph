import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/members/service";
import { ScreenTitle } from "@/components/members/ui";
import { ClientTabs } from "@/components/members/ClientTabs";
import { Chip } from "@/components/ui/Chip";
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
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      {/* Whose plan this is, at the top of every tab — Dean can be four
          screens into a week and still be sure who he is editing. */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Avatar name={profile.fullName} src={profile.avatarUrl} size="lg" ring />
        <div className="min-w-0 flex-1">
          <ScreenTitle
            title={profile.fullName}
            subtitle={`${profile.goal ?? "No goal set"} · with Dean since ${relativeDate(profile.startedOn)}`}
            action={
              <Chip tone={profile.status === "active" ? "success" : "default"}>{profile.status}</Chip>
            }
          />
        </div>
      </div>

      <ClientTabs clientId={profile.id} />

      {children}
    </>
  );
}
