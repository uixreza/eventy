"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, Megaphone, TrendingUp, Users } from "lucide-react";
import ConsoleBroadcasts from "./ConsoleBroadcasts";
import MockBadge from "./MockBadge";
import { MOCK_CLASS } from "./mock";
import type {
  ConsoleAlertLevel,
  ConsoleOverview as OverviewData,
  ConsoleReviewStatus,
  ConsoleStatKey,
} from "@/lib/console-types";

const statMeta: Record<
  ConsoleStatKey,
  { label: string; icon: typeof Megaphone; tint: string }
> = {
  published: {
    label: "رویدادهای منتشرشده",
    icon: Megaphone,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  users: {
    label: "کاربران فعال",
    icon: Users,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  approvedToday: {
    label: "رویدادهای تأییدشده امروز",
    icon: CalendarCheck,
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  revenue: {
    label: "درآمد خالص (تومان)",
    icon: TrendingUp,
    tint: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
  },
};

const reviewStatusMeta: Record<
  ConsoleReviewStatus,
  { label: string; tint: string }
> = {
  PENDING: {
    label: "در انتظار تأیید",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  REJECTED: {
    label: "نیازمند اصلاح",
    tint: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
};

const alertTints: Record<ConsoleAlertLevel, string> = {
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

/**
 * `/console` — the home screen.
 *
 * Every figure comes from `GET /api/console/overview`, which reads the
 * tables on each visit; the loader owns the fetch and the retry state, this
 * component only lays the data out. Anything the database cannot answer (the
 * revenue card, the two operational alerts) keeps its seeded text and says
 * so with a «داده نمونه» badge rather than posing as live.
 */
export default function ConsoleOverview({
  overview,
  onChanged,
}: {
  overview: OverviewData;
  onChanged: () => void;
}) {
  const { stats, reviews, alerts, broadcasts } = overview;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const meta = statMeta[stat.key];
          const Icon = meta.icon;
          /* A placeholder sits out of focus; the badge below stays sharp. */
          const fake = stat.mock ? MOCK_CLASS : "";
          return (
            <div
              key={stat.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`flex items-center justify-between gap-3 ${fake}`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {stat.change}
                </span>
              </div>
              <p
                className={`mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 ${fake}`}
              >
                {stat.value}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className={stat.mock ? MOCK_CLASS : undefined}>{meta.label}</span>
                {stat.mock && <MockBadge />}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Moderation queue — live from the database */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              رویدادهای در انتظار بررسی
            </h2>
            <Link
              href="/console/events"
              className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              مشاهده همه
            </Link>
          </div>
          <div className="overflow-x-auto">
            {reviews.length > 0 ? (
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="bg-slate-50 text-right text-[11px] font-bold uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                    <th className="px-5 py-3">عنوان رویداد</th>
                    <th className="px-5 py-3">برگزارکننده</th>
                    <th className="px-5 py-3">تاریخ</th>
                    <th className="px-5 py-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reviews.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {row.title}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {row.organizer}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{row.date}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${reviewStatusMeta[row.status].tint}`}
                        >
                          {reviewStatusMeta[row.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                رویدادی در انتظار بررسی نیست؛ همه چیز به‌روز است.
              </p>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">هشدارهای سیستم</h2>
          <ul className="mt-4 space-y-3">
            {alerts.map((alert) => {
              /* Same rule as the stats: the fake line is out of focus, its
                 badge is the sharp legend beside it. */
              const fake = alert.mock ? MOCK_CLASS : "";
              return (
                <li
                  key={alert.id}
                  className={`flex items-start gap-2.5 rounded-xl p-3 text-xs leading-6 ${alertTints[alert.level]}`}
                >
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${fake}`} />
                  <span className="min-w-0 flex-1">
                    <span className={alert.mock ? MOCK_CLASS : undefined}>{alert.text}</span>
                    {alert.mock && (
                      <span className="ms-1.5 inline-block align-middle">
                        <MockBadge />
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Global notifications — the send side */}
      <ConsoleBroadcasts broadcasts={broadcasts} onChanged={onChanged} />
    </div>
  );
}
