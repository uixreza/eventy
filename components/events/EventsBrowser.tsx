"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { CalendarX2, ChevronDown, Crown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useLocation } from "@/components/layout/LocationProvider";
import type { PublicCategory } from "@/lib/categories";
import { eventStatusMeta } from "@/lib/data";
import type { EventCard, EventTimeState } from "@/lib/event-types";
import { toFa } from "@/lib/utils";
import EventListCard from "./EventListCard";
import TopEventsSlideshow from "./TopEventsSlideshow";
import { useBookmarks } from "./useBookmarks";

/** The URL never changes while this page is mounted, so there is nothing to
    subscribe to — `useSyncExternalStore` only needs a stable callback. */
const noopSubscribe = () => () => {};

/**
 * The query string of the current URL.
 *
 * The server has no query string, so it renders with an empty one and the
 * client picks the real value up right after hydration — no mismatch, and no
 * `setState` inside an effect.
 */
function useUrlSearch(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => "",
  );
}

const ALL = "همه";
/** Online events are location-independent, so they stay in every city view. */
const ONLINE_CITY = "آنلاین";

/** Paid placements always lead, whatever sort the visitor picks. */
const byPromotion = (a: EventCard, b: EventCard) =>
  Number(b.promoted) - Number(a.promoted);

/** How many cards each "load more" click reveals. */
const PAGE_SIZE = 6;

const statusOptions: { value: EventTimeState | typeof ALL; label: string }[] = [
  { value: ALL, label: "همه وضعیت‌ها" },
  { value: "live", label: eventStatusMeta.live.label },
  { value: "upcoming", label: eventStatusMeta.upcoming.label },
  { value: "ended", label: eventStatusMeta.ended.label },
];
const priceOptions = [
  { value: ALL, label: "همه قیمت‌ها" },
  { value: "free", label: "رایگان" },
  { value: "paid", label: "شهریه‌دار" },
];
const sortOptions = [
  { value: "recommended", label: "پیشنهادی" },
  { value: "price", label: "ارزان‌ترین" },
  { value: "title", label: "عنوان (الفبا)" },
];

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-600";

