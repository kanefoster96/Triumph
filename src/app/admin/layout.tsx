import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getUnreadChat,
  getUnreadNotifications,
  isDemoMode,
} from "@/lib/members/service";
import { DemoBanner } from "@/components/members/DemoBanner";
import { Logo } from "@/components/layout/Logo";
import { AdminNav } from "@/components/members/AdminNav";
import { HeaderActions } from "@/components/members/HeaderActions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [profile, demo] = await Promise.all([getCurrentProfile(), isDemoMode()]);
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/app");

  const [unreadChat, unreadNotifications] = await Promise.all([
    getUnreadChat(profile),
    getUnreadNotifications(),
  ]);

  return (
    <>
      {demo ? <DemoBanner role={profile.role} /> : null}

      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 supports-[backdrop-filter]:bg-ink/60 supports-[backdrop-filter]:backdrop-blur-xl">
        {/* Five sections, a logo and a sign-out will not sit on one line at
            phone width, so the nav drops to its own row rather than pushing
            the page sideways. */}
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:h-16 sm:flex-nowrap sm:py-0 sm:px-8">
          <div className="flex items-center gap-5">
            <Logo href="/admin" />
            <span className="hidden rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent sm:inline">
              Coach
            </span>
          </div>
          <div className="order-1 -my-2 flex items-center gap-1 sm:order-none">
            {/* The board is a section and sits in the nav; these two carry a
                number that changes while he is on another screen. */}
            <HeaderActions
              base="/admin"
              chatHref="/admin/chat"
              unreadChat={unreadChat}
              unreadNotifications={unreadNotifications}
              boardHref={null}
            />
            <Link
              href="/logout"
              className="inline-flex min-h-11 items-center px-2 text-sm text-muted transition-colors hover:text-text"
              prefetch={false}
            >
              Sign out
            </Link>
          </div>
          <div className="order-2 -mx-5 w-[calc(100%+2.5rem)] px-5 sm:order-none sm:mx-0 sm:w-auto sm:px-0">
            <AdminNav />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">{children}</main>
    </>
  );
}
