"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleOverview from "./ConsoleOverview";
import { fetchConsoleOverview } from "./console-api";
import { ConsoleOverviewSkeleton } from "./ConsoleSkeletons";

/**
 * Loads the console home on every visit. The page ships only its shell; the
 * numbers come from `GET /api/console/overview`, which reads the tables
 * fresh — so a review approved a minute ago is already out of the queue and
 * a broadcast just sent is already listed. After a mutation the view calls
 * `onChanged`, which runs the same fetch again.
 */
export default function ConsoleOverviewLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchConsoleOverview);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleOverviewSkeleton />;

  return <ConsoleOverview overview={data.overview} onChanged={reload} />;
}
