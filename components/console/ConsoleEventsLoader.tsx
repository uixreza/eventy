"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleEvents from "./ConsoleEvents";
import { fetchConsoleEvents } from "./console-api";
import { ConsoleEventsSkeleton } from "./ConsoleSkeletons";
import { refreshConsoleNavCounts } from "./useConsoleNavCounts";

/**
 * Loads the moderation queue on every visit to `/console/events`. The page
 * ships only its shell; the rows come from `GET /api/console/events`, so a
 * newly created event is already in the table and every review result is
 * the current database state. After a mutation the view calls `onChanged`,
 * which runs the same fetch again.
 */
export default function ConsoleEventsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchConsoleEvents);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleEventsSkeleton />;

  return (
    <ConsoleEvents
      rows={data.events}
      onChanged={() => {
        reload();
        refreshConsoleNavCounts();
      }}
    />
  );
}
