"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, MapPin, Sparkles } from "lucide-react";
import { eventStatusMeta } from "@/lib/data";
import type { EventCard } from "@/lib/event-types";
import { faPrice, toFa } from "@/lib/utils";

/** Auto-advance delay for the top-events banner. */
const AUTOPLAY_MS = 5000;

/**
 * Big crossfading banner above the /events filter section, cycling through
 * the featured events.
 *
 * - Autoplays every 5s; pauses on hover/focus and for reduced-motion users.
 * - Prev/next arrows sit on the end (left, RTL) side, opposite the slide's
 *   «جزئیات رویداد» button, aligned with its row.
 * - Arrow keys follow the reading direction: ArrowLeft = next (RTL).
 * - Inactive slides are `inert` so their links stay out of the tab order.
 * - The «رویدادهای برتر» label sits above the banner below `sm` (the slide's
 *   own badges climb high on a short banner) and overlays it from `sm` up.
 */
export default function TopEventsSlideshow({ events }: { events: EventCard[] }) {
  /* Live and upcoming first (soonest at the top), ended ones only as filler. */
  const slides = [
    ...events.filter((event) => event.status !== "ended"),
    ...events.filter((event) => event.status === "ended"),
  ].slice(0, 5);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
    /* `index` in the deps restarts the timer after a manual jump. */
  }, [paused, count, index]);

  if (count === 0) return null;

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  return (
    <>
      {/* Small screens: the label lives above the banner so the slide's own
          status/category badges (which climb high on a short banner) never
          end up underneath it. */}
      <span className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 sm:hidden dark:bg-blue-950 dark:text-blue-300">
        <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
        رویدادهای برتر
      </span>

      <div
        aria-roledescription="carousel"
        aria-label="رویدادهای برتر"
        className="relative h-72 select-none overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-lg dark:border-slate-700 sm:h-80 lg:h-96"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            goNext();
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            goPrev();
          }
        }}
      >
        {/* Slides — stacked, crossfaded via opacity */}
        {slides.map((event, i) => {
          const status = eventStatusMeta[event.status];
          return (
            <div
              key={event.id}
              inert={i !== index}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                i === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {/* Gradient placeholder (image stand-in) + readability overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/15" />

              {/* Copy */}
              <div className="relative flex h-full flex-col justify-end p-5 pb-14 sm:p-7 sm:pb-16 lg:p-9 lg:pb-16">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${status.tint}`}
                  >
                    {event.status === "live" && (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    )}
                    {status.label}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                    {event.category}
                  </span>
                  {event.status !== "ended" && event.seatsLeft !== null && (
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                      {toFa(event.seatsLeft)} صندلی مانده
                    </span>
                  )}
                </div>

                <h2 className="mt-3 line-clamp-2 max-w-3xl text-xl font-extrabold leading-8 text-white sm:text-2xl sm:leading-9 lg:text-3xl lg:leading-11">
                  <Link
                    href={`/events/${event.slug}`}
                    className="rounded-lg decoration-white/60 underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  >
                    {event.title}
                  </Link>
                </h2>

                <p className="mt-2 hidden max-w-2xl line-clamp-2 text-sm leading-6 text-white/80 sm:block">
                  {event.summary}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-white/85">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {event.date} — {event.time}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {event.city} — {event.venue}
                    </span>
                  </span>
                  <span className="font-bold text-white">
                    {event.price === null ? (
                      <span className="text-emerald-300">ورود رایگان</span>
                    ) : (
                      <>شهریه: {faPrice(event.price)}</>
                    )}
                  </span>
                </div>

                <Link
                  href={`/events/${event.slug}`}
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all duration-200 hover:bg-blue-600 hover:text-white active:scale-[0.98] sm:text-sm"
                >
                  جزئیات رویداد
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Static label — overlay from sm up (mobile uses the chip above) */}
        <span className="absolute start-5 top-5 z-10 hidden items-center gap-1.5 rounded-full bg-slate-950/40 px-3 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/25 backdrop-blur-md sm:inline-flex">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          رویدادهای برتر
        </span>

        {/* Prev/next arrows — end (left, RTL) side, opposite the slide's
            «جزئیات رویداد» button and level with its row */}
        {count > 1 && (
          <div className="absolute bottom-14 end-5 z-10 flex items-center gap-2 sm:bottom-16 sm:end-7 lg:end-9">
            <button
              type="button"
              onClick={goPrev}
              aria-label="اسلاید قبلی"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/40 text-white ring-1 ring-white/25 backdrop-blur-md transition-all duration-200 hover:bg-slate-950/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="اسلاید بعدی"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/40 text-white ring-1 ring-white/25 backdrop-blur-md transition-all duration-200 hover:bg-slate-950/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Dots — slide navigation alongside the arrows */}
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-1.5">
          {slides.map((event, i) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`اسلاید ${toFa(i + 1)}: ${event.title}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
