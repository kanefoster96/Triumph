import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getDayProgress,
  getUnreadChat,
  getUnreadNotifications,
  hasBoardAccess,
  isDemoMode,
  today,
} from "@/lib/members/service";
import { touchPresence } from "@/lib/members/actions";
import { MemberTabBar, MemberTabsInline } from "@/components/members/MemberTabBar";
import { DemoBanner } from "@/components/members/DemoBanner";
import { Logo } from "@/components/layout/Logo";
import { Avatar } from "@/components/members/Avatar";
import { HeaderActions } from "@/components/members/HeaderActions";
import { displayName } from "@/lib/utils";

/** Per-client and private, so never cached. */
export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: LayoutProps<"/app">) {
  const [profile, demo] = await Promise.all([getCurrentProfile(), isDemoMode()]);
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  // They are here, which is the whole of what "active today" means. Not
  // awaited with the reads below: it is a write, and nothing on this page is
  // waiting to render it.
  void touchPresence();

  // Read once here so every tab bar on the page agrees about the day.
  const [progress, unreadChat, unreadNotifications] = await Promise.all([
    getDayProgress(profile.id, today()),
    getUnreadChat(profile),
    getUnreadNotifications(),
  ]);

  return (
    <>
      {demo ? <DemoBanner role={profile.role} /> : null}

      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 supports-[backdrop-filter]:bg-ink/60 supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo href="/app" />
          <MemberTabsInline progress={progress} />
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Messages, the board and the bell. Sign out lives on the profile
                screen behind the face — three things that change while you are
                looking elsewhere earn a place in the header, and a link you
                press once a month does not. */}
            <HeaderActions
              base="/app"
              chatHref="/app/chat"
              unreadChat={unreadChat}
              unreadNotifications={unreadNotifications}
              boardHref={hasBoardAccess(profile) ? "/app/board" : null}
            />
            {/* Their own face, ringed — small, but it is their app and it
                should look like it belongs to them, and it is the way to the
                one screen that is about them rather than about today. */}
            <Link href="/app/profile" aria-label="Your profile" className="shrink-0">
              <Avatar
                name={displayName(profile)}
                src={profile.avatarUrl}
                size="sm"
                ring
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-28 sm:px-8 md:pb-16">
        {children}
      </main>

      <MemberTabBar progress={progress} />
    </>
  );
}
