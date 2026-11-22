"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleCategories from "./ConsoleCategories";
import { fetchConsoleCategories } from "./console-api";
import { ConsoleCategoriesSkeleton } from "./ConsoleSkeletons";

/**
 * Loads every category on every visit to `/console/categories`. The page
 * ships only its shell; the rows come from `GET /api/console/categories`,
 * so a category created a minute ago is already in the list, a delete is
 * gone, and the event counts are the current database numbers. After a
 * mutation the view calls `onChanged`, which runs the same fetch again.
 */
export default function ConsoleCategoriesLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchConsoleCategories);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleCategoriesSkeleton />;

  return <ConsoleCategories rows={data.categories} onChanged={reload} />;
}
