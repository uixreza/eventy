import Link from "next/link";
import { Clock, MapPin, User } from "lucide-react";
import { categoryIcon } from "@/lib/category-icons";
import { faPrice, toFa } from "@/lib/utils";
import type { EventCard as EventCardData } from "@/lib/event-types";

const modeLabel = { INPERSON: "حضوری", ONLINE: "آنلاین" } as const;

export default function EventCard({ event }: { event: EventCardData }) {
  const CategoryIcon = categoryIcon(event.categoryIcon).icon;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900">
      {/* Badge row */}
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {event.category}
        </span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {modeLabel[event.mode]}
        </span>
      </div>

      {/* Photo banner */}
      <div className="relative mx-4 mt-3 aspect-video overflow-hidden rounded-xl">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${event.gradient} transition-transform duration-300 group-hover:scale-105`}
        />
        <div className="absolute inset-0 bg-black/10" />

        {/* The category's glyph, centered on the cover */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
            <CategoryIcon className="h-6 w-6" strokeWidth={1.75} />
          </span>
        </span>

        <span className="absolute bottom-2 end-2 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 backdrop-blur dark:bg-slate-900/95 dark:text-slate-300">
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
        <h3 className="line-clamp-2 text-base font-bold leading-7 text-slate-800 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {event.title}
        </h3>

        {/* Organizer */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
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
      <div className="mt-auto space-y-3 border-t border-slate-100 px-4 py-3.5 dark:border-slate-800">
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          {event.price === null ? (
            <span className="text-emerald-600 dark:text-emerald-400">ورود رایگان</span>
          ) : (
            <>شهریه ثبت‌نام: {faPrice(event.price)}</>
          )}
        </p>
        <Link
          href={`/events/${event.slug}`}
          className="block w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          {event.price === null ? "رزرو سریع صندلی" : "ثبت‌نام مستقیم"}
        </Link>
      </div>
    </article>
  );
}
