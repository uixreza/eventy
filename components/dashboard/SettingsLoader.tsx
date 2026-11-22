"use client";

import { fetchProfile } from "@/components/dashboard/dashboard-api";
import DataFetchError from "@/components/dashboard/DataFetchError";
import SettingsForm from "@/components/dashboard/SettingsForm";
import { SettingsSkeleton } from "@/components/dashboard/Skeletons";
import { useServerData } from "@/components/dashboard/useServerData";

/** Reads the settings row from the server on every load of the route. */
export default function SettingsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchProfile);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <SettingsSkeleton />;

  return <SettingsForm initial={data} />;
}
