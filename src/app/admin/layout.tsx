import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isDemoMode } from "@/lib/members/service";
import { DemoBanner } from "@/components/members/DemoBanner";
import { Logo } from "@/components/layout/Logo";
import { AdminNav } from "@/components/members/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [profile, demo] = await Promise.all([getCurrentProfile(), isDemoMode()]);
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/app");

  return (
    <>
      {demo ? <DemoBanner role={profile.role} /> : null}

      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 supports-[backdrop-filter]:bg-ink/60 supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-5">
            <Logo href="/admin" />
            <span className="hidden rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent sm:inline">
              Coach
            </span>
          </div>
          <AdminNav />
          <Link
            href="/logout"
            className="text-sm text-muted transition-colors hover:text-text"
            prefetch={false}
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">{children}</main>
    </>
  );
}
