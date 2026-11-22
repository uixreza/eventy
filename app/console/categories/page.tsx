import type { Metadata } from "next";
import ConsoleCategoriesLoader from "@/components/console/ConsoleCategoriesLoader";

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها",
  description: "مدیریت دسته‌بندی‌های رویدادها در کنسول رویدادشو",
};

/** Shell only — the category rows are fetched by the client loader. */
export default function ConsoleCategoriesPage() {
  return <ConsoleCategoriesLoader />;
}
