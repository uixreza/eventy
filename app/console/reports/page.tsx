import type { Metadata } from "next";
import ConsoleReportsLoader from "@/components/console/ConsoleReportsLoader";

export const metadata: Metadata = {
  title: "گزارش‌ها",
  description: "تحلیل و گزارش‌های کنسول رویدادشو؛ رشد کاربران، رویدادها و درآمد",
};

/**
 * Shell only — the figures are fetched by the client loader, so every visit
 * sees the current database state.
 */
export default function ConsoleReportsPage() {
  return <ConsoleReportsLoader />;
}
