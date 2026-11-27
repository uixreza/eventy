/**
 * Skeleton loading states for the dashboard routes.
 *
 * Each skeleton mirrors the layout of the view it stands in for — same
 * cards, same grid, same header — so the page paints its final shape
 * instantly (even in the prerendered shell, before hydration) and the
 * real rows drop into place when the fetch lands.
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

const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900";

/** The dashboard overview: greeting, four stats, upcoming list, quick links. */
export function OverviewSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری اطلاعات داشبورد" className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Sk className="h-7 w-56 rounded-xl" />
          <Sk className="h-4 w-72 rounded-md" />
        </div>
        <Sk className="h-10 w-44 rounded-xl" />
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={`${cardClass} p-4 sm:p-5`}>
            <Sk className="h-9 w-9 rounded-xl" />
            <Sk className="mt-3 h-7 w-14 rounded-md" />
            <Sk className="mt-2 h-3.5 w-24 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming events */}
        <div className={`${cardClass} overflow-hidden lg:col-span-2`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <Sk className="h-4 w-28 rounded-md" />
            <Sk className="h-3.5 w-16 rounded-md" />
          </div>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 last:border-b-0 dark:border-slate-700"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-4 w-2/3 rounded-md" />
                <Sk className="h-3 w-1/2 rounded-md" />
              </div>
              <Sk className="h-6 w-24 shrink-0 rounded-full" />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className={`${cardClass} p-5`}>
          <Sk className="h-4 w-24 rounded-md" />
          <div className="mt-4 space-y-2.5">
            {[0, 1, 2].map((index) => (
              <Sk key={index} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard sections */}
      <div>
        <Sk className="mb-4 h-5 w-40 rounded-md" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className={`${cardClass} p-5`}>
              <Sk className="h-9 w-9 rounded-xl" />
              <Sk className="mt-3 h-4 w-36 rounded-md" />
              <Sk className="mt-2 h-3.5 w-full rounded-md" />
              <Sk className="mt-1.5 h-3.5 w-2/3 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** «رویدادهای من»: header, heatmap sheet, tabs, event cards. */
export function MyEventsSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری رویدادهای شما" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Sk className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Sk className="h-7 w-44 rounded-xl" />
            <Sk className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <Sk className="h-9 w-36 rounded-xl" />
      </div>

      {/* Heatmap card — four month sheets of day cells */}
      <div className={`${cardClass} p-5`}>
        <Sk className="h-4 w-40 rounded-md" />
        <div className="mt-4 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1.5">
          {Array.from({ length: 28 }, (_, index) => (
            <Sk key={index} className="aspect-square w-full rounded-md" />
          ))}
        </div>
        <div className="mt-4 flex gap-4">
          {[0, 1, 2].map((index) => (
            <Sk key={index} className="h-4 w-16 rounded-md" />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Sk className="h-8 w-32 rounded-full" />
        <Sk className="h-8 w-32 rounded-full" />
      </div>

      {/* Event cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={`${cardClass} flex gap-4 p-4`}>
            <Sk className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <Sk className="h-4 w-2/3 rounded-md" />
              <Sk className="h-3 w-3/4 rounded-md" />
              <Sk className="h-3 w-1/2 rounded-md" />
            </div>
            <div className="flex shrink-0 gap-2">
              <Sk className="h-8 w-8 rounded-xl" />
              <Sk className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** «علاقه‌مندی‌ها»: header, category tabs, saved-event cards. */
export function SavedSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری علاقه‌مندی‌ها" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Sk className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Sk className="h-7 w-44 rounded-xl" />
            <Sk className="h-4 w-64 rounded-md" />
          </div>
        </div>
        <Sk className="h-10 w-40 rounded-xl" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <Sk key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center gap-2 px-4 pt-4">
              <Sk className="h-5 w-16 rounded-md" />
              <Sk className="h-5 w-20 rounded-md" />
              <Sk className="ms-auto h-7 w-7 rounded-full" />
            </div>
            <Sk className="mx-4 mt-3 aspect-video w-[calc(100%-2rem)] rounded-xl" />
            <div className="space-y-3 p-4">
              <Sk className="h-3.5 w-32 rounded-md" />
              <Sk className="h-5 w-full rounded-md" />
              <Sk className="h-5 w-2/3 rounded-md" />
              <div className="flex items-center gap-2.5">
                <Sk className="h-8 w-8 rounded-full" />
                <Sk className="h-3 w-28 rounded-md" />
              </div>
            </div>
            <div className="space-y-3 border-t border-slate-200 px-4 py-3.5 dark:border-slate-700">
              <Sk className="h-3.5 w-44 rounded-md" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** «تنظیمات»: title, field card, save row. */
export function SettingsSkeleton() {
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری تنظیمات حساب"
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="space-y-2.5">
        <Sk className="h-7 w-56 rounded-xl" />
        <Sk className="h-4 w-72 rounded-md" />
      </div>

      <div className={`${cardClass} space-y-5 p-6`}>
        {/* Name */}
        <div className="space-y-2">
          <Sk className="h-4 w-28 rounded-md" />
          <Sk className="h-10 w-full rounded-xl" />
        </div>
        {/* Phone */}
        <div className="space-y-2">
          <Sk className="h-4 w-40 rounded-md" />
          <Sk className="h-10 w-full rounded-xl" />
        </div>
        {/* Birth date — three selects */}
        <div className="space-y-2">
          <Sk className="h-4 w-32 rounded-md" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((index) => (
              <Sk key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
        {/* National id */}
        <div className="space-y-2">
          <Sk className="h-4 w-24 rounded-md" />
          <Sk className="h-10 w-full rounded-xl" />
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700">
          <Sk className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** The wizard's real cards carry their own padding; mirror it while loading. */
const wizardCardClass = `${cardClass} p-5 sm:p-6`;

/** The event wizard (new + edit): header, 3-step stepper, photo card, form card, buttons. */
export function WizardSkeleton() {
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری فرم رویداد"
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Sk className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Sk className="h-7 w-48 rounded-xl" />
            <Sk className="h-4 w-64 rounded-md" />
          </div>
        </div>
        <Sk className="h-10 w-44 rounded-xl" />
      </div>

      {/* Stepper — the form has three steps, not five */}
      <nav aria-label="مراحل ثبت رویداد" className={wizardCardClass}>
        <div className="mb-4 sm:hidden">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <Sk className="h-1.5 w-1/3 rounded-full" />
          </div>
          <Sk className="mt-2 h-3 w-24 rounded-md" />
        </div>
        <ol className="hidden items-start sm:flex">
          {[0, 1, 2].map((index) => (
            <li key={index} className="flex flex-1 flex-col items-center gap-2">
              <Sk className="h-10 w-10 rounded-xl" />
              <Sk className="h-3 w-16 rounded-md" />
            </li>
          ))}
        </ol>
      </nav>

      {/* Photos — the first card of step 1 */}
      <div className={wizardCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sk className="h-8 w-8 rounded-xl" />
            <div className="space-y-2">
              <Sk className="h-4 w-28 rounded-md" />
              <Sk className="h-3 w-64 rounded-md" />
            </div>
          </div>
          <Sk className="h-6 w-14 rounded-lg" />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {[0, 1, 2].map((index) => (
            <Sk key={index} className="h-24 w-24 rounded-xl" />
          ))}
          <div className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40">
            <Sk className="h-5 w-5 rounded-md" />
            <Sk className="h-2.5 w-12 rounded-md" />
          </div>
        </div>

        <Sk className="mt-3 h-3 w-64 rounded-md" />
      </div>

      {/* Basics */}
      <div className={wizardCardClass}>
        <div className="mb-5 flex items-center gap-2.5">
          <Sk className="h-8 w-8 rounded-xl" />
          <Sk className="h-4 w-28 rounded-md" />
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Sk className="h-4 w-28 rounded-md" />
            <Sk className="h-10 w-full rounded-xl" />
            <Sk className="h-3 w-24 rounded-md" />
          </div>

          {/* Category + capacity */}
          <div className="grid gap-5 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <div key={index} className="space-y-2">
                <Sk className="h-4 w-28 rounded-md" />
                <Sk className="h-10 w-full rounded-xl" />
                <Sk className="h-3 w-40 rounded-md" />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Sk className="h-4 w-28 rounded-md" />
            <Sk className="h-24 w-full rounded-xl" />
            <Sk className="h-3 w-24 rounded-md" />
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Sk className="h-4 w-40 rounded-md" />
              <Sk className="h-7 w-24 rounded-lg" />
            </div>
            {[0, 1].map((index) => (
              <Sk key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Sk className="h-4 w-24 rounded-md" />
              <Sk className="h-7 w-24 rounded-lg" />
            </div>
            {[0, 1].map((index) => (
              <div
                key={index}
                className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-2"
              >
                <Sk className="h-10 w-full rounded-xl" />
                <Sk className="h-10 w-full rounded-xl" />
                <Sk className="h-10 w-10 rounded-xl" />
              </div>
            ))}
          </div>

          {/* Ticket type */}
          <div className="space-y-2">
            <Sk className="h-4 w-20 rounded-md" />
            <div className="flex gap-2">
              <Sk className="h-10 w-20 rounded-xl" />
              <Sk className="h-10 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Step navigation */}
      <div className={`${cardClass} flex items-center justify-between gap-3 p-4`}>
        <Sk className="h-10 w-28 rounded-xl" />
        <Sk className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

/** «اعلان‌ها»: header, filter pills, then the grouped cards. */
export function NotificationsSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری اعلان‌ها" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Sk className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Sk className="h-7 w-32 rounded-xl" />
            <Sk className="h-4 w-52 rounded-md" />
          </div>
        </div>
        <Sk className="h-10 w-56 rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[0, 1].map((index) => (
          <Sk key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Grouped rows */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Sk className="h-3.5 w-16 rounded-md" />
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`${cardClass} flex items-start gap-3 p-4`}
            >
              <Sk className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <Sk className="h-4 w-2/3 rounded-md" />
                <Sk className="h-3.5 w-full rounded-md" />
                <Sk className="h-3 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** «تیکت»: header, status pills, search row, then the conversation cards. */
export function TicketsSkeleton() {
  return (
    <div role="status" aria-label={"در حال بارگذاری تیکت\u200cها"} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Sk className="h-11 w-11 rounded-2xl" />
          <div className="space-y-2">
            <Sk className="h-7 w-28 rounded-xl" />
            <Sk className="h-4 w-64 rounded-md" />
          </div>
        </div>
        <Sk className="h-10 w-32 rounded-xl" />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((index) => (
            <Sk key={index} className="h-7 w-24 rounded-full" />
          ))}
        </div>
        <Sk className="h-10 w-full rounded-xl lg:w-72" />
      </div>

      {/* List + docked thread — same proportions as the loaded view */}
      <div className={TICKET_THREAD_GRID}>
        <div className="min-w-0 space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className={`${cardClass} space-y-3 p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Sk className="h-4 w-2/3 rounded-md" />
                  <Sk className="h-3.5 w-full rounded-md" />
                  <Sk className="h-3.5 w-4/5 rounded-md" />
                </div>
                <Sk className="h-6 w-20 shrink-0 rounded-full" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <Sk className="h-3 w-48 rounded-md" />
                <Sk className="h-3 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        <div className={`${TICKET_THREAD_PANEL_HEIGHT} ${cardClass} hidden flex-col overflow-hidden lg:flex`}>
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
