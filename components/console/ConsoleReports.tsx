"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Download, Users } from "lucide-react";
import { sileo } from "sileo";
import MockBadge from "./MockBadge";
import { MOCK_CLASS } from "./mock";
import type {
  ConsoleReports as ReportData,
  ReportDay,
  ReportRange,
} from "@/lib/report-types";
import { faNumber, toFa } from "@/lib/utils";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const headingClass = "text-sm font-bold text-slate-800 dark:text-slate-100";

const rangeOptions: { days: ReportRange; label: string }[] = [
  { days: 7, label: "۷ روز اخیر" },
  { days: 30, label: "۳۰ روز اخیر" },
  { days: 90, label: "۹۰ روز اخیر" },
];

const statMeta = {
  visitors: {
    label: "بازدیدکنندگان",
    icon: Users,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  signups: {
    label: "ثبت‌نام‌های جدید",
    icon: CalendarDays,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  fill: {
    label: "نرخ تکمیل ظرفیت",
    icon: ArrowUpRight,
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  revenue: {
    label: "درآمد خالص (تومان)",
    icon: ArrowDownLeft,
    tint: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
  },
} as const;

type StatKey = keyof typeof statMeta;
type Tone = "up" | "down" | "flat";

const toneClass: Record<Tone, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-500 dark:text-red-400",
  flat: "text-slate-500 dark:text-slate-400",
};

/** How many bars the chart draws, whatever the range. */
const BAR_COUNT = 7;

function total(days: ReportDay[]): number {
  return days.reduce((sum, day) => sum + day.count, 0);
}

/** Splits the window into `BAR_COUNT` contiguous runs of days. */
function bucketize(days: ReportDay[]) {
  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const start = Math.floor((index * days.length) / BAR_COUNT);
    const end = Math.floor(((index + 1) * days.length) / BAR_COUNT);
    const slice = days.slice(start, end);
    return { label: slice[0]?.date ?? "", count: total(slice) };
  });
}

/**
 * `/console/reports` — the analytics page.
 *
 * The loader fetched `GET /api/console/reports`, which reads the tables on
 * each visit: the daily signup series, the fill rate, the category share and
 * the top events are all live. The range pills only re-slice the daily
 * series in the browser — the payload already carries 180 days, so switching
 * a window is instant and the change figure always has its previous period
 * to compare against.
 *
 * Two cards stay seeded because nothing records them: page views and
 * payments. They are blurred and wear the «داده نمونه» badge, exactly like
 * the mock items on the console home.
 */
