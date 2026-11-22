"use client";

import { useEffect, useMemo, useRef } from "react";
import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";
import { shamsiMonths, toFa } from "@/lib/utils";
import { Wheel, WHEEL_HEIGHT } from "@/components/ui/Wheel";

/**
 * Three rolling wheels — سال / ماه / روز — for picking a birthday in the
 * Shamsi calendar, the way native mobile pickers work: scroll with the mouse
 * wheel or a finger, drag with the mouse, or focus a wheel and use the arrow
 * keys. The row sitting inside the highlight band is the selection.
 *
 * The form keeps a Gregorian `YYYY-MM-DD` (`profile.birthDate`) because that
 * is what `isValidBirthDate` and the `User.birthDate` column speak; the
 * Jalali ↔ Gregorian conversion happens only at this component's edges.
 *
 * Wheel ranges are clamped to exactly what the server accepts: from Jan 1 of
 * the year 120 years ago (`isValidBirthDate`'s floor) up to today minus 13
 * years, so the wheels can never offer a date step three would reject.
 *
 * The rolling column itself lives in `@/components/ui/Wheel` and is shared
 * with the event form's date/time pickers.
 */

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type Jalali = { year: number; month: number; day: number };
type Bounds = { today: Jalali; min: Jalali; max: Jalali };

const pad2 = (value: number) => String(value).padStart(2, "0");

const range = (from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/**
 * Selectable window for the wheels.
 *
 * Both ends are built from Gregorian dates first (Jan 1 of UTC year − 120 is
 * literally `isValidBirthDate`'s `oldest`; today minus 13 years is its
 * `youngest`) so the round-trip through Jalali lands on exactly those days —
 * constructing them in Jalali space could drift a day past the server's
 * bound. `today` itself is the earlier of the local and UTC calendar dates
 * because Iran sits ahead of UTC and the later date could offer a boundary
 * day the server would reject.
 */
function computeBounds(): Bounds {
  const now = new Date();
  const localMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const useUtc = localMs > utcMs;

  const y = useUtc ? now.getUTCFullYear() : now.getFullYear();
  const m = useUtc ? now.getUTCMonth() + 1 : now.getMonth() + 1;
  const d = useUtc ? now.getUTCDate() : now.getDate();

  const today = toJalaali(y, m, d);
  const floor = toJalaali(now.getUTCFullYear() - 120, 1, 1);
  const youngest = toJalaali(y - 13, m, d);

  return {
    today: { year: today.jy, month: today.jm, day: today.jd },
    min: { year: floor.jy, month: floor.jm, day: floor.jd },
    max: { year: youngest.jy, month: youngest.jm, day: youngest.jd },
  };
}

/** Months selectable in `year`: trimmed at the two ends of the range. */
function monthsOf(year: number, bounds: Bounds): number[] {
  const from = year === bounds.min.year ? bounds.min.month : 1;
  const to = year === bounds.max.year ? bounds.max.month : 12;
  return range(from, to);
}

/** Days selectable for `year`/`month`, honoring the month's length (Esfand 29/30). */
function daysOf(sel: Pick<Jalali, "year" | "month">, bounds: Bounds): number[] {
  const length = jalaaliMonthLength(sel.year, sel.month);
  let from = 1;
  let to = length;
  if (sel.year === bounds.min.year && sel.month === bounds.min.month) {
    from = bounds.min.day;
  }
  if (sel.year === bounds.max.year && sel.month === bounds.max.month) {
    to = Math.min(to, bounds.max.day);
  }
  return range(from, to);
}

/** Force a selection back inside the selectable window. */
function normalize(sel: Jalali, bounds: Bounds): Jalali {
  const year = clamp(sel.year, bounds.min.year, bounds.max.year);
  const months = monthsOf(year, bounds);
  const month = clamp(sel.month, months[0], months[months.length - 1]);
  const days = daysOf({ year, month }, bounds);
  const day = clamp(sel.day, days[0], days[days.length - 1]);
  return { year, month, day };
}

/** Default when nothing is chosen yet: the same day 20 years ago. */
function defaultSelection(bounds: Bounds): Jalali {
  return {
    year: bounds.today.year - 20,
    month: bounds.today.month,
    day: bounds.today.day,
  };
}

/** Parse the Gregorian `YYYY-MM-DD` the form stores; null when unusable. */
function parse(value: string): Jalali | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  try {
    const j = toJalaali(Number(match[1]), Number(match[2]), Number(match[3]));
    return { year: j.jy, month: j.jm, day: j.jd };
  } catch {
    return null;
  }
}

