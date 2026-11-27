import type { Metadata } from "next";
import NewEventLoader from "@/components/dashboard/NewEventLoader";
import { getCategoryIcons } from "@/lib/categories";
import { getPublicPricing } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "ثبت رویداد جدید",
  description: "رویداد تازه خود را در Kooja ثبت کنید؛ عنوان، زمان و مکان، ظرفیت، بلیت و کاور رویداد",
};

/**
 * A thin shell: `NewEventLoader` fetches the organizer's current name
 * from the server on every load of this route. The category icons are
 * cached data, read here so the preview cover can wear the selected
 * category's glyph without an extra client fetch.
 */
export default async function NewEventPage() {
  /* The promotion section shows the admin's live price, not a hard-coded one. */
  const [categoryIcons, pricing] = await Promise.all([
    getCategoryIcons(),
    getPublicPricing(),
  ]);
  return (
    <NewEventLoader
      categoryIcons={categoryIcons}
      promotionPrice={pricing.promotionPrice}
    />
  );
}
