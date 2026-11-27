"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleEventReports from "./ConsoleEventReports";
import { fetchEventReports } from "./console-api";

/**
 * Loads the visitor-report inbox on every visit. `GET /api/console/event-reports`
 * is admin-only and uncached, so a report sent moments ago is already here.
 */
export default function ConsoleEventReportsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchEventReports);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  return <ConsoleEventReports rows={data.reports} />;
}
