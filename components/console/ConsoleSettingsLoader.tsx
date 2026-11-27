"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleSettings from "./ConsoleSettings";
import { fetchConsoleSettings } from "./console-api";
import { ConsoleSettingsSkeleton } from "./ConsoleSkeletons";

/**
 * Loads the live prices on every visit to `/console/settings`. The page ships
 * only its shell; `GET /api/console/settings` answers from the database, so a
 * promotion price saved a moment ago is already in the form. After a save the
 * editor calls `onChanged`, which reloads and remounts the form with the new
 * value.
 */
export default function ConsoleSettingsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchConsoleSettings);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleSettingsSkeleton />;

  return (
    <ConsoleSettings
      key={data.pricing.promotionPrice}
      pricing={data.pricing}
      onChanged={reload}
    />
  );
}
