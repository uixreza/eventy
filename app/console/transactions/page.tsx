import type { Metadata } from "next";
import ConsoleTransactions from "@/components/console/ConsoleTransactions";

export const metadata: Metadata = {
  title: "تراکنش‌ها",
  description: "تراکنش‌های مالی، تسویه برگزارکنندگان و بازگشت وجه در کنسول Kooja",
};

/** Static shell — transaction state is client-side mock data, no request reads. */
export default function ConsoleTransactionsPage() {
  return <ConsoleTransactions />;
}
