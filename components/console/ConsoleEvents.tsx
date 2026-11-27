"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, Eye, MapPin, Search, X } from "lucide-react";
import { sileo } from "sileo";
import { reviewEvent } from "@/app/actions/events";
import { eventLifecycleMeta } from "@/lib/event-types";
import type { ConsoleEventRow } from "@/lib/event-types";
import { faPrice, toFa } from "@/lib/utils";
import ConsoleEventDetailModal from "./ConsoleEventDetailModal";

const cardClass =
  "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const filterClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

const reviewFilters = [
  { key: "all", label: "همه" },
  { key: "PENDING", label: "در انتظار تأیید" },
  { key: "PUBLISHED", label: "منتشر شده" },
  { key: "REJECTED", label: "نیازمند اصلاح" },
] as const;

/**
 * The moderation queue. Rows come from `GET /api/console/events` (see
 * `ConsoleEventsLoader`); after a review the loader's `onChanged` runs the
 * same fetch again, so the table always shows the current database state.
 * «جزئیات» opens the full-event modal — everything an admin reads before
 * approving.
 */
export default function ConsoleEvents({
  rows,
  onChanged,
}: {
  rows: ConsoleEventRow[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof reviewFilters)[number]["key"]>("all");
  /** The event whose full detail modal is open, if any. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim();
    return rows.filter((event) => {
      if (filter !== "all" && event.status !== filter) return false;
      if (!q) return true;
      return (
        event.title.includes(q) ||
        event.organizer.includes(q) ||
        event.city.includes(q) ||
        event.category.includes(q)
      );
    });
  }, [query, filter, rows]);

  function review(row: ConsoleEventRow, approve: boolean) {
    startTransition(async () => {
      const result = await reviewEvent(row.id, approve);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({
        title: `رویداد «${row.title}» ${approve ? "منتشر شد" : "برگردانده شد"}`,
        description: result.message,
      });
      onChanged();
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Heading + search ────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            مدیریت رویدادها
          </h1>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
            {toFa(visible.length)} رویداد از {toFa(rows.length)} مورد؛ تأیید یا برگشت بدهید.
          </p>
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در عنوان، برگزارکننده یا شهر..."
            aria-label="جستجوی رویدادها"
            className={`${filterClass} ps-9`}
          />
        </div>
      </div>

      {/* ── Review filters ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {reviewFilters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            aria-pressed={filter === item.key}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-200 ${
              filter === item.key
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-right text-[11px] font-bold uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                <th className="px-5 py-3">عنوان رویداد</th>
                <th className="px-5 py-3">دسته / شهر</th>
                <th className="px-5 py-3">تاریخ</th>
                <th className="px-5 py-3">قیمت</th>
                <th className="px-5 py-3">ظرفیت</th>
                <th className="px-5 py-3">وضعیت</th>
                <th className="px-5 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((event) => {
                const status = eventLifecycleMeta[event.status];
                return (
                  <tr
                    key={event.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                  >
                    <td className="max-w-[260px] px-5 py-3.5">
                      <p className="truncate font-semibold text-slate-700 dark:text-slate-300">
                        {event.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {event.organizer}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      <span className="block">{event.category}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {event.city}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {event.dateTime}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                      {event.price === null ? (
                        <span className="text-emerald-600 dark:text-emerald-400">رایگان</span>
                      ) : (
                        faPrice(event.price)
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {event.capacity === null
                        ? `${toFa(event.registered)} ثبت‌نام‌شده`
                        : `${toFa(event.registered)} از ${toFa(event.capacity)}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tint}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailId(event.id)}
                          aria-label={`جزئیات ${event.title}`}
                          title="جزئیات"
                          className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => review(event, true)}
                          disabled={pending || event.status === "PUBLISHED"}
                          aria-label={`تأیید ${event.title}`}
                          title="تأیید"
                          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-emerald-950"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => review(event, false)}
                          disabled={pending || event.status === "REJECTED"}
                          aria-label={`درخواست اصلاح ${event.title}`}
                          title="نیازمند اصلاح"
                          className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    رویدادی با این فیلتر پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* The full-event review dialog — everything about one event, so an
          admin can read it all before approving or sending it back. */}
      <AnimatePresence>
        {detailId && (
          <ConsoleEventDetailModal
            id={detailId}
            onClose={() => setDetailId(null)}
            onChanged={onChanged}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
