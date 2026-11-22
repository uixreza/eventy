import { toGregorian, toJalaali } from "jalaali-js";
import { shamsiMonths, toFa } from "@/lib/utils";

/**
 * Jalali (Shamsi) ⇄ Date helpers.
 *
 * The whole product is Iranian: people type and read Jalali dates, and the
 * database stores plain timestamps. The rule used here is deliberately
 * simple — a stored timestamp keeps the *Iranian wall clock* in its UTC
 * fields, so «۲۸ آبان ۱۶:۰۰» is stored as `16:00Z` on the Gregorian day
 * ۲۸ آبان falls on. Nothing has to reason about a timezone offset while
 * typing, sorting or comparing dates; the offset is applied in exactly one
 * place (`realInstant`) when a moment has to be compared to the clock.
 */

export type JalaliParts = {
  jy: number;
  jm: number;
  jd: number;
  hh: number;
  mm: number;
};

/** Iran is UTC+03:30 — no daylight saving. */
export const IRAN_OFFSET_MINUTES = 210;
const IRAN_OFFSET_MS = IRAN_OFFSET_MINUTES * 60 * 1000;

/** Jalali wall clock → the timestamp we store. */
export function jalaliToDate(
  jy: number,
  jm: number,
  jd: number,
  hh = 0,
  mm = 0,
): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(Date.UTC(gy, gm - 1, gd, hh, mm));
}

/** The stored timestamp → its Jalali wall clock. */
export function dateToJalali(date: Date): JalaliParts {
  const { jy, jm, jd } = toJalaali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  return { jy, jm, jd, hh: date.getUTCHours(), mm: date.getUTCMinutes() };
}

/**
 * The real moment something happens. The stored value carries the Iranian
 * wall clock in its UTC fields, so the actual instant sits 3½ hours earlier.
 */
export function realInstant(stored: Date): Date {
  return new Date(stored.getTime() - IRAN_OFFSET_MS);
}

/** Now, shifted into the Iranian wall clock. */
export function nowInIran(): Date {
  return new Date(Date.now() + IRAN_OFFSET_MS);
}

/** A real instant → the Date whose UTC fields carry its Iranian wall clock. */
export function inIran(instant: Date): Date {
  return new Date(instant.getTime() + IRAN_OFFSET_MS);
}

/**
 * The real instant an Iranian calendar day begins.
 *
 * `jalaliToDate` stores the Iranian wall clock in the UTC fields — the
 * convention documented at the top — so the actual midnight sits 3½ hours
 * earlier and `realInstant` puts it back on the clock. Rows that Prisma
 * stamps (`createdAt`, `updatedAt`) are genuine UTC instants, which is
 * exactly why they are compared against this and not a raw `Date.UTC`.
 */
export function iranDayStart(jy: number, jm: number, jd: number): Date {
  return realInstant(jalaliToDate(jy, jm, jd));
}

/** Today in Iran, as a Jalali date. */
export function todayJalali(): JalaliParts {
  const shifted = nowInIran();
  const { jy, jm, jd } = toJalaali(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
  return { jy, jm, jd, hh: shifted.getUTCHours(), mm: shifted.getUTCMinutes() };
}

/** Same Jalali day? */
export function isSameJalaliDay(a: JalaliParts, b: JalaliParts): boolean {
  return a.jy === b.jy && a.jm === b.jm && a.jd === b.jd;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** «۲۸ آبان» */
export function formatJalaliDate(date: Date): string {
  const { jm, jd } = dateToJalali(date);
  return `${toFa(jd)} ${shamsiMonths[jm - 1].label}`;
}

/** «۱۶:۰۰» */
export function formatJalaliTime(date: Date): string {
  const { hh, mm } = dateToJalali(date);
  return `${toFa(pad2(hh))}:${toFa(pad2(mm))}`;
}

/** «۲۸ آبان - ۱۶:۰۰» */
export function formatJalaliDateTime(date: Date): string {
  return `${formatJalaliDate(date)} - ${formatJalaliTime(date)}`;
}

/** «۲۸ آبان ۱۴۰۵» */
export function formatJalaliFull(date: Date): string {
  const { jy, jm, jd } = dateToJalali(date);
  return `${toFa(jd)} ${shamsiMonths[jm - 1].label} ${toFa(jy)}`;
}

/**
 * Where an event stands in time: before it starts it is «پیش رو», during its
 * own day it is «در حال برگزاری», and afterwards it is «پایان‌یافته».
 */
export type EventTimeStatus = "live" | "upcoming" | "ended";

export function eventTimeStatus(stored: Date): EventTimeStatus {
  const now = Date.now();
  if (realInstant(stored).getTime() > now) return "upcoming";
  const start = dateToJalali(stored);
  const today = todayJalali();
  if (isSameJalaliDay(start, today)) return "live";
  return "ended";
}

/** True once the event's day is over. */
export function isPast(stored: Date): boolean {
  return eventTimeStatus(stored) === "ended";
}
