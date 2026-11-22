import type { Metadata } from "next";
import EventsBrowserLoader from "@/components/events/EventsBrowserLoader";

export const metadata: Metadata = {
  title: "کشف رویدادها",
  description:
    "فهرست کامل رویدادهای رویدادشو با فیلتر جستجو، دسته‌بندی، شهر، وضعیت و هزینه ثبت‌نام",
};

/**
 * The list is client-fetched: the page ships its shell and the rows come
 * from `GET /api/events` (see `EventsBrowserLoader`), so every visit sees
 * the current database state — including events published a moment ago.
 */
export default function EventsPage() {
  return <EventsBrowserLoader />;
}
