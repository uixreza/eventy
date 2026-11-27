"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useLiveRefresh } from "@/components/dashboard/useLiveRefresh";
import { useServerData } from "@/components/dashboard/useServerData";
import { fetchMyTickets } from "./dashboard-api";
import DashboardTickets from "./DashboardTickets";
import { TicketsSkeleton } from "./Skeletons";

/**
 * Reads this account's tickets on every visit. The API route is signed-in
 * only and uncached, so creating or answering a ticket is visible immediately
 * after `reload()` — no mock rows and no stale cached list.
 */
export default function DashboardTicketsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchMyTickets);
  useLiveRefresh(["dashboard:tickets"], reload, { playSound: true });

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <TicketsSkeleton />;

  return <DashboardTickets rows={data.tickets} onChanged={reload} />;
}
