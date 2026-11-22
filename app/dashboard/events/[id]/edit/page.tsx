import { Suspense } from "react";
import type { Metadata } from "next";
import EditEventLoader from "@/components/dashboard/EditEventLoader";
import PageLoader from "@/components/ui/PageLoader";
import { getCategoryIcons } from "@/lib/categories";

export const metadata: Metadata = {
  title: "ویرایش رویداد",
  description: "اطلاعات رویداد خود را تغییر دهید؛ پس از هر تغییر، رویداد دوباره تأیید می‌شود",
};

type EditEventParams = { params: Promise<{ id: string }> };

/**
 * A thin shell: `EditEventLoader` fetches the caller's own event from the
 * server on every load of this route and renders a not-found card when
 * there is no such event.
 *
 * `params` belongs to this URL, so it is read inside a `<Suspense>`
 * boundary — the shell above it stays URL-free and the navigation can be
 * instant.
 */
export default function EditEventPage({ params }: EditEventParams) {
  return (
    <Suspense fallback={<PageLoader />}>
      <EditEventContent params={params} />
    </Suspense>
  );
}

async function EditEventContent({ params }: EditEventParams) {
  const { id } = await params;
  const categoryIcons = await getCategoryIcons();
  return <EditEventLoader id={id} categoryIcons={categoryIcons} />;
}
