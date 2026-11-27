import Link from "next/link";
import { Clock, Crown, MapPin, User } from "lucide-react";
import EventListCover from "@/components/events/EventListCover";
import { categoryIcon } from "@/lib/category-icons";
import { faPrice, toFa } from "@/lib/utils";
import type { EventCard as EventCardData } from "@/lib/event-types";

const modeLabel = { INPERSON: "حضوری", ONLINE: "آنلاین" } as const;

export default function EventCard({ event }: { event: EventCardData }) {
  const CategoryIcon = categoryIcon(event.categoryIcon).icon;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
        event.promoted
          ? "border-amber-400/80 bg-gradient-to-br from-amber-50 via-white to-amber-100/70 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_12px_32px_-14px_rgba(180,83,9,0.45)] ring-1 ring-amber-300/70 hover:border-amber-500 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/40 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_12px_32px_-14px_rgba(251,191,36,0.25)] dark:ring-amber-800/70"
          : "border-slate-100 bg-white shadow-sm hover:border-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
      }`}
    >
      {/* Badge row */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
        {event.promoted && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-amber-950 shadow-sm ring-1 ring-amber-500/40">
            <Crown className="h-3 w-3 fill-current" />
            رویداد ویژه
          </span>
        )}
        <span
          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
            event.promoted
              ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-700/60"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          }`}
        >
          {event.category}
        </span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {modeLabel[event.mode]}
        </span>
      </div>

      {/* Photo banner — real event photos when present, category gradient otherwise */}
      <div
        className={`relative mx-4 mt-3 aspect-video overflow-hidden rounded-xl ${
          event.promoted ? "ring-2 ring-amber-300/80 dark:ring-amber-700/70" : ""
        }`}
      >
        <EventListCover
          images={event.images}
          title={event.title}
          gradient={event.gradient}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* The glyph is only needed when there is no photograph to show. */}
        {event.images.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
              <CategoryIcon className="h-6 w-6" strokeWidth={1.75} />
            </span>
          </span>
        )}

        <span className="absolute bottom-2 end-2 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 backdrop-blur dark:bg-slate-900/95 dark:text-slate-300">
          <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="max-w-[140px] truncate">
            {event.mode === "ONLINE" ? event.city : event.venue}
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Date */}
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
          {event.dateTime}
        </p>

        {/* Title */}
        <h3
          className={`line-clamp-2 text-base font-bold leading-7 transition-colors duration-200 ${
            event.promoted
              ? "text-amber-900 group-hover:text-amber-700 dark:text-amber-100 dark:group-hover:text-amber-300"
              : "text-slate-800 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300"
          }`}
        >
          {event.title}
        </h3>

        {/* Organizer */}
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
              event.promoted
                ? "bg-gradient-to-br from-amber-500 to-yellow-600 text-amber-950"
                : "bg-gradient-to-br from-blue-500 to-indigo-600"
            }`}
          >
            {event.organizer.replace(/^(مهندس|دکتر)\s*/, "").charAt(0)}
          </span>
          <p className="min-w-0 text-xs">
            <span className="block truncate font-bold text-slate-700 dark:text-slate-300">
              {event.organizer}
            </span>
            <span className="block truncate text-slate-400 dark:text-slate-500">
              برگزارکننده
            </span>
          </p>
        </div>

        {/* Urgency */}
        {event.seatsLeft !== null && (
          <span className="w-fit rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-500 dark:bg-red-950 dark:text-red-400">
            {toFa(event.seatsLeft)} صندلی مانده
          </span>
        )}
      </div>

      {/* Pricing + CTA — the card opens the event's own page, where the
          sign-up button lives. */}
      <div
        className={`mt-auto space-y-3 border-t px-4 py-3.5 ${
          event.promoted
            ? "border-amber-200/80 dark:border-amber-800/60"
            : "border-slate-100 dark:border-slate-800"
        }`}
      >
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          {event.price === null ? (
            <span className="text-emerald-600 dark:text-emerald-400">ورود رایگان</span>
          ) : (
            <>شهریه ثبت نام: {faPrice(event.price)}</>
          )}
        </p>
        <Link
          href={`/events/${event.slug}`}
          className={`block w-full rounded-xl py-2.5 text-center text-sm font-bold shadow-sm transition-all duration-200 active:scale-[0.98] ${
            event.promoted
              ? "bg-gradient-to-l from-amber-400 to-yellow-300 text-amber-950 hover:from-amber-300 hover:to-yellow-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {event.price === null ? "رزرو سریع صندلی" : "ثبت نام مستقیم"}
        </Link>
      </div>
    </article>
  );
}
