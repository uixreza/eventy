import type { Metadata } from "next";
import ConsoleOverviewLoader from "@/components/console/ConsoleOverviewLoader";

export const metadata: Metadata = {
  title: "کنسول مدیریت",
  description: "کنسول مدیریت و کنترل پروژه رویدادشو",
};

/**
 * Shell only — the stats, moderation queue, alerts and the broadcast list
 * are fetched by the client loader, so every visit sees the current
 * database state.
 */
export default function ConsoleHomePage() {
  return <ConsoleOverviewLoader />;
}
