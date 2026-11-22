"use client";

import { fetchMyEvents } from "@/components/dashboard/dashboard-api";
import DataFetchError from "@/components/dashboard/DataFetchError";
import MyEventsView from "@/components/dashboard/MyEventsView";
import { MyEventsSkeleton } from "@/components/dashboard/Skeletons";
import { useServerData } from "@/components/dashboard/useServerData";

/**
 * Fetches the user's hosted and enrolled events on every load of
 * `/dashboard/events`, then hands them to the view. After a mutation the
 * view calls `onChanged`, which runs the same fetch again.
 */
export default function MyEventsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchMyEvents);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <MyEventsSkeleton />;

  return (
    <MyEventsView hosted={data.hosted} enrolled={data.enrolled} onChanged={reload} />
  );
}
