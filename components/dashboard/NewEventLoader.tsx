"use client";

import { fetchOrganizerName } from "@/components/dashboard/dashboard-api";
import DataFetchError from "@/components/dashboard/DataFetchError";
import NewEventForm from "@/components/dashboard/NewEventForm";
import { WizardSkeleton } from "@/components/dashboard/Skeletons";
import { useServerData } from "@/components/dashboard/useServerData";

/**
 * The organizer name for the wizard's preview. `useSession()` would hand
 * back the name the JWT was minted with — this asks the server, whose
 * session reads the profile row, so the preview shows the current name.
 */
export default function NewEventLoader({
  categoryIcons,
  promotionPrice,
}: {
  categoryIcons: Record<string, string>;
  promotionPrice: number;
}) {
  const { data, loaded, failed, reload } = useServerData(fetchOrganizerName);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <WizardSkeleton />;

  return (
    <NewEventForm
      organizerName={data.name}
      categoryIcons={categoryIcons}
      promotionPrice={promotionPrice}
    />
  );
}
