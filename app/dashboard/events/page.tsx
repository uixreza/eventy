import type { Metadata } from "next";
import MyEventsLoader from "@/components/dashboard/MyEventsLoader";

export const metadata: Metadata = {
  title: "رویدادهای من",
  description: "رویدادهایی که ساخته‌اید و ثبت‌نام‌های شما در Kooja",
};

/**
 * A thin shell: `MyEventsLoader` fetches both lists from the server on
 * every load of this route.
 */
export default function MyEventsPage() {
  return <MyEventsLoader />;
}
