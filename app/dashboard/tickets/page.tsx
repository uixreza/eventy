import type { Metadata } from "next";
import DashboardTicketsLoader from "@/components/dashboard/DashboardTicketsLoader";

export const metadata: Metadata = {
  title: "تیکت",
  description: "ایجاد و پیگیری تیکت\u200cهای پشتیبانی حساب کاربری",
};

/**
 * Thin shell: the ticket list is loaded from the database on every visit,
 * so a newly created ticket or a manager's answer is visible right away.
 */
export default function DashboardTicketsPage() {
  return <DashboardTicketsLoader />;
}
