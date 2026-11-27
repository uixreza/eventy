import type { Metadata } from "next";
import NotFoundView from "@/components/layout/NotFoundView";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد (۴۰۴)",
  description: "صفحه‌ای که به دنبال آن بودید در Kooja وجود ندارد.",
};

export default function NotFound() {
  return <NotFoundView />;
}
