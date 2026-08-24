import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getNotifications,
  getNotificationsReadAt,
} from "@/lib/members/service";
import { markNotificationsRead } from "@/lib/members/actions";
import { NotificationList } from "@/components/members/NotificationList";
import { Panel, ScreenTitle } from "@/components/members/ui";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [notifications, readAt] = await Promise.all([
    getNotifications(),
    getNotificationsReadAt(),
  ]);

  return (
    <>
      <ScreenTitle title="From me" subtitle="Anything I've sent you." />
      <Panel>
        <NotificationList
          notifications={notifications}
          readAt={readAt}
          markRead={markNotificationsRead}
        />
      </Panel>
    </>
  );
}
