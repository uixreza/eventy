import type { Metadata } from "next";
import ConsoleTicketsLoader from "@/components/console/ConsoleTicketsLoader";

export const metadata: Metadata = {
  title: "تیکت",
  description: "صندوق تیکت\u200cهای پشتیبانی کاربران برای مدیران",
};

/**
 * Shell only — the admin inbox is fetched client-side from an uncached,
 * role-checked route handler, so every open reflects the live database.
 */
export default function ConsoleTicketsPage() {
  return <ConsoleTicketsLoader />;
}
