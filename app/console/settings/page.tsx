import type { Metadata } from "next";
import ConsoleSettingsLoader from "@/components/console/ConsoleSettingsLoader";

export const metadata: Metadata = {
  title: "تنظیمات کنسول",
  description: "تنظیمات سراسری کنسول مدیریت Kooja؛ قیمت‌ها، ثبت‌نام، رویدادها، اعلان‌ها و امنیت",
};

/**
 * The shell is static; the prices come from `GET /api/console/settings` on
 * every client load, so the admin always edits the row the database holds.
 * The remaining switches stay display-mode mock data for now.
 */
export default function ConsoleSettingsPage() {
  return <ConsoleSettingsLoader />;
}
