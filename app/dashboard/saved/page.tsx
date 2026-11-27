import type { Metadata } from "next";
import SavedView from "@/components/dashboard/SavedView";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها",
  description: "رویدادهای ذخیره‌شده برای بعد در Kooja",
};

/**
 * A thin shell: `SavedView` fetches the bookmark rows from the server on
 * every load of this route.
 */
export default function SavedPage() {
  return <SavedView />;
}
