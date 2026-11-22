import type { Metadata } from "next";
import ConsoleSettings from "@/components/console/ConsoleSettings";

export const metadata: Metadata = {
  title: "تنظیمات کنسول",
  description: "تنظیمات سراسری کنسول مدیریت رویدادشو؛ ثبت‌نام، رویدادها، اعلان‌ها و امنیت",
};

/**
 * Console settings are display-mode mock data for now (like the rest of
 * `/console`), so the page stays a static shell — nothing here reads the
 * request and validation passes without a boundary.
 */
export default function ConsoleSettingsPage() {
  return <ConsoleSettings />;
}
