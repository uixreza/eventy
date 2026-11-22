"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleUsers from "./ConsoleUsers";
import { fetchConsoleUsers } from "./console-api";
import { ConsoleUsersSkeleton } from "./ConsoleSkeletons";

/**
 * Loads every account on every visit to `/console/users`. The page ships
 * only its shell; the rows come from `GET /api/console/users`, so a signup
 * from a minute ago is already in the table and a role or ban result is
 * the current database state. After a mutation the view calls `onChanged`,
 * which runs the same fetch again.
 */
export default function ConsoleUsersLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchConsoleUsers);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleUsersSkeleton />;

  return <ConsoleUsers rows={data.users} me={data.me} onChanged={reload} />;
}
