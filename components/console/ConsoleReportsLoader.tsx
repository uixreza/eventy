"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleReports from "./ConsoleReports";
import { fetchConsoleReports } from "./console-api";
import { ConsoleReportsSkeleton } from "./ConsoleSkeletons";

/**
 * Loads the analytics page on every visit. The page ships only its shell;
 * the numbers come from `GET /api/console/reports`, which reads the tables
 * fresh — so a registration that just came in is already counted.
 */
export default function ConsoleReportsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchConsoleReports);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleReportsSkeleton />;

  return <ConsoleReports report={data.reports} />;
}
