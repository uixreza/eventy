import Link from "next/link";
import { Bookmark, Clock, MapPin, User } from "lucide-react";
import { categoryIcon } from "@/lib/category-icons";
import { eventStatusMeta } from "@/lib/data";
import type { EventCard } from "@/lib/event-types";
import { faPrice, toFa } from "@/lib/utils";

type EventListCardProps = {
  event: EventCard;
  saved: boolean;
  onToggleSave: (event: EventCard) => void;
};

/**
 * List card used on /events:
 * - sm and up: horizontal — thumbnail on the right (first flex child, RTL),
 *   copy in the middle/left, status badge over the thumbnail, bookmark far left.
 * - below sm: stacked — the thumbnail becomes a full-width banner on top so
 *   it never gets squeezed by the narrow viewport.
 */
export default function EventListCard({ event, saved, onToggleSave }: EventListCardProps) {
  const status = eventStatusMeta[event.status];
  const CategoryIcon = categoryIcon(event.categoryIcon).icon;

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800 sm:flex-row sm:gap-4 sm:p-4">
      {/* Thumbnail: full-width banner on mobile, fixed-width column from sm up */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl sm:h-auto sm:w-40 sm:self-stretch lg:w-44">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${event.gradient} transition-transform duration-300 group-hover:scale-105`}
        />
        <div className="absolute inset-0 bg-black/15" />

        {/* The category's glyph, centered on the cover */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
            <CategoryIcon className="h-6 w-6" strokeWidth={1.75} />
          </span>
        </span>

        {/* Status over the image */}
        <span
          className={`absolute start-2 top-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold shadow-sm ${status.tint}`}
        >
          {event.status === "live" && (
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white" />
          )}
          <span className="truncate">{status.label}</span>
        </span>

        {/* Seats left over the image */}
        {event.status !== "ended" && event.seatsLeft !== null && (
          <span className="absolute bottom-2 end-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-red-600 backdrop-blur dark:bg-slate-900/95 dark:text-red-400">
            {toFa(event.seatsLeft)} صندلی مانده
          </span>
        )}
      </div>

      {/* Copy (middle / left) */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm font-bold leading-6 text-slate-800 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300 sm:text-base sm:leading-7">
            {/* Stretched link: clicking anywhere on the card opens the detail page. */}
            <Link
              href={`/events/${event.slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {event.title}
            </Link>
          </h3>

          {/* Bookmark — pinned to the card's left edge (inline-end in RTL);
              z-10 keeps it clickable above the stretched link. */}
          <button
            type="button"
            onClick={() => onToggleSave(event)}
            aria-pressed={saved}
            aria-label={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره رویداد"}
            title={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره رویداد"}
            className="relative z-10 ms-auto shrink-0 rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-current text-blue-600 dark:text-blue-400" : ""}`} />
          </button>
        </div>

        <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-[13px] sm:leading-6">
          {event.summary}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {event.category}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
            {event.date} - {event.time}
          </span>
          <span className="flex min-w-0 max-w-full items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
            <span className="truncate">
              {event.city} - {event.venue}
            </span>
          </span>
          <span className="flex min-w-0 max-w-full items-center gap-1">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="truncate">{event.organizer}</span>
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-300">
              {event.price === null ? (
                <span className="text-emerald-600 dark:text-emerald-400">ورود رایگان</span>
              ) : (
                <>شهریه: {faPrice(event.price)}</>
              )}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
              {event.status === "ended" ? "این رویداد برگزار شده است" : "ثبت‌نام باز است"}
            </p>
          </div>
          <Link
            href={`/events/${event.slug}`}
            className="relative z-10 shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
          >
            جزئیات رویداد
          </Link>
        </div>
      </div>
    </article>
  );
}
