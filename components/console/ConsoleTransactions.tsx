"use client";

import { useMemo, useState } from "react";
import { Download, Receipt, RotateCcw, Search, Wallet } from "lucide-react";
import { sileo } from "sileo";
import {
  consoleTransactions,
  transactionStatusMeta,
  type ConsoleTransactionStatus,
} from "@/lib/console-data";
import { MOCK_CLASS } from "./mock";
import { faPrice, toFa } from "@/lib/utils";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const tableCardClass =
  "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const filterClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

const statusFilters = [
  { key: "all", label: "همه" },
  { key: "paid", label: "پرداخت‌شده" },
  { key: "pending", label: "در انتظار تسویه" },
  { key: "refunded", label: "بازگشت‌شده" },
] as const;

export default function ConsoleTransactions() {
  const [statuses, setStatuses] = useState<Record<string, ConsoleTransactionStatus>>(
    Object.fromEntries(consoleTransactions.map((t) => [t.id, t.status])),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof statusFilters)[number]["key"]>("all");

  const rows = useMemo(() => {
    const q = query.trim();
    return consoleTransactions.filter((tx) => {
      if (filter !== "all" && statuses[tx.id] !== filter) return false;
      if (!q) return true;
      return tx.buyer.includes(q) || tx.event.includes(q) || tx.code.includes(q);
    });
  }, [query, filter, statuses]);

  function refund(tx: (typeof consoleTransactions)[number]) {
    setStatuses((prev) => ({ ...prev, [tx.id]: "refunded" }));
    sileo.success({
      title: `بازگشت وجه ${tx.code}`,
      description: tx.amount === 0 ? "این ثبت‌نام رایگان بود." : `${faPrice(tx.amount)} به ${tx.buyer} بازگردانده شد.`,
    });
  }

  const sumByStatus = (status: ConsoleTransactionStatus) =>
    consoleTransactions
      .filter((tx) => statuses[tx.id] === status)
      .reduce((sum, tx) => sum + tx.amount, 0);

  const summary = [
    {
      label: "کل دریافتی",
      value: faPrice(sumByStatus("paid")),
      icon: Wallet,
      tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      label: "در انتظار تسویه",
      value: faPrice(sumByStatus("pending")),
      icon: Receipt,
      tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      label: "بازگشت‌شده",
      value: faPrice(sumByStatus("refunded")),
      icon: RotateCcw,
      tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Heading + export ────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            تراکنش‌ها
          </h1>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
            {toFa(rows.length)} تراکنش از {toFa(consoleTransactions.length)} مورد؛ تسویه و بازگشت
            وجه را پیگیری کنید.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            sileo.success({
              title: "گزارش مالی آماده شد",
              description: "فایل تراکنش‌ها به‌صورت CSV دانلود می‌شود.",
            })
          }
          className="flex w-fit items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
        >
          <Download className="h-4 w-4" />
          خروجی CSV
        </button>
      </div>

      {/* ── Summary ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summary.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${cardClass} ${MOCK_CLASS}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Search + filters ────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-200 ${
                filter === item.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در کد، خریدار یا رویداد..."
            aria-label="جستجوی تراکنش‌ها"
            className={`${filterClass} ps-9`}
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className={`${tableCardClass} ${MOCK_CLASS}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-right text-[11px] font-bold uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                <th className="px-5 py-3">کد تراکنش</th>
                <th className="px-5 py-3">خریدار</th>
                <th className="px-5 py-3">رویداد</th>
                <th className="px-5 py-3">مبلغ</th>
                <th className="px-5 py-3">تاریخ</th>
                <th className="px-5 py-3">وضعیت</th>
                <th className="px-5 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((tx) => {
                const status = transactionStatusMeta[statuses[tx.id]];
                return (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                  >
                    <td dir="ltr" className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-300">
                      {tx.code}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {tx.buyer}
                    </td>
                    <td className="max-w-[240px] px-5 py-3.5">
                      <p className="truncate text-slate-500 dark:text-slate-400">{tx.event}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                      {tx.amount === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">رایگان</span>
                      ) : (
                        faPrice(tx.amount)
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{tx.date}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tint}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => refund(tx)}
                        disabled={statuses[tx.id] === "refunded" || tx.amount === 0}
                        aria-label={`بازگشت وجه ${tx.code}`}
                        title="بازگشت وجه"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-900"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        بازگشت
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    تراکنشی با این فیلتر پیدا نشد.
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
