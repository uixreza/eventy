/**
 * Skeleton loading states for the public events pages.
 *
 * Each skeleton mirrors the layout of the view it stands in for — same
 * container, same heading, same grid — so the page paints its final shape
 * instantly (even in the prerendered shell, before hydration) and the real
 * rows drop into place when the fetch lands. Same convention as
 * `components/dashboard/Skeletons.tsx`.
 */

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
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";

/** One card of the `/events` results grid. */
function EventCardSkeleton() {
  return (
    <div className={`${cardClass} flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4`}>
      {/* Thumbnail: full-width banner on mobile, fixed column from sm up */}
      <Sk className="h-36 w-full rounded-xl sm:h-auto sm:w-40 sm:self-stretch lg:w-44" />

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Sk className="h-4 w-2/3 rounded-md" />
        <Sk className="h-3.5 w-full rounded-md" />
        <Sk className="h-3.5 w-3/5 rounded-md" />

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Sk className="h-3 w-24 rounded-md" />
            <Sk className="h-2.5 w-32 rounded-md" />
          </div>
          <Sk className="h-8 w-24 shrink-0 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** The `/events` list: heading, banner, filter bar and the results grid. */
export function EventsListSkeleton() {
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری رویدادها"
      className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8"
    >
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full">
          <Sk className="h-7 w-52 rounded-full" />
          <Sk className="mt-3 h-9 w-64 rounded-xl" />
          <Sk className="mt-3 h-4 w-80 max-w-full rounded-md" />
        </div>
      </div>

      {/* Top events slideshow */}
      <section aria-label="رویدادهای برتر" className="mt-6">
        <Sk className="mb-2.5 h-6 w-36 rounded-full sm:hidden" />
        <Sk className="h-72 w-full rounded-3xl sm:h-80 lg:h-96" />
      </section>

      {/* Filters */}
      <section
        aria-label="فیلتر رویدادها"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Sk className="mb-1.5 h-3 w-10 rounded-md" />
            <Sk className="h-10 w-full rounded-xl" />
          </div>
          {["lg:w-44", "lg:w-40", "lg:w-36"].map((width) => (
            <div key={width} className={width}>
              <Sk className="mb-1.5 h-3 w-14 rounded-md" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Sk className="mb-2.5 h-3 w-20 rounded-md" />
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((chip) => (
              <Sk key={chip} className="h-7 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section aria-label="فهرست رویدادها" className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Sk className="h-4 w-28 rounded-md" />
          <Sk className="h-8 w-40 rounded-xl" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <EventCardSkeleton key={card} />
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * `/events/[slug]`: hero, quick facts, body and booking card. Used both as
 * the shell's streaming fallback and while the client fetch is in flight —
 * the two look identical, so the swap is invisible.
 */
export function EventDetailSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری رویداد" className="mt-4 animate-pulse">
      <div aria-hidden="true" className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800 sm:h-72" />

      <div aria-hidden="true" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <div
            key={tile}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900 sm:p-4"
          >
            <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6"
      >
        <div className="space-y-5">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6"
            >
              <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 space-y-2.5">
                <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-11/12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:mt-0">
          <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2.5 h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
