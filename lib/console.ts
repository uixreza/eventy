import "server-only";

import { prisma } from "@/lib/prisma";
import {
  formatJalaliDate,
  formatJalaliDateTime,
  iranDayStart,
  todayJalali,
} from "@/lib/jalali";
import type {
  ConsoleAlert,
  ConsoleOverview,
  ConsoleReviewRow,
  ConsoleStat,
} from "@/lib/console-types";
import type { BroadcastNotice } from "@/lib/broadcast-types";
import { faNumber, toFa } from "@/lib/utils";

const DAY_MS = 86_400_000;

/** «+۱۲ این هفته» / «۴ مورد در انتظار» — the line under a stat's value. */
function signed(count: number, suffix: string): string {
  return `+${faNumber(count)} ${suffix}`;
}

/**
 * Every number the console home shows, read from the tables in one pass.
 *
 * Deliberately **not** cached: `/console` is admin-only and its whole point
 * is to reflect the database right now — a pending review that was just
 * approved, a user who joined a minute ago. `GET /api/console/overview`
 * calls this behind `getSession()`, whose `io()` already keeps the read out
 * of the prerender.
 *
 * Cards whose figure has no table behind it (there is no payments table, so
 * «درآمد خالص» cannot be computed) keep their seeded value and are flagged
 * `mock: true`; the page then labels them «داده نمونه» instead of passing
 * them off as live.
 */
export async function getConsoleOverview(): Promise<ConsoleOverview> {
  const now = Date.now();
  const today = todayJalali();
  const dayStart = iranDayStart(today.jy, today.jm, today.jd);
  const monthStart = iranDayStart(today.jy, today.jm, 1);
  const weekAgo = new Date(now - 7 * DAY_MS);
  const twoDaysAgo = new Date(now - 2 * DAY_MS);
  const nowDate = new Date(now);
  const weekAhead = new Date(now + 7 * DAY_MS);

  const [
    published,
    publishedThisWeek,
    activeUsers,
    joinedThisMonth,
    approvedToday,
    pending,
    stalePending,
    happeningThisWeek,
    reviewRows,
    broadcastRows,
  ] = await Promise.all([
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.event.count({ where: { status: "PUBLISHED", createdAt: { gte: weekAgo } } }),
    /* «فعال» here means the account still exists and is not blocked. */
    prisma.user.count({ where: { bannedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    /* An approval moves the row to PUBLISHED and bumps `updatedAt`. */
    prisma.event.count({ where: { status: "PUBLISHED", updatedAt: { gte: dayStart } } }),
    prisma.event.count({ where: { status: "PENDING" } }),
    prisma.event.count({ where: { status: "PENDING", createdAt: { lt: twoDaysAgo } } }),
    prisma.event.count({
      where: { status: "PUBLISHED", startsAt: { gte: nowDate, lte: weekAhead } },
    }),
    prisma.event.findMany({
      where: { status: { in: ["PENDING", "REJECTED"] } },
      orderBy: { createdAt: "asc" },
      take: 6,
      select: { id: true, title: true, organizerName: true, status: true, startsAt: true },
    }),
    prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, body: true, createdAt: true },
    }),
  ]);

  const stats: ConsoleStat[] = [
    {
      key: "published",
      value: faNumber(published),
      change: signed(publishedThisWeek, "این هفته"),
      mock: false,
    },
    {
      key: "users",
      value: faNumber(activeUsers),
      change: signed(joinedThisMonth, "این ماه"),
      mock: false,
    },
    {
      key: "approvedToday",
      value: faNumber(approvedToday),
      change: `${faNumber(pending)} مورد در انتظار`,
      mock: false,
    },
    /* No payments table exists — see the doc comment above. */
    { key: "revenue", value: "۹۴.۲M", change: "۱۸٪ رشد", mock: true },
  ];

  const reviews: ConsoleReviewRow[] = reviewRows.map((row) => ({
    id: row.id,
    title: row.title,
    organizer: row.organizerName.trim() || "—",
    date: formatJalaliDate(row.startsAt),
    status: row.status === "REJECTED" ? "REJECTED" : "PENDING",
  }));

  const alerts: ConsoleAlert[] = [
    stalePending > 0
      ? {
          id: "stale",
          level: "amber",
          mock: false,
          text: `${toFa(stalePending)} رویداد بیش از ۴۸ ساعت بدون پاسخ مانده‌اند.`,
        }
      : {
          id: "stale",
          level: "emerald",
          mock: false,
          text: "همه رویدادهای تازه به‌موقع بررسی شده‌اند.",
        },
    {
      id: "upcoming",
      level: "blue",
      mock: false,
      text:
        happeningThisWeek > 0
          ? `${toFa(happeningThisWeek)} رویداد تا یک هفته آینده برگزار می‌شود.`
          : "تا یک هفته آینده رویدادی برنامه‌ریزی نشده است.",
    },
    { id: "gateway", level: "red", mock: true, text: "درگاه پرداخت آزمایشی از دسترس خارج است." },
    { id: "backup", level: "emerald", mock: true, text: "پشتیبان‌گیری روزانه با موفقیت انجام شد." },
  ];

  const broadcasts: BroadcastNotice[] = broadcastRows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    sentAt: formatJalaliDateTime(row.createdAt),
  }));

  return { stats, reviews, alerts, broadcasts };
}
