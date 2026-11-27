import Link from "next/link";
import { Bookmark, Clock, Crown, MapPin, User, Video } from "lucide-react";
import { categoryIcon } from "@/lib/category-icons";
import { eventStatusMeta } from "@/lib/data";
import type { EventCard } from "@/lib/event-types";
import { faPrice, toFa } from "@/lib/utils";
import EventListCover from "./EventListCover";
import ShareEventButton from "./ShareEventButton";

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
  const isOnline = event.city === "آنلاین";

  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-2xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:gap-4 sm:p-4 ${
        event.promoted
          ? "border-amber-400/80 bg-gradient-to-br from-amber-50 via-white to-amber-100/70 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_12px_32px_-14px_rgba(180,83,9,0.45)] ring-1 ring-amber-300/70 hover:border-amber-500 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/40 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_12px_32px_-14px_rgba(251,191,36,0.25)] dark:ring-amber-800/70"
          : `bg-white dark:bg-slate-900 ${
              isOnline
                ? "border-violet-300 ring-1 ring-violet-200 hover:border-violet-400 dark:border-violet-800 dark:ring-violet-900 dark:hover:border-violet-700"
                : "border-slate-200 hover:border-blue-200 dark:border-slate-700 dark:hover:border-blue-800"
            }`
      }`}
    >
      {/* Thumbnail: full-width banner on mobile, fixed-width column from sm up */}
      <div
        className={`relative h-36 w-full shrink-0 overflow-hidden rounded-xl sm:h-auto sm:w-40 sm:self-stretch lg:w-44 ${
          event.promoted ? "ring-2 ring-amber-300/80 dark:ring-amber-700/70" : ""
        }`}
      >
        <EventListCover
          images={event.images}
          title={event.title}
          gradient={event.gradient}
        />

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

        {/* Promoted events get a crown and a gold ribbon, unlike every other card. */}
        {event.promoted && (
          <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-amber-300 via-yellow-200 to-amber-400 px-2 py-1 text-[10px] font-extrabold text-amber-950 shadow-md ring-1 ring-amber-500/40">
            <Crown className="h-3 w-3 fill-current" />
            رویداد ویژه
          </span>
        )}

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
          <h3
            className={`line-clamp-2 flex-1 text-sm font-bold leading-6 transition-colors duration-200 sm:text-base sm:leading-7 ${
              event.promoted
                ? "text-amber-900 group-hover:text-amber-700 dark:text-amber-100 dark:group-hover:text-amber-300"
                : "text-slate-800 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300"
            }`}
          >
            {/* Stretched link: clicking anywhere on the card opens the detail page. */}
            <Link
              href={`/events/${event.slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {event.title}
            </Link>
          </h3>

          {/* Save and share — pinned to the card's left edge (inline-end in RTL);
              z-10 keeps them clickable above the stretched link. */}
          <div className="relative z-10 ms-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleSave(event)}
              aria-pressed={saved}
              aria-label={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره رویداد"}
              title={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره رویداد"}
              className={`rounded-full p-1.5 transition-all duration-200 ${
                event.promoted
                  ? "text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/20"
                  : "text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current text-blue-600 dark:text-blue-400" : ""}`} />
            </button>
            <ShareEventButton
              title={event.title}
              href={`/events/${event.slug}`}
              compact
              gold={event.promoted}
            />
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-[13px] sm:leading-6">
          {event.summary}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
              event.promoted
                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-700/60"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {event.category}
          </span>
          {isOnline && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <Video className="h-3.5 w-3.5 shrink-0" />
              آنلاین
            </span>
          )}
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

        <div
          className={`mt-auto flex items-center justify-between gap-3 border-t pt-2.5 ${
            event.promoted
              ? "border-amber-200/80 dark:border-amber-800/60"
              : "border-slate-100 dark:border-slate-800"
          }`}
        >
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
            className={`relative z-10 shrink-0 rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition-all duration-200 active:scale-[0.98] ${
              event.promoted
                ? "bg-gradient-to-l from-amber-400 to-yellow-300 text-amber-950 hover:from-amber-300 hover:to-yellow-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            جزئیات رویداد
          </Link>
        </div>
      </div>
    </article>
  );
}
