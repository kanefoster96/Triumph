import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/members/service";
import { ScreenTitle } from "@/components/members/ui";
import { ClientTabs } from "@/components/members/ClientTabs";
import { Chip } from "@/components/ui/Chip";
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

      <div className="mt-6">
        <ScreenTitle
          title={profile.fullName}
          subtitle={`${profile.goal ?? "No goal set"} · with Dean since ${relativeDate(profile.startedOn)}`}
          action={
            <Chip tone={profile.status === "active" ? "success" : "default"}>{profile.status}</Chip>
          }
        />
      </div>

      <ClientTabs clientId={profile.id} />

      {children}
    </>
  );
}
