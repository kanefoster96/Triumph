import { redirect } from "next/navigation";
import {
  getClients,
  getCurrentProfile,
  getNotifications,
  getNotificationsReadAt,
} from "@/lib/members/service";
import { markNotificationsRead, sendNotification } from "@/lib/members/actions";
import { NotificationList } from "@/components/members/NotificationList";
import { Panel, ScreenTitle, field, fieldLabel, submitButton } from "@/components/members/ui";
import { COACHING_LABELS } from "@/lib/members/types";

export const dynamic = "force-dynamic";

/**
 * Dean telling people something.
 *
 * "Everyone" is one row with no recipient rather than one per person — an
 * announcement is one thing that happened. Anything narrower fans out, so a
 * client only ever reads rows the database would hand them anyway.
 */
export default async function AdminNotificationsPage({
  searchParams,
}: PageProps<"/admin/notifications">) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/app");

  const [clients, notifications, readAt, query] = await Promise.all([
    getClients(),
    getNotifications(),
    getNotificationsReadAt(),
    searchParams,
  ]);

  return (
    <>
      <ScreenTitle title="Announcements" subtitle="Goes to their app, not their inbox." />

      <div className="space-y-5">
        <Panel title="Send one">
          <form action={sendNotification} className="space-y-5">
            <div>
              <label className={fieldLabel} htmlFor="note-audience">
                Who it goes to
              </label>
              <select id="note-audience" name="audience" className={field} defaultValue="everyone">
                <option value="everyone">Everyone</option>
                <option value="online">{COACHING_LABELS.online} clients</option>
                <option value="one_to_one">{COACHING_LABELS.one_to_one} clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={`client:${client.id}`}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={fieldLabel} htmlFor="note-title">
                Headline
              </label>
              <input
                id="note-title"
                name="title"
                className={field}
                placeholder="The gym's shut Monday morning"
                required
                maxLength={120}
              />
            </div>

            <div>
              <label className={fieldLabel} htmlFor="note-body">
                What they need to know
              </label>
              <textarea
                id="note-body"
                name="body"
                rows={3}
                className={field}
                placeholder="Refurb on the free weights area — open again from 2pm."
                maxLength={1000}
              />
            </div>

            <div>
              <label className={fieldLabel} htmlFor="note-href">
                Where it takes them
              </label>
              <input
                id="note-href"
                name="href"
                className={field}
                placeholder="/app/sessions"
                pattern="/.*"
                maxLength={200}
              />
              <p className="mt-2 text-xs text-faint">
                Optional, and somewhere in the app — starts with a slash.
              </p>
            </div>

            <button type="submit" className={submitButton}>
              Send it
            </button>

            {query.sent === "1" ? (
              <p className="text-sm text-success">Sent.</p>
            ) : null}
          </form>
        </Panel>

        <Panel title="Already sent">
          <NotificationList
            notifications={notifications}
            readAt={readAt}
            markRead={markNotificationsRead}
          />
        </Panel>
      </div>
    </>
  );
}
