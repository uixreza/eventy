"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Eye, Inbox, LifeBuoy, MessagesSquare, Plus, Search } from "lucide-react";
import TicketCreateDialog from "@/components/tickets/TicketCreateDialog";
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
 * The signed-in client's support inbox. Every row is a real `SupportTicket`
 * row delivered by `GET /api/dashboard/tickets` — no local sample data. The
 * selected thread is looked up in the full list, so it stays fresh after a
 * reply even when the status filter would hide the row.
 */
export default function DashboardTickets({
  rows,
  onChanged,
}: {
  rows: TicketView[];
  onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const selected = rows.find((ticket) => ticket.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim();
    return rows.filter((ticket) => {
      if (filter !== "ALL" && ticket.status !== filter) return false;
      if (!q) return true;
      return [ticket.subject, ...ticket.messages.map((message) => message.body)]
        .join(" ")
        .includes(q);
    });
  }, [filter, query, rows]);

  function countFor(value: Filter): number {
    return value === "ALL" ? rows.length : rows.filter((ticket) => ticket.status === value).length;
  }

  const openCount = countFor("OPEN");

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              تیکت
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {toFa(rows.length)} تیکت دارید؛ {toFa(openCount)} تیکت در انتظار پاسخ است.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          ساخت تیکت
        </button>
      </div>

      {/* ── Filters + search ───────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={"جستجو در تیکت\u200cها..."}
            aria-label={"جستجوی تیکت\u200cها"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 ps-9 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-600"
          />
        </div>
      </div>

      {/* ── List + docked thread ──────────────────────── */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
            هنوز تیکتی ندارید
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            با ساخت نخستین تیکت، پیام خود را به پشتیبانی برسانید.
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
                    <li key={ticket.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(ticket.id)}
                        aria-label={`مشاهده تیکت ${ticket.subject}`}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-md transition-all duration-200 hover:border-blue-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-900"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                              {ticket.subject}
                            </h2>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                              {last?.body}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${TICKET_STATUS_BADGES[ticket.status]}`}
                          >
                            {ticket.statusLabel}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                          <span>
                            ایجاد {ticket.createdAt} · آخرین پیام {ticket.updatedAt}
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                            <Eye className="h-3.5 w-3.5" />
                            مشاهده و پاسخ
                          </span>
                        </div>
                      </button>
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
                isAdmin={false}
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

      {/* ── Dialogs ────────────────────────────────────── */}
      <AnimatePresence>
        {creating && (
          <TicketCreateDialog
            onClose={() => setCreating(false)}
            onCreated={onChanged}
          />
        )}
      </AnimatePresence>
      {/* Below lg the docked panel disappears and the sheet takes over. */}
      <AnimatePresence>
        {selected && (
          <TicketThreadModal
            ticket={selected}
            isAdmin={false}
            onClose={() => setSelectedId(null)}
            onChanged={onChanged}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
