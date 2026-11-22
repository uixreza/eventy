import "server-only";

import { prisma } from "@/lib/prisma";
import {
  dateToJalali,
  formatJalaliDate,
  inIran,
  iranDayStart,
  todayJalali,
} from "@/lib/jalali";
import type {
  ConsoleReports,
  ReportDay,
  ReportShare,
  ReportTopEvent,
} from "@/lib/report-types";
import { faNumber, toFa } from "@/lib/utils";

const DAY_MS = 86_400_000;
/** The longest window is 90 days; 180 keeps its previous period in reach. */
const HISTORY_DAYS = 180;

/**
 * Every number `/console/reports` shows that a table can answer.
 *
 * Deliberately **not** cached, like `getConsoleOverview()`: this is an
 * admin-only read whose whole point is to reflect the database right now.
 *
 * Three figures stay seeded because nothing records them — page views, and
 * payments (there is no payments table; `price` is a listing, not a sale).
 * They are returned as plain values and the page marks them `mock`, blurring
 * them and wearing the «داده نمونه» badge so they never pose as live.
 *
 * Fill rate, category share and the top-events table are live: they are
 * derived from `Event` and `Registration` rows.
 */
export async function getConsoleReports(): Promise<ConsoleReports> {
  const today = todayJalali();
  const todayStart = iranDayStart(today.jy, today.jm, today.jd);
  const from = new Date(todayStart.getTime() - (HISTORY_DAYS - 1) * DAY_MS);

  /* The Iranian day a real instant belongs to, as a stable map key. */
  const dayKey = (instant: Date) => {
    const { jy, jm, jd } = dateToJalali(inIran(instant));
    return `${jy}-${jm}-${jd}`;
  };

  const days = Array.from({ length: HISTORY_DAYS }, (_, index) => {
    const start = new Date(from.getTime() + index * DAY_MS);
    /* `start` is the real instant of an Iranian midnight, so shifting it
       into the wall clock lands exactly on that Jalali day. */
    const wall = inIran(start);
    return { key: dayKey(start), date: formatJalaliDate(wall) };
  });

  const [
    registrations,
    publishedByCategory,
    capacityAggregate,
    confirmedOnPublished,
    events,
  ] = await Promise.all([
    prisma.registration.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: from } },
      select: { createdAt: true },
    }),
    prisma.event.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    }),
    prisma.event.aggregate({
      where: { status: "PUBLISHED" },
      _sum: { capacity: true },
    }),
    prisma.registration.count({
      where: { status: "CONFIRMED", event: { status: "PUBLISHED" } },
    }),
    prisma.event.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        city: true,
        capacity: true,
        _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
      },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const registration of registrations) {
    const key = dayKey(registration.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const daily: ReportDay[] = days.map((day) => ({
    date: day.date,
    count: counts.get(day.key) ?? 0,
  }));

  const publishedTotal = publishedByCategory.reduce(
    (sum, row) => sum + row._count._all,
    0,
  );
  const share: ReportShare[] = publishedByCategory
    .slice()
    .sort((a, b) => b._count._all - a._count._all)
    .map((row) => ({
      label: row.category || "بدون دسته",
      percent: publishedTotal
        ? Math.round((row._count._all / publishedTotal) * 100)
        : 0,
    }));

  const capacity = capacityAggregate._sum.capacity ?? 0;
  const fillPercent = capacity
    ? Math.round((confirmedOnPublished / capacity) * 100)
    : 0;
  const fill = {
    value: `${toFa(fillPercent)}٪`,
    change: `${faNumber(confirmedOnPublished)} ثبت‌نام از ${faNumber(capacity)} صندلی`,
  };

  const topEvents: ReportTopEvent[] = events
    .slice()
    .sort((a, b) => b._count.registrations - a._count.registrations)
    .slice(0, 5)
    .map((event) => ({
      id: event.id,
      title: event.title,
      city: event.city || "—",
      registrations: faNumber(event._count.registrations),
      fill:
        event.capacity === null
          ? "—"
          : `${toFa(
              Math.round((event._count.registrations / event.capacity) * 100),
            )}٪`,
    }));

  return {
    daily,
    fill,
    share,
    topEvents,
    /* No page-view table exists. */
    visitors: { value: faNumber(41_820), change: "+۱۲٪" },
    /* No payments table exists. */
    revenue: { value: "۹۴.۲M", change: "+۱۸٪" },
  };
}
