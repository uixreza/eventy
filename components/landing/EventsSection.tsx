"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import EventCard from "./EventCard";
import { toFa } from "@/lib/utils";
import type { EventCard as EventCardData } from "@/lib/event-types";

const ALL = "همه";
/* An online event has no city — counting it would inflate the «از N شهر»
   line with a place nobody travels to. */
const ONLINE = "آنلاین";

type EventsSectionProps = {
  /** The nearest published events, fetched on the server (see `getHotEvents`). */
  events: EventCardData[];
};

export default function EventsSection({ events }: EventsSectionProps) {
  /* Tabs come from what is actually on offer this week, so a category with
     no upcoming event never shows up as an empty filter. */
  const tabs = useMemo(() => {
    const seen = new Set<string>();
    for (const event of events) seen.add(event.category);
    return [ALL, ...seen];
  }, [events]);

  const [active, setActive] = useState(ALL);
  const selected = tabs.includes(active) ? active : ALL;
  const visible = selected === ALL ? events : events.filter((e) => e.category === selected);

  const cityCount = useMemo(
    () => new Set(events.filter((e) => e.city !== ONLINE).map((e) => e.city)).size,
    [events],
  );

  return (
    <section
      id="events"
      className="relative scroll-mt-28 overflow-hidden py-12 sm:py-14"
    >
      {/* Soft blue band — fades to transparent at the edges so it never
          clashes with the sections above/below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/15 to-transparent"
      />
      {/* Faint dot texture, faded out at the edges by the mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(59,130,246,0.16)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      />
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute start-[8%] top-[16%] h-64 w-64 rounded-full bg-blue-400/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
              رویدادهای داغ و برگزیده این هفته
            </h2>
            {events.length > 0 && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {toFa(events.length)} رویداد منتخب
                {cityCount > 0 && <> از {toFa(cityCount)} شهر</>}
              </p>
            )}
          </div>
        </div>

        {/* Category filter tabs */}
        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label="دسته‌بندی رویدادها"
            className="no-scrollbar mb-7 flex gap-2 overflow-x-auto pb-1"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={selected === tab}
                type="button"
                onClick={() => setActive(tab)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 sm:text-sm ${
                  selected === tab
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Card grid */}
        {visible.length > 0 ? (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {visible.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {selected === ALL
                ? "فعلاً رویدادی برای نمایش وجود ندارد."
                : "هنوز رویدادی در این دسته ثبت نشده است."}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {selected === ALL
                ? "به‌محض انتشار رویدادهای تازه، همین‌جا می‌بینیدشان."
                : `اولین نفری باشید که رویدادی در «${selected}» می‌سازد!`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
