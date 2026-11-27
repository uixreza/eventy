"use client";

import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import ConsoleAds from "./ConsoleAds";
import { fetchConsoleAds } from "./console-api";
import { ConsoleAdsSkeleton } from "./ConsoleSkeletons";

/**
 * Loads the ad line on every visit to `/console/ads`. The page ships only its
 * shell; the text and link come from `GET /api/console/ads`, so what was saved
 * a moment ago is already in the form. After a save the editor calls
 * `onChanged`, which runs the same fetch again; the key remounts the form with
 * the stored values.
 */
export default function ConsoleAdsLoader() {
  const { data, loaded, failed, reload } = useServerData(fetchConsoleAds);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <ConsoleAdsSkeleton />;

  const { announcement } = data;
  return (
    <ConsoleAds
      key={`${announcement.text}|${announcement.link}|${announcement.bannerKey ?? ""}|${announcement.bannerLink}`}
      announcement={announcement}
      onChanged={reload}
    />
  );
}
