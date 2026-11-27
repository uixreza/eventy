import type { Metadata } from "next";
import OverviewView from "@/components/dashboard/OverviewView";

export const metadata: Metadata = {
  title: "داشبورد",
  description: "پنل کاربری Kooja؛ رویدادها و علاقه‌مندی‌های شما",
};

/**
 * A thin shell: `OverviewView` is a client route that fetches its rows
 * from the server on every load, so nothing here reads the session or the
 * data cache.
 */
export default function DashboardHomePage() {
  return <OverviewView />;
}