function toISO(date: Jalali): string {
  const g = toGregorian(date.year, date.month, date.day);
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
}

type ShamsiWheelDatePickerProps = {
  /** Gregorian `YYYY-MM-DD` — what the form stores and the server validates. */
  value: string;
  /** Called with a Gregorian `YYYY-MM-DD` whenever the wheels settle. */
  onChange: (value: string) => void;
  /** Accessible name for the whole group. */
  label?: string;
};

/**
 * Birthday wheel for step three of the auth modal: سال / ماه / روز columns
 * (right to left in the RTL layout), reporting back a Gregorian `YYYY-MM-DD`.
 */
export default function ShamsiWheelDatePicker({
  value,
  onChange,
  label = "تاریخ تولد",
}: ShamsiWheelDatePickerProps) {
  const bounds = useMemo(() => computeBounds(), []);

  const sel = useMemo(() => {
    const base = value ? parse(value) : null;
    return normalize(base ?? defaultSelection(bounds), bounds);
  }, [value, bounds]);

  /* The form starts with an empty `birthDate`; publish the default once so
     submitting untouched step three still carries a real date. */
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!value) onChange(toISO(sel));
  }, [value, onChange, sel]);

  const update = (part: "year" | "month" | "day", next: number) => {
    const draft: Jalali = { ...sel };
    draft[part] = next;
    /* Normalizing here clamps dependents too — picking the oldest year drops
       the month/day back onto the boundary instead of past it. */
    onChange(toISO(normalize(draft, bounds)));
  };

  const yearItems = range(bounds.min.year, bounds.max.year).map((year) => ({
    value: year,
    text: toFa(year),
  }));
  const monthItems = monthsOf(sel.year, bounds).map((month) => ({
    value: month,
    text: shamsiMonths[month - 1].label,
  }));
  const dayItems = daysOf(sel, bounds).map((day) => ({
    value: day,
    text: toFa(day),
  }));

  return (
    <div className="mt-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-slate-800/70">
        {/* Column captions, aligned with the wheels below. */}
        <div aria-hidden="true" className="mb-1 flex gap-1 sm:gap-2">
          {["سال", "ماه", "روز"].map((caption) => (
            <span
              key={caption}
              className="flex-1 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500"
            >
              {caption}
            </span>
          ))}
        </div>

        <div className="relative" role="group" aria-label={label}>
          {/* The highlight band the selected row sits in. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-10 -translate-y-1/2 rounded-lg bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:ring-blue-900"
          />
          <div className="relative z-10 flex gap-1 sm:gap-2" style={{ height: WHEEL_HEIGHT }}>
            <Wheel
              label="سال تولد"
              items={yearItems}
              selected={sel.year}
              onSelect={(next) => update("year", next)}
            />
            <Wheel
              label="ماه تولد"
              items={monthItems}
              selected={sel.month}
              onSelect={(next) => update("month", next)}
            />
            <Wheel
              label="روز تولد"
              items={dayItems}
              selected={sel.day}
              onSelect={(next) => update("day", next)}
            />
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        تاریخ تولد انتخابی:{" "}
        <span
          dir="ltr"
          className="font-bold text-slate-600 dark:text-slate-300"
        >
          {toFa(`${sel.year}/${pad2(sel.month)}/${sel.day}`)}
        </span>
      </p>
    </div>
  );
}
