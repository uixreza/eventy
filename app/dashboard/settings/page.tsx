import type { Metadata } from "next";
import SettingsLoader from "@/components/dashboard/SettingsLoader";

export const metadata: Metadata = {
  title: "تنظیمات",
  description: "تنظیمات حساب کاربری Kooja؛ نام، تاریخ تولد شمسی و کد ملی",
};

/**
 * A thin shell: `SettingsLoader` reads the profile row from the server on
 * every load of this route.
 */
export default function SettingsPage() {
  return <SettingsLoader />;
}
