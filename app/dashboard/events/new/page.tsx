import type { Metadata } from "next";
import NewEventLoader from "@/components/dashboard/NewEventLoader";
import { getCategoryIcons } from "@/lib/categories";

export const metadata: Metadata = {
  title: "ثبت رویداد جدید",
  description: "رویداد تازه خود را در رویدادشو ثبت کنید؛ عنوان، زمان و مکان، ظرفیت، بلیت و کاور رویداد",
};

/**
 * A thin shell: `NewEventLoader` fetches the organizer's current name
 * from the server on every load of this route. The category icons are
 * cached data, read here so the preview cover can wear the selected
 * category's glyph without an extra client fetch.
 */
export default async function NewEventPage() {
  const categoryIcons = await getCategoryIcons();
  return <NewEventLoader categoryIcons={categoryIcons} />;
}
