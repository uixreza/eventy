import type { Metadata } from "next";
import ConsoleEventsLoader from "@/components/console/ConsoleEventsLoader";

export const metadata: Metadata = {
  title: "مدیریت رویدادها",
  description: "بررسی، تأیید و مدیریت رویدادهای ثبت‌شده در کنسول Kooja",
};

/**
 * The moderation queue is client-fetched: the page ships its shell and the
 * rows come from `GET /api/console/events` (see `ConsoleEventsLoader`), so
 * every visit sees the current database state — including events created a
 * moment ago — and every review result lands without a full reload.
 */
export default function ConsoleEventsPage() {
  return <ConsoleEventsLoader />;
}
