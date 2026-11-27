import type { Metadata } from "next";
import ConsoleEventReportsLoader from "@/components/console/ConsoleEventReportsLoader";

export const metadata: Metadata = {
  title: "گزارش رویدادها",
  description: "پیام‌های ارسالشده توسط بازدیدکنندگان درباره رویدادها",
};

/**
 * Shell only — the inbox is fetched by the client loader, so an admin who
 * opens the page sees the reports that exist right now.
 */
export default function ConsoleEventReportsPage() {
  return <ConsoleEventReportsLoader />;
}