export default function EventsBrowser({
  events,
  categories,
}: {
  events: EventCard[];
  categories: PublicCategory[];
}) {
  /**
   * The filters the hero search hands over in the URL. They are the defaults
   * — every filter the visitor touches by hand overrides them (`null` means
   * "not touched", so resetting a filter falls back to the URL again).
   */
  const urlSearch = useUrlSearch();
  const urlParams = useMemo(() => new URLSearchParams(urlSearch), [urlSearch]);

  const { location } = useLocation();
  const [queryOverride, setQueryOverride] = useState<string | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [status, setStatus] = useState<EventTimeState | typeof ALL>(ALL);
  const [price, setPrice] = useState(ALL);
  const [sort, setSort] = useState("recommended");

  /* The hearts — real rows in the database, see `useBookmarks`. */
  const { isSaved, toggle, authModal } = useBookmarks();

  const query = queryOverride ?? urlParams.get("q") ?? "";
  const category = categoryOverride ?? urlParams.get("category") ?? ALL;
  /* The header's location picker is the city filter here — not a second
     dropdown in this section. Online events are added to every city view. */
  const city = location.city;

  /* The select mirrors the visible `Category` rows, not whatever happens to
     be in the current event page. A bookmarked URL may still name a category
     an admin has since hidden; keep that option so the select never goes blank. */
  const categoryOptions = useMemo(() => {
    const names = categories.map((item) => item.name);
    if (category !== ALL && !names.includes(category)) names.push(category);
    return [ALL, ...names];
  }, [categories, category]);
  const cityOptions = [ALL, ...Array.from(new Set(events.map((e) => e.city).filter(Boolean)))];

  /** Current filters + sort — identifies one result set (and its page); the
      results grid is keyed by it so the list re-animates on filter changes. */
  const filterKey = `${query}|${category}|${status}|${city}|${price}|${sort}`;

  /**
   * Pagination state is keyed by `filterKey`: when the filters change, the
   * derived `visibleCount` below falls back to the first page on its own —
   * no reset effect needed (and no setState-in-effect).
   */
  const [pagination, setPagination] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = pagination.key === filterKey ? pagination.count : PAGE_SIZE;

  const hasActiveFilters =
    query.trim() !== "" || category !== ALL || status !== ALL || price !== ALL;

  function resetFilters() {
    /* Clearing means clearing — the URL default (the hero search) included.
       The header location is not cleared here; it is a site-wide choice. */
    setQueryOverride("");
    setCategoryOverride(ALL);
    setStatus(ALL);
    setPrice(ALL);
  }

  const visible = useMemo(() => {
    const q = query.trim();
    const list = events.filter((event) => {
      if (q && !`${event.title} ${event.summary} ${event.venue} ${event.organizer}`.includes(q))
        return false;
      if (category !== ALL && event.category !== category) return false;
      if (status !== ALL && event.status !== status) return false;
      if (event.city !== ONLINE_CITY && event.city !== city) return false;
      if (price === "free" && event.price !== null) return false;
      if (price === "paid" && event.price === null) return false;
      return true;
    });

    /* The server already pins promoted rows first; repeat it here so a
       client-side sort cannot demote them. */
    if (sort === "price") {
      list.sort((a, b) => byPromotion(a, b) || (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === "title") {
      list.sort((a, b) => byPromotion(a, b) || a.title.localeCompare(b.title, "fa"));
    } else {
      list.sort(byPromotion);
    }
    return list;
  }, [events, query, category, status, city, price, sort]);

  const shown = visible.slice(0, visibleCount);
  /* Promoted rows lead the sorted list; render them as their own block so the
     gold cards are visibly separated from the ordinary cards below them. */
  const shownPromoted = shown.filter((event) => event.promoted);
  const shownRegular = shown.filter((event) => !event.promoted);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      {/* ── Page heading ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            تقویم و فهرست رویدادها
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            کشف رویدادها
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {toFa(events.length)} رویداد در {toFa(cityOptions.length - 1)} شهر؛ نتایج بر اساس شهر
            «{city}» و رویدادهای آنلاین نمایش داده می شوند.
          </p>
        </div>
      </div>

      {/* ── Top events slideshow (banner above the filters) ─── */}
      <section aria-label="رویدادهای برتر" className="mt-6">
        <TopEventsSlideshow events={events} />
      </section>

      {/* ── Section 1: filters ───────────────────────────────── */}
      <section
        aria-label="فیلتر رویدادها"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* Search */}
          <div className="flex-1">
            <label
              htmlFor="event-search"
              className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              جستجو
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="event-search"
                type="search"
                value={query}
                onChange={(e) => setQueryOverride(e.target.value)}
                placeholder="نام رویداد، مکان یا برگزارکننده..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-9 pe-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-600"
              />
            </div>
          </div>

          {/* Status */}
          <div className="lg:w-44">
            <label
              htmlFor="event-status"
              className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              وضعیت
            </label>
            <select
              id="event-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventTimeState | typeof ALL)}
              className={selectClass}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="lg:w-48">
            <label
              htmlFor="event-category"
              className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              دسته بندی
            </label>
            <select
              id="event-category"
              value={category}
              onChange={(e) => setCategoryOverride(e.target.value)}
              className={selectClass}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="lg:w-36">
            <label
              htmlFor="event-price"
              className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              هزینه
            </label>
            <select
              id="event-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={selectClass}
            >
              {priceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              حذف فیلترها
            </button>
          )}
        </div>

      </section>

      {/* ── Section 2: results ───────────────────────────────── */}
      <section aria-label="فهرست رویدادها" className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {toFa(visible.length)} رویداد
            {hasActiveFilters && (
              <span className="font-medium text-slate-400 dark:text-slate-500">
                {" "}
                از {toFa(events.length)} مورد
              </span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <label
              htmlFor="event-sort"
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              مرتب‌سازی
            </label>
            <select
              id="event-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-colors hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length > 0 ? (
          <>
            <motion.div
              key={filterKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-5 space-y-8"
            >
              {shownPromoted.length > 0 && (
                <section aria-labelledby="promoted-events-heading">
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/70 bg-gradient-to-l from-amber-100/80 via-amber-50/70 to-white px-3 py-2 dark:border-amber-800/70 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-sm">
                      <Crown className="h-4 w-4 fill-current" />
                    </span>
                    <h2
                      id="promoted-events-heading"
                      className="text-sm font-extrabold text-amber-900 dark:text-amber-200"
                    >
                      رویدادهای ویژه
                    </h2>
                    <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                      {toFa(shownPromoted.length)} ویژه
                    </span>
                    <p className="w-full text-[11px] text-amber-800/80 dark:text-amber-300/70 sm:ms-auto sm:w-auto">
                      این رویدادها توسط کوجا در صدر فهرست قرار گرفتهاند.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {shownPromoted.map((event) => (
                      <EventListCard
                        key={event.id}
                        event={event}
                        saved={isSaved(event.id)}
                        onToggleSave={toggle}
                      />
                    ))}
                  </div>
                </section>
              )}

              {shownRegular.length > 0 && (
                <section aria-labelledby="other-events-heading">
                  <div className="mb-3 flex items-center gap-2">
                    <h2
                      id="other-events-heading"
                      className="text-sm font-extrabold text-slate-800 dark:text-slate-200"
                    >
                      سایر رویدادها
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {toFa(shownRegular.length)} مورد
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {shownRegular.map((event) => (
                      <EventListCard
                        key={event.id}
                        event={event}
                        saved={isSaved(event.id)}
                        onToggleSave={toggle}
                      />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>

            {/* Load more — revealed one page at a time */}
            {shown.length < visible.length && (
              <div className="mt-7 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagination({ key: filterKey, count: visibleCount + PAGE_SIZE })}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:text-blue-700 hover:shadow-md active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:text-blue-300"
                >
                  نمایش رویدادهای بیشتر
                  <ChevronDown className="h-4 w-4" />
                </button>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  نمایش {toFa(shown.length)} از {toFa(visible.length)} رویداد
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400">
              <CalendarX2 className="h-7 w-7" />
            </span>
            <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">
              رویدادی با این فیلترها پیدا نشد.
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              یکی از فیلترها را بردارید تا نتایج بیشتری ببینید.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" />
              حذف فیلترها
            </button>
          </div>
        )}
      </section>

      {/* Hosts the sign-in modal a signed-out visitor gets when pressing a heart */}
      {authModal}
    </div>
  );
}
