"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DataFetchError from "@/components/dashboard/DataFetchError";
import NewEventForm from "@/components/dashboard/NewEventForm";
import type { EventFormValues } from "@/components/dashboard/NewEventForm";
import { WizardSkeleton } from "@/components/dashboard/Skeletons";
import { useServerData } from "@/components/dashboard/useServerData";
import type { ConsoleEventDetail } from "@/lib/event-types";
import { fetchConsoleEvent } from "./console-api";

/** The form's starting values, lifted out of the full event row. */
function toInitial(event: ConsoleEventDetail): EventFormValues {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    description: event.description || event.summary,
    city: event.city,
    venue: event.venue,
    onlineUrl: event.onlineUrl ?? "",
    capacity: event.capacity,
    highlights: event.highlights,
    agenda: event.agenda,
    price: event.price,
    gradient: event.gradient,
    mode: event.mode,
    jy: event.jy,
    jm: event.jm,
    jd: event.jd,
    hour: event.hour,
    minute: event.minute,
  };
}

/**
 * Loads one event from `GET /api/console/events/[id]` on every visit to the
 * console edit route and pre-fills the shared event form with it. `null`
 * means the event no longer exists — a client-side not-found card, since
 * `notFound()` only runs on the server.
 */
export default function ConsoleEditLoader({
  id,
  categoryIcons,
}: {
  id: string;
  categoryIcons: Record<string, string>;
}) {
  const { data, loaded, failed, reload } = useServerData(() => fetchConsoleEvent(id));

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded) return <WizardSkeleton />;

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          این رویداد پیدا نشد یا حذف شده است.
        </p>
        <Link
          href="/console/events"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به مدیریت رویدادها
        </Link>
      </div>
    );
  }

  return (
    <NewEventForm
      initial={toInitial(data)}
      /* The preview card names the real host, not the admin editing it. */
      organizerName={data.organizerName || data.organizer?.name || ""}
      categoryIcons={categoryIcons}
      /* An admin ends up back in the console, not in their own dashboard. */
      returnTo={{ href: "/console/events", label: "بازگشت به مدیریت رویدادها" }}
    />
  );
}
