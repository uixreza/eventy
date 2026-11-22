"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, CheckCircle2, ShieldCheck, ShieldOff, X } from "lucide-react";
import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import { eventLifecycleMeta, registrationStateMeta } from "@/lib/event-types";
import { formatJalaliFull } from "@/lib/jalali";
import { toFa } from "@/lib/utils";
import { userRoleMeta, userStatusMeta } from "@/lib/user-types";
import { fetchConsoleUser } from "./console-api";
import { ConsoleUserDetailSkeleton } from "./ConsoleSkeletons";
import { useUserActions } from "./useUserActions";

type ModalProps = {
  id: string;
  /** The acting admin — their own row is fenced off from both actions. */
  me: string;
  onClose: () => void;
  /** Runs the table's own fetch again after a role or ban result. */
  onChanged: () => void;
};

/** One read-only field of the profile grid. */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{label}</p>
      <div className="mt-1.5 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">
        {children}
      </div>
    </div>
  );
}

/** Section heading inside the modal. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="mt-2.5 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * The client detail dialog of `/console/users`: one account in full,
 * fetched from `GET /api/console/users/[id]` the moment it opens — profile
 * fields, both activity lists, every timestamp — so an admin reads who this
 * person is before changing their role or blocking them. The role and ban
 * actions live in its footer, fenced off from the acting admin's own row.
 */
export default function ConsoleUserDetailModal({
  id,
  me,
  onClose,
  onChanged,
}: ModalProps) {
  const { data, loaded, failed, reload } = useServerData(() => fetchConsoleUser(id));
  const { pending, changeRole, toggleBan } = useUserActions(() => {
    /* The table and this dialog both re-read the database. */
    onChanged();
    reload();
  });

  /* Escape closes the dialog, the way the backdrop click does. */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const target = data
    ? { id: data.id, name: data.name, role: data.role, banned: data.bannedAt !== null }
    : null;
  const isSelf = data?.id === me;

  const role = data ? userRoleMeta[data.role] : null;
  const status = data
    ? userStatusMeta[data.bannedAt ? "banned" : "active"]
    : null;

  /* Portaled to <body> so no sticky header's backdrop-filter becomes the
     containing block for this fixed-position overlay. */
  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={data ? `جزئیات حساب ${data.name}` : "جزئیات حساب"}
          className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/70 sm:max-h-[92vh] sm:rounded-3xl"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 text-sm font-bold text-white"
            >
              {loaded && data ? data.name.trim().charAt(0) : ""}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                {loaded && data ? data.name : "جزئیات حساب"}
              </h2>
              {data && (
                <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                  <span dir="ltr">{toFa(data.phone)}</span>
                  {" — عضو از "}
                  {data.joined}
                </p>
              )}
            </div>
            {role && (
              <span
                className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${role.tint}`}
              >
                {role.label}
              </span>
            )}
            {status && (
              <span
                className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tint}`}
              >
                {status.label}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن جزئیات"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── Body ───────────────────────────────────────── */}
          <div className="p-5">
            {failed ? (
              <DataFetchError onRetry={reload} />
            ) : !loaded ? (
              <ConsoleUserDetailSkeleton />
            ) : !data ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                این حساب پیدا نشد یا حذف شده است.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Every profile field, in one grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Cell label="شماره موبایل">
                    <span dir="ltr" className="tracking-wider">
                      {toFa(data.phone)}
                    </span>
                  </Cell>
                  <Cell label="کد ملی">
                    <span dir="ltr" className="tracking-wider">
                      {toFa(data.nationalId)}
                    </span>
                  </Cell>
                  <Cell label="تاریخ تولد">{data.birthDate}</Cell>
                  <Cell label="تاریخ عضویت">{data.joined}</Cell>
                  <Cell label="آخرین تغییر">{formatStamp(data.updatedAt)}</Cell>
                  <Cell label="وضعیت حساب">
                    {data.bannedAt ? (
                      <>
                        مسدود از {formatJalaliFull(new Date(data.bannedAt))}
                        <span className="mt-1 block text-[11px] font-normal text-red-500 dark:text-red-400">
                          ورود و داشبورد بسته است
                        </span>
                      </>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        فعال — هیچ محدودیتی ندارد
                      </span>
                    )}
                  </Cell>
                  <Cell label="رویدادهای برگزارشده">
                    {toFa(data.hostedEvents.length)} رویداد
                  </Cell>
                  <Cell label="ثبت‌نام‌ها">
                    {toFa(data.registrations.length)} بلیت
                  </Cell>
                  <Cell label="نقش">
                    {role?.label}
                    <span className="mt-1 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      {data.role === "ADMIN"
                        ? "به کنسول مدیریت دسترسی دارد"
                        : "فقط داشبورد شخصی خودش"}
                    </span>
                  </Cell>
                </div>

                {/* The events this account created */}
                <Section title={`رویدادهای برگزارشده (${toFa(data.hostedEvents.length)})`}>
                  {data.hostedEvents.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">
                      هنوز رویدادی نساخته است.
                    </span>
                  ) : (
                    <ul className="max-h-56 space-y-2 overflow-y-auto pe-1">
                      {data.hostedEvents.map((event) => {
                        const meta = eventLifecycleMeta[event.status];
                        return (
                          <li
                            key={event.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {event.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                {event.dateTime} ·{" "}
                                {event.capacity === null
                                  ? `${toFa(event.registered)} ثبت‌نام‌شده`
                                  : `${toFa(event.registered)} از ${toFa(event.capacity)} نفر`}
                              </p>
                            </div>
                            <span
                              className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.tint}`}
                            >
                              {meta.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Section>

                {/* The tickets this account holds */}
                <Section title={`ثبت‌نام‌ها (${toFa(data.registrations.length)})`}>
                  {data.registrations.length === 0 ? (
                    <span className="text-slate-400 dark:text-slate-500">
                      در هیچ رویدادی ثبت‌نام نکرده است.
                    </span>
                  ) : (
                    <ul className="max-h-56 space-y-2 overflow-y-auto pe-1">
                      {data.registrations.map((registration) => {
                        const meta = registrationStateMeta[registration.status];
                        return (
                          <li
                            key={registration.registrationId}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {registration.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                {registration.dateTime}
                              </p>
                            </div>
                            <span
                              className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.tint}`}
                            >
                              {meta.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Section>
              </div>
            )}
          </div>

          {/* ── Footer actions ─────────────────────────────── */}
          {data && target && (
            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isSelf
                  ? "این حساب، حساب خودتان است؛ تغییر نقش و مسدودسازی برای آن غیرفعال است."
                  : "تغییرات از همین حالا اعمال می‌شود."}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    changeRole(target, data.role === "ADMIN" ? "USER" : "ADMIN")
                  }
                  disabled={pending || isSelf}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-purple-200 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-800 dark:hover:text-purple-300"
                >
                  {data.role === "ADMIN" ? (
                    <>
                      <ShieldOff className="h-4 w-4" />
                      عزل از مدیریت
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      ارتقا به مدیر
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleBan(target)}
                  disabled={pending || isSelf}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                    data.bannedAt
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
                  }`}
                >
                  {data.bannedAt ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      رفع مسدودی
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" />
                      مسدودسازی
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
