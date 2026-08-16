import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isDemoMode } from "@/lib/members/service";
import { MemberTabBar, MemberTabsInline } from "@/components/members/MemberTabBar";
import { DemoBanner } from "@/components/members/DemoBanner";
import { Logo } from "@/components/layout/Logo";

/** Per-client and private, so never cached. */
export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: LayoutProps<"/app">) {
  const [profile, demo] = await Promise.all([getCurrentProfile(), isDemoMode()]);
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  return (
    <>
      {demo ? <DemoBanner role={profile.role} /> : null}

      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 supports-[backdrop-filter]:bg-ink/60 supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo href="/app" />
          <MemberTabsInline />
          <Link
            href="/logout"
            className="text-sm text-muted transition-colors hover:text-text"
            prefetch={false}
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-28 sm:px-8 md:pb-16">
        {children}
      </main>

      <MemberTabBar />
    </>
  );
}
