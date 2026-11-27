"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchEventForEdit } from "@/components/dashboard/dashboard-api";
import DataFetchError from "@/components/dashboard/DataFetchError";
import NewEventForm from "@/components/dashboard/NewEventForm";
import { WizardSkeleton } from "@/components/dashboard/Skeletons";
import { useServerData } from "@/components/dashboard/useServerData";

/**
 * Loads the caller's own event for the edit form on every route load.
 * `null` means the event does not exist (or belongs to someone else) —
 * that is a client-side not-found card, since `notFound()` only runs on
 * the server.
 */
export default function EditEventLoader({
  id,
  categoryIcons,
  promotionPrice,
}: {
  id: string;
  categoryIcons: Record<string, string>;
  promotionPrice: number;
}) {
  const { data, loaded, failed, reload } = useServerData(() => fetchEventForEdit(id));

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded) return <WizardSkeleton />;

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          رویداد پیدا نشد.
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          ممکن است حذف شده باشد یا متعلق به شما نباشد.
        </p>
        <Link
          href="/dashboard/events"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          بازگشت به رویدادهای من
        </Link>
      </div>
    );
  }

  return (
    <NewEventForm
      initial={data.initial}
      organizerName={data.organizerName}
      categoryIcons={categoryIcons}
      promotionPrice={promotionPrice}
    />
  );
}
