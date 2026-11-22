import type { Metadata } from "next";
import NotificationsView from "@/components/dashboard/NotificationsView";

export const metadata: Metadata = {
  title: "اعلان‌ها",
  description: "اعلان‌ها، یادآوری‌ها و به‌روزرسانی‌های رویدادشو",
};

/**
 * A thin shell: `NotificationsView` asks the server for the feed on every
 * load of this route, and the feed is derived from the tables — broadcasts,
 * tickets, reminders, moderation results and saved events running out of
 * seats (`lib/notifications.ts`).
 */
export default function NotificationsPage() {
  return <NotificationsView />;
}
