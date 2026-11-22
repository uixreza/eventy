"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Heart, MapPin, Ticket, User } from "lucide-react";
import Link from "next/link";
import { sileo } from "sileo";
import { fetchSavedEvents } from "@/components/dashboard/dashboard-api";
import { toggleBookmark } from "@/app/actions/events";
import DataFetchError from "@/components/dashboard/DataFetchError";
import { SavedSkeleton } from "@/components/dashboard/Skeletons";
import { useServerData } from "@/components/dashboard/useServerData";
import {
  BOOKMARKS_CHANGED_EVENT,
  BOOKMARKS_CHANGED_STORAGE_KEY,
  notifyBookmarksChanged,
} from "@/components/events/bookmark-notify";
import { eventStatusMeta } from "@/lib/data";
import type { EventCard } from "@/lib/event-types";
import { faPrice, toFa } from "@/lib/utils";

/**
 * The saved-events route's shell: it fetches the `Bookmark` rows from the
 * server on every load of `/dashboard/saved` and only mounts the list
 * once they arrive. A bookmark saved or removed anywhere — this tab or
 * another — re-fetches the rows, so the list never needs a refresh.
 */
export default function SavedView() {
  const { data, loaded, failed, reload } = useServerData(fetchSavedEvents);

  useEffect(() => {
    const onChange = () => reload();
    const onStorage = (event: StorageEvent) => {
      if (event.key === BOOKMARKS_CHANGED_STORAGE_KEY) reload();
    };
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(BOOKMARKS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload]);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <SavedSkeleton />;

  /* The key is the set of ids: a fetch that returns different rows starts
     the list over with those rows; an identical answer changes nothing. */
  return <SavedList key={data.map((event) => event.id).join("|")} initial={data} />;
}

/**
 * The list itself. Its state starts from the rows the fetch returned;
 * removing a card writes to the database (with an undo in the toast), so
 * the list and the hearts on `/events` stay in step.
 */
function SavedList({ initial }: { initial: EventCard[] }) {
  const [saved, setSaved] = useState<EventCard[]>(initial);
  const [tab, setTab] = useState("همه");
  /* Tabs derive from what's currently saved, so counts stay truthful after
     removals; a category that runs out falls back to «همه» on its own. */
  const tabs = ["همه", ...Array.from(new Set(saved.map((e) => e.category)))];
  const activeTab = tabs.includes(tab) ? tab : "همه";
  const visible = activeTab === "همه" ? saved : saved.filter((e) => e.category === activeTab);

  function countFor(option: string) {
    return option === "همه" ? saved.length : saved.filter((e) => e.category === option).length;
  }

  /** Optimistically drop the card; put it back if the server says no. */
  function unsave(event: EventCard) {
    const index = saved.findIndex((e) => e.id === event.id);
    setSaved((prev) => prev.filter((e) => e.id !== event.id));

    void toggleBookmark(event.id).then((result) => {
      if (!result.ok) {
        setSaved((prev) => putBack(prev, event, index));
        sileo.error({ title: "حذف انجام نشد", description: result.error });
        return;
      }

      sileo.success({
        title: "از علاقه‌مندی‌ها حذف شد",
        description: `«${event.title}» از لیست شما حذف شد.`,
        button: {
          title: "بازگردانی",
          onClick: () => restore(event, index),
        },
      });
      /* Other tabs showing this list re-fetch the row that just went. */
      notifyBookmarksChanged();
    });
  }

  /** Undo: the card returns where it was and the bookmark row is written again. */
  function restore(event: EventCard, index: number) {
    setSaved((prev) => putBack(prev, event, index));

    void toggleBookmark(event.id).then((result) => {
      if (result.ok) {
        notifyBookmarksChanged();
        return;
      }
      setSaved((prev) => prev.filter((e) => e.id !== event.id));
      sileo.error({ title: "بازگردانی انجام نشد", description: result.error });
    });
  }

  /** Re-insert at the position the card had, so undo puts it back in place. */
  function putBack(list: EventCard[], event: EventCard, index: number) {
    if (list.some((e) => e.id === event.id)) return list;
    const next = [...list];
    next.splice(Math.min(Math.max(index, 0), next.length), 0, event);
    return next;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300">
            <Heart className="h-5 w-5" />
            {saved.length > 0 && (
              <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
                {toFa(saved.length)}
              </span>
            )}
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              علاقه‌مندی‌ها
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {saved.length > 0
                ? `${toFa(saved.length)} رویداد برای بعد ذخیره کرده‌اید.`
                : "هنوز رویدادی ذخیره نکرده‌اید."}
            </p>
          </div>
        </div>
        <Link
          href="/events"
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          <Ticket className="h-4 w-4" />
          کشف رویدادها
        </Link>
      </div>

      {/* Category tabs */}
      {saved.length > 0 && (
        <div role="tablist" aria-label="دسته‌بندی رویدادهای ذخیره‌شده" className="flex flex-wrap gap-2">
          {tabs.map((option) => (
            <button
              key={option}
              role="tab"
              aria-selected={activeTab === option}
              type="button"
              onClick={() => setTab(option)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 sm:text-sm ${
                activeTab === option
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
              }`}
            >
              {option} ({toFa(countFor(option))})
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {saved.length > 0 && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence initial={false}>
            {visible.map((event) => {
              const status = eventStatusMeta[event.status];

              return (
                <motion.article
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  {/* Badge row */}
                  <div className="flex items-center gap-2 px-4 pt-4">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${status.tint}`}
                    >
                      {status.label}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {event.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => unsave(event)}
                      aria-label="حذف از علاقه‌مندی‌ها"
                      title="حذف از علاقه‌مندی‌ها"
                      className="ms-auto rounded-full p-1.5 text-pink-500 transition-all duration-200 hover:bg-pink-50 hover:text-pink-600 dark:text-pink-400 dark:hover:bg-pink-950"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>

                  {/* Gradient cover */}
                  <div className="relative mx-4 mt-3 aspect-video overflow-hidden rounded-xl">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${event.gradient} transition-transform duration-300 group-hover:scale-105`}
                    />
                    <div className="absolute inset-0 bg-black/10" />
                    <span className="absolute bottom-2 end-2 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 backdrop-blur dark:bg-slate-900/95 dark:text-slate-300">
                      <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="max-w-[140px] truncate">
                        {event.venue || event.city}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                      {event.dateTime}
                    </p>
                    <h3 className="line-clamp-2 text-base font-bold leading-7 text-slate-800 transition-colors duration-200 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
                      <Link href={`/events/${event.slug}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                        {event.organizer.charAt(0)}
                      </span>
                      <p className="min-w-0 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                        {event.organizer}
                      </p>
                    </div>
                  </div>

                  {/* Price + CTA */}
                  <div className="mt-auto space-y-3 border-t border-slate-200 px-4 py-3.5 dark:border-slate-700">
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
                      جزئیات رویداد
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty overall */}
      {saved.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-pink-500 dark:bg-pink-950 dark:text-pink-400">
            <Heart className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">
            هنوز رویدادی ذخیره نکرده‌ای.
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            با ضربه روی قلب رویدادها، آن‌ها را اینجا نگه دارید.
          </p>
          <Link
            href="/events"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
          >
            کشف رویدادها
          </Link>
        </div>
      )}
    </div>
  );
}
