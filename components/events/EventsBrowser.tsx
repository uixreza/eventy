"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { CalendarX2, ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
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

export default function EventsBrowser({ events }: { events: EventCard[] }) {
  /**
   * The filters the hero search hands over in the URL. They are the defaults
   * — every filter the visitor touches by hand overrides them (`null` means
   * "not touched", so resetting a filter falls back to the URL again).
   */
  const urlSearch = useUrlSearch();
  const urlParams = useMemo(() => new URLSearchParams(urlSearch), [urlSearch]);

  const [queryOverride, setQueryOverride] = useState<string | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [cityOverride, setCityOverride] = useState<string | null>(null);
  const [status, setStatus] = useState<EventTimeState | typeof ALL>(ALL);
  const [price, setPrice] = useState(ALL);
  const [sort, setSort] = useState("recommended");

  /* The hearts — real rows in the database, see `useBookmarks`. */
  const { isSaved, toggle, authModal } = useBookmarks();

  const query = queryOverride ?? urlParams.get("q") ?? "";
  const category = categoryOverride ?? urlParams.get("category") ?? ALL;
  const city = cityOverride ?? urlParams.get("city") ?? ALL;

  const categoryOptions = [ALL, ...Array.from(new Set(events.map((e) => e.category)))];
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
    query.trim() !== "" || category !== ALL || status !== ALL || city !== ALL || price !== ALL;

  function resetFilters() {
    /* Clearing means clearing — the URL default (the hero search) included. */
    setQueryOverride("");
    setCategoryOverride(ALL);
    setCityOverride(ALL);
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
      if (city !== ALL && event.city !== city) return false;
      if (price === "free" && event.price !== null) return false;
      if (price === "paid" && event.price === null) return false;
      return true;
    });

    if (sort === "price") list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title, "fa"));
    return list;
  }, [events, query, category, status, city, price, sort]);

  const shown = visible.slice(0, visibleCount);

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
            {toFa(events.length)} رویداد در {toFa(cityOptions.length - 1)} شهر؛ فیلتر کنید و
            رویداد بعدی‌تان را پیدا کنید.
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

          {/* City */}
          <div className="lg:w-40">
            <label
              htmlFor="event-city"
              className="mb-1.5 block text-[11px] font-bold text-slate-500 dark:text-slate-400"
            >
              شهر
            </label>
            <select
              id="event-city"
              value={city}
              onChange={(e) => setCityOverride(e.target.value)}
              className={selectClass}
            >
              {cityOptions.map((option) => (
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

        {/* Category chips */}
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            دسته‌بندی
          </p>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {categoryOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategoryOverride(option)}
                aria-pressed={category === option}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                  category === option
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
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
              className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
              {shown.map((event) => (
                <EventListCard
                  key={event.id}
                  event={event}
                  saved={isSaved(event.id)}
                  onToggleSave={toggle}
                />
              ))}
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
