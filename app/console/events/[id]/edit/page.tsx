import { Suspense } from "react";
import type { Metadata } from "next";
import ConsoleEditLoader from "@/components/console/ConsoleEditLoader";
import PageLoader from "@/components/ui/PageLoader";
import { getCategoryIcons } from "@/lib/categories";
import { getPublicPricing } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "ویرایش رویداد",
  description: "اصلاح اطلاعات رویداد از کنسول مدیریت Kooja",
};

type ConsoleEditParams = { params: Promise<{ id: string }> };

/**
 * A thin shell: `ConsoleEditLoader` fetches the event from
 * `GET /api/console/events/[id]` on every load of this route and pre-fills
 * the shared event form — the same five-step wizard the dashboard uses,
 * saved through the same server action (an admin's save is final and keeps
 * the event's status; only approve/reject changes it).
 *
 * `params` belongs to this URL, so it is read inside a `<Suspense>`
 * boundary — the shell above it stays URL-free.
 */
export default function ConsoleEditPage({ params }: ConsoleEditParams) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ConsoleEditContent params={params} />
    </Suspense>
  );
}

async function ConsoleEditContent({ params }: ConsoleEditParams) {
  const { id } = await params;
  const [categoryIcons, pricing] = await Promise.all([
    getCategoryIcons(),
    getPublicPricing(),
  ]);
  return (
    <ConsoleEditLoader
      id={id}
      categoryIcons={categoryIcons}
      promotionPrice={pricing.promotionPrice}
    />
  );
}
