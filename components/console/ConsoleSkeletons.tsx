/**
 * Skeleton loading states for the console's moderation queue.
 *
 * Each skeleton mirrors the layout of the view it stands in for — same
 * heading, same filter pills, same table (or modal) — so the page paints
 * its final shape instantly and the real rows drop into place when the
 * fetch lands. Same convention as `components/dashboard/Skeletons.tsx`.
 */

import {
  TICKET_THREAD_GRID,
  TICKET_THREAD_PANEL_HEIGHT,
} from "@/lib/ticket-types";

/** One pulsing block. `className` sets the size and placement. */
function Sk({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}

const HEADERS = [
  "عنوان رویداد",
  "دسته / شهر",
  "تاریخ",
  "قیمت",
  "ظرفیت",
  "وضعیت",
  "عملیات",
];

const USER_HEADERS = [
  "عضو",
  "شماره",
  "نقش",
  "تاریخ عضویت",
  "رویدادها",
  "ثبت‌نام‌ها",
  "وضعیت",
  "عملیات",
];

/** The `/console/events` queue: heading, search, filters and the table. */
export function ConsoleEventsSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری رویدادها" className="space-y-5">
      {/* Heading + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Sk className="h-6 w-48 rounded-xl" />
          <Sk className="mt-2 h-3.5 w-72 rounded-md" />
        </div>
        <Sk className="h-10 w-full rounded-xl lg:w-72" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((pill) => (
          <Sk key={pill} className="h-7 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-right dark:bg-slate-800/60">
                {HEADERS.map((header) => (
                  <th key={header} className="px-5 py-3">
                    <Sk className="h-3.5 w-16 rounded-md" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <tr key={row}>
                  <td className="px-5 py-3.5">
                    <Sk className="h-4 w-36 rounded-md" />
                    <Sk className="mt-1.5 h-3 w-24 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-20 rounded-md" />
                    <Sk className="mt-1.5 h-3 w-16 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-24 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-16 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-20 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-7 w-24 rounded-lg" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** The review modal's body: header, copy blocks, the details grid, actions. */
export function ConsoleEventDetailSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری جزئیات رویداد" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sk className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <Sk className="h-5 w-56 max-w-full rounded-md" />
          <Sk className="mt-2 h-3.5 w-36 rounded-md" />
        </div>
        <Sk className="h-6 w-24 shrink-0 rounded-full" />
      </div>

      {/* Summary + description */}
      <div className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <Sk className="h-4 w-16 rounded-md" />
        <Sk className="h-3.5 w-full rounded-md" />
        <Sk className="h-3.5 w-4/5 rounded-md" />
      </div>
      <div className="space-y-2.5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <Sk className="h-4 w-20 rounded-md" />
        {[0, 1, 2, 3].map((line) => (
          <Sk key={line} className="h-3.5 w-full rounded-md" />
        ))}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
          <div
            key={cell}
            className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700"
          >
            <Sk className="h-3 w-14 rounded-md" />
            <Sk className="mt-2 h-4 w-24 max-w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Sk className="h-10 w-28 rounded-xl" />
        <Sk className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

/** The `/console/users` table: heading, search, filters and the rows. */
export function ConsoleUsersSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری کاربران" className="space-y-5">
      {/* Heading + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Sk className="h-6 w-48 rounded-xl" />
          <Sk className="mt-2 h-3.5 w-72 rounded-md" />
        </div>
        <Sk className="h-10 w-full rounded-xl lg:w-72" />
      </div>

      {/* Filter pills — status group, then role group */}
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((pill) => (
          <Sk key={pill} className="h-7 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-right dark:bg-slate-800/60">
                {USER_HEADERS.map((header) => (
                  <th key={header} className="px-5 py-3">
                    <Sk className="h-3.5 w-16 rounded-md" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <tr key={row}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Sk className="h-8 w-8 shrink-0 rounded-full" />
                      <Sk className="h-4 w-28 rounded-md" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-24 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-24 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-10 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-3.5 w-10 rounded-md" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Sk className="h-7 w-24 rounded-lg" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * The `/console/categories` page: heading, the add-form card (name field,
 * icon picker grid, submit) and the category list beside it.
 */
export function ConsoleCategoriesSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری دسته‌بندی‌ها" className="space-y-5">
      {/* Heading */}
      <div>
        <Sk className="h-6 w-44 rounded-xl" />
        <Sk className="mt-2 h-3.5 w-80 max-w-full rounded-md" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Add form: name field, icon grid, submit */}
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Sk className="h-4 w-24 rounded-md" />
          <Sk className="mt-3 h-3.5 w-20 rounded-md" />
          <Sk className="h-10 w-full rounded-xl" />
          <Sk className="h-3.5 w-24 rounded-md" />
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 16 }, (_, i) => i).map((tile) => (
              <Sk key={tile} className="h-7 rounded-lg" />
            ))}
          </div>
          <Sk className="h-10 w-full rounded-xl" />
          <Sk className="h-3 w-56 rounded-md" />
        </div>

        {/* Category list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Sk className="h-4 w-28 rounded-md" />
            <Sk className="h-5 w-16 rounded-full" />
          </div>
          <ul className="mt-3 space-y-1">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <li key={row} className="flex items-center gap-3 rounded-xl p-3">
                <Sk className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Sk className="h-4 w-36 max-w-full rounded-md" />
                  <Sk className="mt-1.5 h-3 w-16 rounded-md" />
                </div>
                <Sk className="h-5 w-12 rounded-full" />
                <Sk className="h-7 w-7 rounded-lg" />
                <Sk className="h-7 w-7 rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** The client detail modal's body: header, profile grid, both lists, actions. */
export function ConsoleUserDetailSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری جزئیات کاربر" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sk className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Sk className="h-5 w-48 max-w-full rounded-md" />
          <Sk className="mt-2 h-3.5 w-36 rounded-md" />
        </div>
        <Sk className="h-6 w-24 shrink-0 rounded-full" />
      </div>

      {/* Profile grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((cell) => (
          <div
            key={cell}
            className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700"
          >
            <Sk className="h-3 w-16 rounded-md" />
            <Sk className="mt-2 h-4 w-28 max-w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Both lists */}
      {[0, 1].map((section) => (
        <div
          key={section}
          className="space-y-2.5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
        >
          <Sk className="h-4 w-32 rounded-md" />
          {[0, 1, 2].map((line) => (
            <Sk key={line} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ))}

      {/* Footer actions */}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Sk className="h-10 w-32 rounded-xl" />
        <Sk className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
}

/** The `/console` home: stat cards, the review queue, alerts, broadcasts. */
export function ConsoleOverviewSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری کنسول مدیریت" className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <Sk className="h-10 w-10 rounded-xl" />
              <Sk className="h-3 w-20 rounded-md" />
            </div>
            <Sk className="mt-4 h-7 w-24 rounded-md" />
            <Sk className="mt-2.5 h-3.5 w-32 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Review queue */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <Sk className="h-4 w-44 rounded-md" />
            <Sk className="h-3.5 w-20 rounded-md" />
          </div>
          <div className="space-y-3 px-5 py-4">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-4">
                <Sk className="h-4 flex-1 rounded-md" />
                <Sk className="h-4 w-28 rounded-md" />
                <Sk className="h-4 w-16 rounded-md" />
                <Sk className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Sk className="h-4 w-32 rounded-md" />
          <ul className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <li key={item} className="rounded-xl p-3">
                <Sk className="h-9 w-full rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Broadcasts: form + sent list */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Sk className="h-4 w-32 rounded-md" />
            <Sk className="mt-2 h-3 w-72 max-w-full rounded-md" />
          </div>
          <Sk className="h-6 w-28 rounded-full" />
        </div>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-2.5">
            <Sk className="h-3.5 w-20 rounded-md" />
            <Sk className="h-10 w-full rounded-xl" />
            <Sk className="h-3.5 w-16 rounded-md" />
            <Sk className="h-20 w-full rounded-xl" />
            <Sk className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Sk className="h-3.5 w-24 rounded-md" />
            {[0, 1, 2].map((notice) => (
              <Sk key={notice} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The `/console/ads` page: text/link fields and the banner card's controls. */
export function ConsoleAdsSkeleton() {
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری تنظیمات تبلیغات"
      className="grid items-start gap-6 lg:grid-cols-2"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Sk className="h-4 w-48 rounded-md" />
            <Sk className="mt-2 h-3 w-96 max-w-full rounded-md" />
          </div>
          <Sk className="h-6 w-24 rounded-full" />
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <Sk className="h-3.5 w-12 rounded-md" />
            <Sk className="mt-1 h-10 w-full rounded-xl" />
            <Sk className="mt-1 h-3 w-14 rounded-md" />
          </div>
          <div>
            <Sk className="h-3.5 w-24 rounded-md" />
            <Sk className="mt-1 h-10 w-full rounded-xl" />
            <Sk className="mt-1 h-3 w-72 max-w-full rounded-md" />
          </div>
          <div className="flex justify-end gap-2">
            <Sk className="h-8 w-24 rounded-xl" />
            <Sk className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Banner upload card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Sk className="h-4 w-40 rounded-md" />
            <Sk className="mt-2 h-3 w-80 max-w-full rounded-md" />
          </div>
          <Sk className="h-6 w-36 rounded-full" />
        </div>
        <Sk className="mt-4 h-24 w-full rounded-xl" />
        <Sk className="mt-4 h-3.5 w-24 rounded-md" />
        <Sk className="mt-1 h-10 w-full rounded-xl" />
        <Sk className="mt-3 h-3.5 w-28 rounded-md" />
        <Sk className="mt-1 h-10 w-full rounded-xl" />
        <Sk className="mt-1 h-3 w-72 max-w-full rounded-md" />
        <div className="mt-3 flex justify-end gap-2">
          <Sk className="h-8 w-24 rounded-xl" />
          <Sk className="h-8 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** The `/console/reports` page: heading, range pills, stats, chart, table. */
export function ConsoleReportsSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری گزارش‌ها" className="space-y-5">
      {/* Heading + range/export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Sk className="h-6 w-48 rounded-xl" />
          <Sk className="mt-2 h-3.5 w-96 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Sk className="h-9 w-56 rounded-xl" />
          <Sk className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <Sk className="h-10 w-10 rounded-xl" />
              <Sk className="h-3 w-20 rounded-md" />
            </div>
            <Sk className="mt-4 h-7 w-24 rounded-md" />
            <Sk className="mt-2.5 h-3.5 w-32 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="flex items-center justify-between">
            <Sk className="h-4 w-40 rounded-md" />
            <Sk className="h-3 w-20 rounded-md" />
          </div>
          <div className="mt-5 flex gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
              <div key={bar} className="flex flex-1 flex-col items-center gap-2">
                <Sk className="h-32 w-full rounded-t-lg" />
                <Sk className="h-3 w-10 rounded-md" />
                <Sk className="h-2.5 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Category share */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Sk className="h-4 w-32 rounded-md" />
          <div className="mt-4 space-y-3.5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-1.5">
                <Sk className="h-3.5 w-full rounded-md" />
                <Sk className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top events */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <Sk className="h-4 w-52 rounded-md" />
        </div>
        <div className="space-y-3 px-5 py-4">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-4">
              <Sk className="h-4 flex-1 rounded-md" />
              <Sk className="h-4 w-20 rounded-md" />
              <Sk className="h-4 w-14 rounded-md" />
              <Sk className="h-4 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The `/console/tickets` inbox: header, search, status pills, ticket rows. */
export function ConsoleTicketsSkeleton() {
  return (
    <div role="status" aria-label={"در حال بارگذاری تیکت\u200cها"} className="space-y-5">
      {/* Header + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <Sk className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Sk className="h-6 w-28 rounded-xl" />
            <Sk className="h-3.5 w-64 rounded-md" />
          </div>
        </div>
        <Sk className="h-10 w-full rounded-xl lg:w-72" />
      </div>

      {/* Status pills */}
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((pill) => (
          <Sk key={pill} className="h-7 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* List + docked thread — same proportions as the loaded view */}
      <div className={TICKET_THREAD_GRID}>
        <div className="min-w-0 space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2.5">
                  <Sk className="h-4 w-2/3 rounded-md" />
                  <Sk className="h-3 w-40 rounded-md" />
                  <Sk className="h-12 w-full rounded-xl" />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Sk className="h-3 w-28 rounded-md" />
                  <Sk className="h-7 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`${TICKET_THREAD_PANEL_HEIGHT} hidden flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 lg:flex`}
        >
          <div className="flex items-start gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
            <Sk className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Sk className="h-4 w-3/4 rounded-md" />
              <Sk className="h-3 w-1/2 rounded-md" />
            </div>
            <Sk className="h-6 w-20 shrink-0 rounded-full" />
          </div>
          <div className="flex-1 space-y-3 bg-slate-50/70 p-5 dark:bg-slate-950/40">
            <Sk className="h-14 w-4/5 rounded-2xl" />
            <Sk className="ms-auto h-14 w-3/4 rounded-2xl" />
            <Sk className="h-14 w-2/3 rounded-2xl" />
          </div>
          <div className="border-t border-slate-100 p-5 dark:border-slate-800">
            <Sk className="h-3 w-24 rounded-md" />
            <Sk className="mt-2 h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The `/console/settings` page: the live prices card and its mock shell. */
export function ConsoleSettingsSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری تنظیمات" className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Sk className="h-4 w-44 rounded-md" />
            <Sk className="mt-2 h-3 w-80 max-w-full rounded-md" />
          </div>
          <Sk className="h-6 w-24 rounded-full" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Sk className="h-3.5 w-20 rounded-md" />
            <Sk className="mt-2 h-10 w-full rounded-xl" />
          </div>
          <div>
            <Sk className="h-3.5 w-28 rounded-md" />
            <Sk className="mt-2 h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Sk className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <Sk className="h-4 w-40 rounded-md" />
            {[0, 1, 2].map((row) => (
              <Sk key={row} className="mt-4 h-12 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

