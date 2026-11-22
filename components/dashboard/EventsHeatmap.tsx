"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";
import { shamsiMonths, toFa } from "@/lib/utils";

/**
 * GitHub-contribution-graph style overview of «رویدادهای من», drawn as
 * side-by-side month sheets:
 *
 * - every sheet is 7 columns wide — the Iranian week, شنبه … جمعه, labelled
 *   with a single letter on the top axis — and one row per week, with the day
 *   number written inside each block;
 * - the sheet's month name sits under it;
 * - today is green, an upcoming day with an event is blue, and every day
 *   before today keeps a faded, inert version of those colours;
 * - the strip is a rolling four-month window — the month before the current
 *   one, this month, and the two ahead of it — that slides forward by itself
 *   as days and months pass;
 * - the strip fills the width of the card and is panned with a small drag bar
 *   at the bottom right instead of the native scrollbar.
 */
type HeatmapEvent = {
  id: string;
  title: string;
  /** Jalali (Shamsi) start date of the event. */
  jy: number;
  jm: number;
  jd: number;
};

type JalaliDate = { jy: number; jm: number; jd: number };
type JalaliMonth = { jy: number; jm: number };

/** The Iranian week: شنبه starts it, جمعه ends it. */
const WEEKDAYS = [
  { name: "شنبه", letter: "ش" },
  { name: "یکشنبه", letter: "ی" },
  { name: "دوشنبه", letter: "د" },
  { name: "سه‌شنبه", letter: "س" },
  { name: "چهارشنبه", letter: "چ" },
  { name: "پنجشنبه", letter: "پ" },
  { name: "جمعه", letter: "ج" },
];

/* Legend swatches are fixed-size; grid cells stretch (see DAY_CELL). */
const SWATCH = "h-4 w-4 rounded-[3px]";

/**
 * Square blocks: the side comes from their `1fr` column, so the sheets fill
 * the width of the card. Each sheet carries a `min-width` per column, which
 * keeps a readable floor on phones, where the strip then scrolls sideways
 * instead of shrinking the numbers away.
 */
const DAY_CELL =
  "flex aspect-square w-full select-none items-center justify-center self-start rounded-[3px] text-[10px] font-bold leading-none";

/* Today is green and an upcoming event day is blue; a day before today is
   inert and uses the faded variant of the same colour. */
const EMPTY_STYLE = "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
const EVENT_STYLE = "bg-blue-500 text-white dark:bg-blue-600";
const TODAY_STYLE = "bg-emerald-500 text-white dark:bg-emerald-500";
const PAST_EMPTY_STYLE = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500";
const PAST_EVENT_STYLE = "bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-300";

/** Width of the drag bar under the strip, in px (also its hit area). */
const TRACK_W = 144;
/** Minimum sheet width per weekday column before the strip scrolls. */
const COLUMN_MIN = 19;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const monthKey = (m: JalaliMonth) => `${m.jy}-${m.jm}`;
const dayKey = (jy: number, jm: number, jd: number) => `${jy}-${jm}-${jd}`;
const monthIndex = (m: JalaliMonth) => m.jy * 12 + (m.jm - 1);

function fromMonthIndex(index: number): JalaliMonth {
  return { jy: Math.floor(index / 12), jm: (((index % 12) + 12) % 12) + 1 };
}

const monthName = (m: JalaliMonth) => shamsiMonths[m.jm - 1].label;

/** Column of the month's 1st of month — row-major, so position `i` is weekday
    `i % 7`, which is exactly how the cells array is generated below. */
function firstWeekdayCol(m: JalaliMonth): number {
  const g = toGregorian(m.jy, m.jm, 1);
  const dow = new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay(); // 0 = یکشنبه
  return (dow + 1) % 7; // 0 = شنبه
}

/** Row-major cells for one month: `null` pads the week before day 1. */
function monthGrid(m: JalaliMonth): { cells: (number | null)[]; rows: number } {
  const length = jalaaliMonthLength(m.jy, m.jm);
  const offset = firstWeekdayCol(m);
  const rows = Math.ceil((offset + length) / 7);
  const cells = Array.from({ length: rows * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day >= 1 && day <= length ? day : null;
  });
  return { cells, rows };
}

/**
 * Earlier of the local and UTC calendar dates, as in `ShamsiWheelDatePicker`
 * — for a viewer ahead of UTC the two disagree across midnight, and the
 * earlier one never marks a day that has not started yet.
 */
function todayJalali(): JalaliDate {
  const now = new Date();
  const localMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const useUtc = localMs > utcMs;

  const { jy, jm, jd } = toJalaali(
    useUtc ? now.getUTCFullYear() : now.getFullYear(),
    useUtc ? now.getUTCMonth() + 1 : now.getMonth() + 1,
    useUtc ? now.getUTCDate() : now.getDate(),
  );
  return { jy, jm, jd };
}

