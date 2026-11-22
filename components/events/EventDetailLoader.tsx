"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import EnrollButton from "./EnrollButton";
import EventDetail from "./EventDetail";
import { fetchEventBySlug } from "./events-api";
import { EventDetailSkeleton } from "./EventsSkeletons";

/**
 * Loads one event by its slug on every visit to `/events/[slug]` — booking
 * card included, since `GET /api/events/[slug]` reads the session too and
 * arrives with the visitor's own ticket.
 *
 * A slug the API answers with `null` becomes a client-side not-found card,
 * the same way the edit form does it: `notFound()` only runs on the server,
 * and this page's rows are fetched by the browser.
 */
export default function EventDetailLoader({ slug }: { slug: string }) {
  const { data, loaded, failed, reload } = useServerData(() => fetchEventBySlug(slug));

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded) return <EventDetailSkeleton />;

  if (!data) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          رویداد پیدا نشد.
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          ممکن است برگزار نشده باشد یا از دسترس خارج شده باشد.
        </p>
        <Link
          href="/events"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          بازگشت به فهرست رویدادها
        </Link>
      </div>
    );
  }

  const { event, details, similar, enrollment } = data;

  return (
    <EventDetail
      event={event}
      details={details}
      similar={similar}
      action={
        <EnrollButton
          eventId={event.id}
          seatsLeft={event.seatsLeft}
          ended={event.status === "ended"}
          price={event.price}
          registration={enrollment.registration}
          signedIn={enrollment.signedIn}
          onChanged={reload}
        />
      }
    />
  );
}
