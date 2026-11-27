"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import type { PublicCategory } from "@/lib/categories";
import EventsBrowser from "./EventsBrowser";
import { fetchPublishedEvents } from "./events-api";
import { EventsListSkeleton } from "./EventsSkeletons";

/**
 * Loads every published event on each visit to `/events` and hands the
 * list to the browser. The page ships only its shell; the rows come from
 * `GET /api/events`, so every load sees the current database state. The
 * category chips come from the server-rendered `Category` rows instead.
 */
export default function EventsBrowserLoader({
  categories,
}: {
  categories: PublicCategory[];
}) {
  const { data, loaded, failed, reload } = useServerData(fetchPublishedEvents);

  if (failed) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <DataFetchError onRetry={reload} />
      </div>
    );
  }
  if (!loaded || !data) return <EventsListSkeleton />;

  return <EventsBrowser events={data.events} categories={categories} />;
}