/** Midnight UTC of a Jalali day — a cheap comparable for past/future. */
function dayMs(date: JalaliDate): number {
  const g = toGregorian(date.jy, date.jm, date.jd);
  return Date.UTC(g.gy, g.gm - 1, g.gd);
}

/**
 * Months to draw: a rolling window on the present — the month before the
 * current one for a little context, the current one, and the two ahead of it,
 * which is what clients plan for. It comes from the clock alone (no event
 * spreads it), so as days and months pass the whole strip slides forward by
 * itself: last month leaves the left edge, a new month joins the right.
 */
function overviewMonths(today: JalaliMonth): JalaliMonth[] {
  const current = monthIndex(today);
  return [current - 1, current, current + 1, current + 2].map(fromMonthIndex);
}

/**
 * Hydration-safe «today», and a live one.
 *
 * The server renders without a highlight — `new Date()` on the server and in
 * the browser can fall on different sides of a day boundary, and both the
 * green cell and the month window depend on it — so the client resolves the
 * date after hydration. It then keeps resolving it: a tick from an interval
 * (started in the component) plus a catch-up whenever a tab is shown again,
 * and only a real calendar-day change notifies. That keeps the snapshot a
 * stable reference, which is what `useSyncExternalStore` needs, while making
 * sure a page left open moves its highlight and its month window at midnight
 * and at the turn of a month instead of freezing on the day it was opened.
 */
const todayListeners = new Set<() => void>();
let cachedToday: JalaliDate | null = null;

function sameDay(a: JalaliDate, b: JalaliDate | null): boolean {
  return b !== null && a.jy === b.jy && a.jm === b.jm && a.jd === b.jd;
}

/** Re-read the clock; subscribers re-render only when the day actually moved. */
function syncToday(): void {
  const next = todayJalali();
  if (sameDay(next, cachedToday)) return;
  cachedToday = next;
  todayListeners.forEach((notify) => notify());
}

const subscribeToday = (onChange: () => void): (() => void) => {
  todayListeners.add(onChange);
  /* A day (or month) may have turned over while nothing was mounted. */
  syncToday();
  return () => {
    todayListeners.delete(onChange);
  };
};

const getClientToday = (): JalaliDate | null => (cachedToday ??= todayJalali());
const getServerToday = (): JalaliDate | null => null;

