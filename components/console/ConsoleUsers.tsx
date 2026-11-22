"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Ban, CheckCircle2, Eye, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { normalizeDigits, toFa } from "@/lib/utils";
import {
  userRoleMeta,
  userStatusMeta,
  type ConsoleUserRow,
  type ConsoleUserStatus,
} from "@/lib/user-types";
import ConsoleUserDetailModal from "./ConsoleUserDetailModal";
import { useUserActions } from "./useUserActions";

const cardClass =
  "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
const filterClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-600";

const statusFilters = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "banned", label: "مسدود" },
] as const;

const roleFilters = [
  { key: "all", label: "همه" },
  { key: "ADMIN", label: "مدیر" },
  { key: "USER", label: "کاربر" },
] as const;

/**
 * The clients table of `/console/users`. Rows come from
 * `GET /api/console/users` (see `ConsoleUsersLoader`); every move —
 * promoting, demoting, blocking, restoring — runs through the shared
 * action hook, confirms first, and on success calls the loader's
 * `onChanged`, so the table always shows the current database state.
 * «جزئیات» opens the full-account modal.
 */
export default function ConsoleUsers({
  rows,
  me,
  onChanged,
}: {
  rows: ConsoleUserRow[];
  /** The acting admin — their own row is fenced off from both actions. */
  me: string;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]["key"]>("all");
  const [role, setRole] = useState<(typeof roleFilters)[number]["key"]>("all");
  /** The account whose full detail modal is open, if any. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const { pending, changeRole, toggleBan } = useUserActions(onChanged);

  const visible = useMemo(() => {
    const q = query.trim();
    const digits = normalizeDigits(q);
    return rows.filter((user) => {
      const userStatus: ConsoleUserStatus = user.bannedAt ? "banned" : "active";
      if (status !== "all" && userStatus !== status) return false;
      if (role !== "all" && user.role !== role) return false;
      if (!q) return true;
      /* Digits are compared normalized, so «۰۹۱۲…» finds a stored
         «0912…» and «۱۲۳۴» finds a national-id-style query. */
      return (
        user.name.includes(q) ||
        user.phone.includes(q) ||
        normalizeDigits(user.phone).includes(digits) ||
        userRoleMeta[user.role].label.includes(q)
      );
    });
  }, [query, status, role, rows]);

  return (
    <div className="space-y-5">
      {/* ── Heading + search ────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            کاربران و اعضا
          </h1>
          <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
            {toFa(visible.length)} حساب از {toFa(rows.length)} عضو؛ نقش و وضعیت را مدیریت
            کنید.
          </p>
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در نام یا شماره..."
            aria-label="جستجوی کاربران"
            className={`${filterClass} ps-9`}
          />
        </div>
      </div>

      {/* ── Status + role filters ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatus(item.key)}
            aria-pressed={status === item.key}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-200 ${
              status === item.key
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
            }`}
          >
            {item.label}
          </button>
        ))}

        <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {roleFilters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setRole(item.key)}
            aria-pressed={role === item.key}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-200 ${
              role === item.key
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
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-right text-[11px] font-bold uppercase text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
                <th className="px-5 py-3">عضو</th>
                <th className="px-5 py-3">شماره</th>
                <th className="px-5 py-3">نقش</th>
                <th className="px-5 py-3">تاریخ عضویت</th>
                <th className="px-5 py-3">رویدادها</th>
                <th className="px-5 py-3">ثبت‌نام‌ها</th>
                <th className="px-5 py-3">وضعیت</th>
                <th className="px-5 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((user) => {
                const roleMeta = userRoleMeta[user.role];
                const statusMeta = userStatusMeta[user.bannedAt ? "banned" : "active"];
                const isSelf = user.id === me;
                const target = {
                  id: user.id,
                  name: user.name,
                  role: user.role,
                  banned: user.bannedAt !== null,
                };
                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {user.name.trim().charAt(0)}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {user.name}
                          {isSelf && (
                            <span className="ms-1.5 text-[10px] font-normal text-slate-400 dark:text-slate-500">
                              (شما)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td
                      dir="ltr"
                      className="px-5 py-3.5 text-right tracking-widest text-slate-500 dark:text-slate-400"
                    >
                      {toFa(user.phone)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${roleMeta.tint}`}
                      >
                        {user.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{user.joined}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                      {toFa(user.eventCount)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                      {toFa(user.registrationCount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.tint}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailId(user.id)}
                          aria-label={`جزئیات ${user.name}`}
                          title="جزئیات"
                          className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            changeRole(target, user.role === "ADMIN" ? "USER" : "ADMIN")
                          }
                          disabled={pending || isSelf}
                          aria-label={`${user.role === "ADMIN" ? "عزل" : "ارتقا"} ${user.name}`}
                          title={
                            isSelf
                              ? "خودتان را نمی‌توانید تغییر دهید"
                              : user.role === "ADMIN"
                                ? "عزل از مدیریت"
                                : "ارتقا به مدیر"
                          }
                          className="rounded-lg p-1.5 text-purple-600 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-purple-950"
                        >
                          {user.role === "ADMIN" ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBan(target)}
                          disabled={pending || isSelf}
                          aria-label={`${user.bannedAt ? "رفع مسدودی" : "مسدودسازی"} ${user.name}`}
                          title={
                            isSelf
                              ? "خودتان را نمی‌توانید مسدود کنید"
                              : user.bannedAt
                                ? "رفع مسدودی"
                                : "مسدودسازی"
                          }
                          className={`rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            user.bannedAt
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                          }`}
                        >
                          {user.bannedAt ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    کاربری با این فیلتر پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* The full-account dialog — profile, hosted events, tickets, and the
          role/ban actions an admin reads it all for. */}
      <AnimatePresence>
        {detailId && (
          <ConsoleUserDetailModal
            id={detailId}
            me={me}
            onClose={() => setDetailId(null)}
            onChanged={onChanged}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
