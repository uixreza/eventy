"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Eye, Inbox, LifeBuoy, MessagesSquare, Search, UserRound } from "lucide-react";
import TicketThreadModal from "@/components/tickets/TicketThreadModal";
import {
  TICKET_STATUSES,
  TICKET_STATUS_BADGES,
  TICKET_STATUS_LABELS,
  TICKET_THREAD_GRID,
  TICKET_THREAD_PANEL_HEIGHT,
  type TicketStatus,
  type TicketView,
} from "@/lib/ticket-types";
import { toFa } from "@/lib/utils";

type Filter = "ALL" | TicketStatus;

/**
 * The admin inbox. Rows and messages both come from
 * `GET /api/console/tickets`; answering, closing and reopening go through
 * Server Actions and then reload this list from the database.
 */
export default function ConsoleTickets({
  rows,
  onChanged,
}: {
  rows: TicketView[];
  onChanged: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  /* Look up in the full list — not the filtered one — so a thread stays
     visible and fresh after a status change moves it to another pill. */
  const selected = rows.find((ticket) => ticket.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim();
    return rows.filter((ticket) => {
      if (filter !== "ALL" && ticket.status !== filter) return false;
      if (!q) return true;
      return [
        ticket.subject,
        ticket.owner.name,
        ticket.owner.phone,
        ...ticket.messages.map((message) => message.body),
      ]
        .join(" ")
        .includes(q);
    });
  }, [filter, query, rows]);

  function countFor(value: Filter): number {
    return value === "ALL" ? rows.length : rows.filter((ticket) => ticket.status === value).length;
  }

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
              تیکت
            </h1>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
              {toFa(visible.length)} از {toFa(rows.length)} تیکت · {toFa(countFor("OPEN"))} در انتظار ·{" "}
              {toFa(countFor("CLOSED"))} بسته شده
            </p>
          </div>
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در تیکت یا کاربر..."
            aria-label={"جستجوی تیکت\u200cها"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 ps-9 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600"
          />
        </div>
      </div>

      {/* ── Status filters ─────────────────────────────── */}
      <div role="tablist" aria-label={"فیلتر تیکت\u200cها"} className="flex flex-wrap gap-2">
        {(["ALL", ...TICKET_STATUSES] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all duration-200 sm:text-xs ${
              filter === value
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
            }`}
          >
            {value === "ALL" ? "همه" : TICKET_STATUS_LABELS[value]} ({toFa(countFor(value))})
          </button>
        ))}
      </div>

      {/* ── List + docked thread ──────────────────────── */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
            تیکت تازه‌ای وجود ندارد
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            پس از ایجاد نخستین تیکت توسط کاربران، اینجا نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <div className={TICKET_THREAD_GRID}>
          {/* Right column (RTL): the list */}
          <div className="min-w-0">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  تیکت مطابقی پیدا نشد
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  عبارت یا فیلتر دیگری را امتحان کنید.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map((ticket) => {
                  const last = ticket.messages[ticket.messages.length - 1];
                  return (
                    <li
                      key={ticket.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                              {ticket.subject}
                            </h2>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${TICKET_STATUS_BADGES[ticket.status]}`}
                            >
                              {ticket.statusLabel}
                            </span>
                          </div>
                          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                            <UserRound className="h-3 w-3" />
                            {ticket.owner.name} · <span dir="ltr">{ticket.owner.phone}</span>
                          </p>
                          <p className="mt-2.5 line-clamp-2 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                            {last?.body}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <time className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                            {ticket.updatedAt}
                          </time>
                          <button
                            type="button"
                            onClick={() => setSelectedId(ticket.id)}
                            aria-label={` باز کردن تیکت ${ticket.subject}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            باز کردن
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Left column (RTL): messages, or a quiet prompt until one is picked */}
          <div className="hidden lg:block">
            {selected ? (
              <TicketThreadModal
                ticket={selected}
                isAdmin
                inline
                onClose={() => setSelectedId(null)}
                onChanged={onChanged}
              />
            ) : (
              <div
                className={`${TICKET_THREAD_PANEL_HEIGHT} flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900`}
              >
                <MessagesSquare className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  تیکتی را انتخاب کنید
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  پیام‌ها و پاسخ‌های تیکت در اینجا نمایش داده می‌شود.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Below lg the docked panel disappears and the sheet takes over. */}
      <AnimatePresence>
        {selected && (
          <TicketThreadModal
            ticket={selected}
            isAdmin
            onClose={() => setSelectedId(null)}
            onChanged={onChanged}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