export default function EventsHeatmap({ events }: { events: HeatmapEvent[] }) {
  const today = useSyncExternalStore(subscribeToday, getClientToday, getServerToday);

  /* Nothing re-renders this strip on its own, so ask for the clock on a
     schedule — otherwise a tab left open would never leave the day it was
     opened on, and the highlight and the month window would sit still. */
  useEffect(() => {
    const tick = window.setInterval(syncToday, 60_000);
    const onVisible = () => {
      if (!document.hidden) syncToday();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", syncToday);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", syncToday);
    };
  }, []);

  /** Days that hold at least one event, as `jy-jm-jd` keys. */
  const eventDays = useMemo(() => {
    const keys = new Set<string>();
    for (const event of events) keys.add(dayKey(event.jy, event.jm, event.jd));
    return keys;
  }, [events]);

  const months = useMemo(() => (today ? overviewMonths(today) : []), [today]);

  const todayKey = today ? dayKey(today.jy, today.jm, today.jd) : null;
  const todayMs = today ? dayMs(today) : 0;

  /* ── The drag bar: the strip keeps `overflow-x-auto` (wheel/touch still
     work) but its native scrollbar is hidden and panned by this bar. ───── */
  const scrollerId = useId();
  const stripRef = useRef<HTMLDivElement>(null);
  const grab = useRef<{ pointerId: number; dx: number } | null>(null);
  const [view, setView] = useState({ scrollable: false, thumb: 0, offset: 0, value: 0 });

  const measure = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 1) {
      setView((prev) => (prev.scrollable ? { scrollable: false, thumb: 0, offset: 0, value: 0 } : prev));
      return;
    }
    const rtl = getComputedStyle(el).direction === "rtl";
    const thumb = Math.min(
      TRACK_W - 24,
      Math.max(28, (el.clientWidth / el.scrollWidth) * TRACK_W),
    );
    const travel = TRACK_W - thumb;
    const progress = clamp01((rtl ? -el.scrollLeft : el.scrollLeft) / max);
    setView({
      scrollable: true,
      thumb: Math.round(thumb),
      offset: Math.round((rtl ? 1 - progress : progress) * travel),
      value: Math.round(progress * 100),
    });
  }, []);

  useEffect(() => {
    measure();
    const el = stripRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, months]);

  /** Put the thumb's physical left edge at `left` px inside the track. */
  function scrub(left: number) {
    const el = stripRef.current;
    if (!el) return;
    const travel = TRACK_W - view.thumb;
    const max = el.scrollWidth - el.clientWidth;
    if (travel <= 0 || max <= 0) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const progress = clamp01((rtl ? travel - left : left) / travel);
    el.scrollLeft = (rtl ? -1 : 1) * progress * max;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!view.scrollable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    /* Pressing the thumb keeps the grab offset; pressing the bar centres it. */
    const onThumb = event.target !== event.currentTarget;
    grab.current = { pointerId: event.pointerId, dx: onThumb ? x - view.offset : view.thumb / 2 };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    scrub(x - grab.current.dx);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (grab.current?.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    scrub(event.clientX - rect.left - grab.current.dx);
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (grab.current?.pointerId !== event.pointerId) return;
    grab.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const el = stripRef.current;
    if (!el) return;
    event.preventDefault();
    el.scrollLeft += event.key === "ArrowRight" ? 40 : -40;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            نمای کلی رویدادها
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            هر ورقه یک ماه و هر خانه یک روز است؛ سبز امروز، آبی روزِ رویداد و روزهای گذشته
            کمرنگ‌اند.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
          <span className={`${SWATCH} ${EMPTY_STYLE}`} aria-hidden="true" />
          <span>بدون رویداد</span>
          <span className={`${SWATCH} ms-2 ${EVENT_STYLE}`} aria-hidden="true" />
          <span>رویداد</span>
          <span className={`${SWATCH} ms-2 ${TODAY_STYLE}`} aria-hidden="true" />
          <span>امروز</span>
        </div>
      </div>

      {/* Strip — filled in after hydration, once `today` is known. */}
      {today ? (
        <>
          <div
            id={scrollerId}
            ref={stripRef}
            onScroll={measure}
            className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-full gap-2.5">
              {months.map((month, index) => {
                const grid = monthGrid(month);
                const showYear = index === 0 || months[index - 1].jy !== month.jy;
                const columns = WEEKDAYS.length;

                return (
                  <div
                    key={monthKey(month)}
                    className="flex min-w-0 flex-col gap-1.5"
                    style={{ flex: "1 1 0", minWidth: columns * COLUMN_MIN }}
                  >
                    {/* Top axis — one letter per weekday */}
                    <div
                      className="grid gap-[3px]"
                      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                      {WEEKDAYS.map((weekday) => (
                        <span
                          key={weekday.name}
                          title={weekday.name}
                          className="text-center text-[10px] font-bold leading-none text-slate-400 dark:text-slate-500"
                        >
                          {weekday.letter}
                        </span>
                      ))}
                    </div>

                    {/* Day blocks */}
                    <div
                      className="grid gap-[3px]"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${grid.rows}, auto)`,
                      }}
                    >
                      {grid.cells.map((day, cellIndex) => {
                        if (day === null) {
                          return (
                            <span key={cellIndex} aria-hidden="true" className={DAY_CELL} />
                          );
                        }

                        const hasEvent = eventDays.has(dayKey(month.jy, month.jm, day));
                        const isToday = todayKey === dayKey(month.jy, month.jm, day);
                        const isPast = dayMs({ jy: month.jy, jm: month.jm, jd: day }) < todayMs;
                        const label = `${toFa(day)} ${monthName(month)} ${toFa(month.jy)} — ${
                          hasEvent ? "رویداد دارد" : "بدون رویداد"
                        }${isToday ? " (امروز)" : isPast ? " (گذشته)" : ""}`;

                        const style = isPast
                          ? hasEvent
                            ? PAST_EVENT_STYLE
                            : PAST_EMPTY_STYLE
                          : isToday
                            ? TODAY_STYLE
                            : hasEvent
                              ? EVENT_STYLE
                              : EMPTY_STYLE;

                        return (
                          <span
                            key={cellIndex}
                            role="img"
                            aria-label={label}
                            title={label}
                            className={`${DAY_CELL} ${style}`}
                          >
                            {toFa(day)}
                          </span>
                        );
                      })}
                    </div>

                    {/* Month name — under the sheet */}
                    <span className="text-center text-[11px] font-bold leading-4 text-slate-500 dark:text-slate-400">
                      {monthName(month)}
                      {showYear ? ` ${toFa(month.jy)}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom scroller, bottom right — the native bar stays hidden. */}
          {view.scrollable && (
            <div className="mt-3 flex">
              <div
                role="scrollbar"
                aria-orientation="horizontal"
                aria-controls={scrollerId}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={view.value}
                aria-label="جابه‌جایی افقی نمای تقویم"
                tabIndex={0}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onKeyDown={handleKeyDown}
                style={{ width: TRACK_W }}
                className="relative ml-auto h-2 cursor-grab touch-none rounded-full bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 active:cursor-grabbing dark:bg-slate-800"
              >
                <span
                  className="absolute inset-y-0.5 rounded-full bg-slate-400 dark:bg-slate-500"
                  style={{ width: view.thumb, left: view.offset }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="h-[210px]" aria-hidden="true" />
      )}
    </section>
  );
}
