import type { Metadata } from "next";
import EventsBrowserLoader from "@/components/events/EventsBrowserLoader";
import { getPublicCategories } from "@/lib/categories";

export const metadata: Metadata = {
  title: "کشف رویدادها",
  description:
    "فهرست کامل رویدادهای Kooja با فیلتر جستجو، دسته\u200cبندی، شهر، وضعیت و هزینه ثبت\u200cنام",
};

/**
 * The list is client-fetched: the page ships its shell and the rows come
 * from `GET /api/events` (see `EventsBrowserLoader`), so every visit sees
 * the current database state — including events published a moment ago.
 * Category chips are the visible `Category` rows from the same tagged cache
 * the console invalidates on every category change.
 */
export default async function EventsPage() {
  const categories = await getPublicCategories();
  return <EventsBrowserLoader categories={categories} />;
}