export default function ConsoleReports({ report }: { report: ReportData }) {
  const [range, setRange] = useState<ReportRange>(30);
  const { daily, fill, share, topEvents, visitors, revenue } = report;

  const windowDays = useMemo(() => daily.slice(-range), [daily, range]);
  const previousDays = useMemo(
    () => daily.slice(-range * 2, -range),
    [daily, range],
  );

  const signups = total(windowDays);
  const before = total(previousDays);
  const changePct =
    before > 0 ? Math.round(((signups - before) / before) * 100) : null;

  const stats: {
    key: StatKey;
    value: string;
    change: string;
    tone: Tone;
    mock: boolean;
  }[] = [
    { key: "visitors", ...visitors, tone: "up", mock: true },
    {
      key: "signups",
      value: faNumber(signups),
      change:
        changePct === null
          ? signups > 0
            ? "جدید"
            : "۰"
          : `${changePct >= 0 ? "+" : "-"}${toFa(Math.abs(changePct))}٪`,
      tone: changePct === null ? "flat" : changePct >= 0 ? "up" : "down",
      mock: false,
    },
    { key: "fill", ...fill, tone: "flat", mock: false },
    { key: "revenue", ...revenue, tone: "up", mock: true },
  ];

  const bars = useMemo(() => bucketize(windowDays), [windowDays]);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const rangeLabel =
    rangeOptions.find((option) => option.days === range)?.label ?? "";

  function handleExport() {
    const rows: string[][] = [
      ["بخش", "عنوان", "مقدار"],
      ["آمار", "ثبت‌نام‌های جدید", faNumber(signups)],
      ["آمار", "نرخ تکمیل ظرفیت", fill.value],
      ["آمار", "بازدیدکنندگان (نمونه)", visitors.value],
      ["آمار", "درآمد خالص (نمونه)", revenue.value],
      ...bars.map((bar) => ["ثبت‌نام بازه", bar.label, faNumber(bar.count)]),
      ...share.map((item) => ["سهم دسته‌بندی", item.label, `${toFa(item.percent)}٪`]),
      ...topEvents.map((event) => [
        "رویداد برتر",
        event.title,
        `${event.registrations} ثبت‌نام`,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kooja-report-${range}d.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    sileo.success({
      title: "گزارش دانلود شد",
      description: `فایل CSV گزارش ${rangeLabel} آماده است.`,
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Heading + range/export ──────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            گزارش‌ها و تحلیل‌ها
          </h1>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
            ثبت‌نام‌ها، ظرفیت و دسته‌بندی‌ها از دیتابیس خوانده می‌شوند؛ بازدید و درآمد هنوز
            داده نمونه‌اند.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            {rangeOptions.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setRange(option.days)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors duration-200 ${
                  range === option.days
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
          >
            <Download className="h-4 w-4" />
            خروجی CSV
          </button>
        </div>
      </div>

      {/* ── Summary stats ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const meta = statMeta[stat.key];
          const Icon = meta.icon;
          /* A seeded figure sits out of focus; the badge below stays sharp. */
          const fake = stat.mock ? MOCK_CLASS : "";
          return (
            <div key={stat.key} className={cardClass}>
              <div className={`flex items-start justify-between gap-3 ${fake}`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`max-w-[65%] text-end text-[11px] font-bold leading-5 ${toneClass[stat.tone]}`}
                >
                  {stat.tone !== "flat" &&
                    (stat.tone === "up" ? (
                      <ArrowUpRight className="me-0.5 inline h-3.5 w-3.5 align-[-2px]" />
                    ) : (
                      <ArrowDownLeft className="me-0.5 inline h-3.5 w-3.5 align-[-2px]" />
                    ))}
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

      <div className="grid gap-5 xl:grid-cols-3">
        {/* ── Signups bar chart (live) ──────────────────────── */}
        <div className={`${cardClass} xl:col-span-2`}>
          <div className="flex items-center justify-between">
            <h2 className={headingClass}>ثبت‌نام کاربران</h2>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              {rangeLabel}
            </span>
          </div>
          {signups === 0 && (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              در {rangeLabel} هیچ ثبت‌نامی انجام نشده است؛ نمودار با اولین ثبت‌نام پر
              می‌شود.
            </p>
          )}
          <div className="mt-5 flex gap-2 sm:gap-3">
            {bars.map((bar, index) => (
              <div
                key={`${bar.label}-${index}`}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              >
                <div className="flex h-40 w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 hover:from-blue-700 hover:to-blue-500"
                    style={{
                      height:
                        bar.count === 0
                          ? 0
                          : `${Math.max(4, Math.round((bar.count / maxBar) * 100))}%`,
                    }}
                    title={`${bar.label}: ${toFa(bar.count)} ثبت‌نام`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {toFa(bar.count)}
                </span>
                <span className="w-full truncate text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Category share (live) ─────────────────────────── */}
        <div className={cardClass}>
          <h2 className={headingClass}>سهم دسته‌بندی‌ها</h2>
          {share.length > 0 ? (
            <ul className="mt-4 space-y-3.5">
              {share.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      {toFa(item.percent)}٪
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              رویداد منتشرشده‌ای برای دسته‌بندی وجود ندارد.
            </p>
          )}
        </div>
      </div>

      {/* ── Top events (live) ───────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className={headingClass}>رویدادهای برتر از نظر ثبت‌نام</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-right text-[11px] font-bold uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                <th className="px-5 py-3">عنوان رویداد</th>
                <th className="px-5 py-3">شهر</th>
                <th className="px-5 py-3">ثبت‌نام</th>
                <th className="px-5 py-3">تکمیل ظرفیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {topEvents.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                >
                  <td className="max-w-[300px] px-5 py-3.5">
                    <p className="truncate font-semibold text-slate-700 dark:text-slate-300">
                      {row.title}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{row.city}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                    {row.registrations}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                    {row.fill}
                  </td>
                </tr>
              ))}
              {topEvents.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    رویداد منتشرشده‌ای وجود ندارد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
