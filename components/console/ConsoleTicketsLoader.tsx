"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleTickets from "./ConsoleTickets";
import { fetchAdminTickets } from "./console-api";
import { ConsoleTicketsSkeleton } from "./ConsoleSkeletons";
import { refreshConsoleNavCounts } from "./useConsoleNavCounts";

/**
 * The admin inbox reads from `GET /api/console/tickets` on every visit. That
 * route rechecks the ADMIN role and has no cache, so the console always
 * reflects the newest client tickets and answers.
 */
export default function ConsoleTicketsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchAdminTickets);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleTicketsSkeleton />;

  return (
    <ConsoleTickets
      rows={data.tickets}
      onChanged={() => {
        reload();
        refreshConsoleNavCounts();
      }}
    />
  );
}
