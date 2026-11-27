"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Flag, Search, UserRound } from "lucide-react";
import type { AdminEventReport } from "@/lib/event-report-types";
import { toFa } from "@/lib/utils";

/**
 * The managers' inbox of visitor reports. Rows arrive from
 * `GET /api/console/event-reports`; the only local state is the search box,
 * since this page has no mutations — a report is read-only once sent.
 */
export default function ConsoleEventReports({ rows }: { rows: AdminEventReport[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((report) =>
      [report.event.title, report.reporter.name, report.reporter.phone, report.reasonLabel]
        .join(" ")
        .includes(q),
    );
  }, [query, rows]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            گزارش رویدادها
          </h1>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
            {toFa(visible.length)} از {toFa(rows.length)} گزارش بازدیدکنندگان درباره رویدادها.
          </p>
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در رویداد یا کاربر..."
            aria-label="جستجوی گزارش رویدادها"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 ps-9 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <Flag className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
            {rows.length === 0 ? "گزارش تازه‌ای وجود ندارد" : "گزارشی مطابقی پیدا نشد"}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {rows.length === 0
              ? "پس از ارسال نخستین گزارش توسط بازدیدکنندگان، اینجا نمایش داده می‌شود."
              : "عبارت دیگری را امتحان کنید."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((report) => (
            <li
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                    <Flag className="h-3 w-3" />
                    {report.reasonLabel}
                  </span>
                  <p className="mt-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    <Link
                      href={`/events/${encodeURIComponent(report.event.slug)}`}
                      target="_blank"
                      className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {report.event.title}
                    </Link>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <UserRound className="h-3 w-3" />
                    {report.reporter.name} · {report.reporter.phone}
                  </p>
                </div>
                <time className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  {report.createdAt}
                </time>
              </div>
              {report.message && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  {report.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
