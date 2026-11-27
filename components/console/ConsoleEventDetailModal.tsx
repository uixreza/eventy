"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import { sileo } from "sileo";
import { checkEventModeration, reviewEvent } from "@/app/actions/events";
import EventImageSlideshow from "@/components/events/EventImageSlideshow";
import DataFetchError from "@/components/dashboard/DataFetchError";
import { useServerData } from "@/components/dashboard/useServerData";
import { eventLifecycleMeta } from "@/lib/event-types";
import { moderationCategoryLabels } from "@/lib/moderation-categories";
import { faPrice, toFa } from "@/lib/utils";
import { fetchConsoleEvent } from "./console-api";
import { ConsoleEventDetailSkeleton } from "./ConsoleSkeletons";

type ModalProps = {
  id: string;
  onClose: () => void;
  /** Runs the queue's own fetch again after a review result. */
  onChanged: () => void;
};

/** One read-only field of the details grid. */
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
 * The review modal of `/console/events`: one event in full, fetched from
 * `GET /api/console/events/[id]` the moment it opens — long description,
 * organizer, live ticket counts, every timestamp — so an admin reads the
 * whole thing before deciding. Approve, send back for changes and the link
 * to the edit form all live in its footer.
 */
export default function ConsoleEventDetailModal({ id, onClose, onChanged }: ModalProps) {
  const { data, loaded, failed, reload } = useServerData(() => fetchConsoleEvent(id));
  const [pending, startTransition] = useTransition();

  /* Escape closes the dialog, the way the backdrop click does. */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function review(approve: boolean) {
    if (!data) return;
    startTransition(async () => {
      const result = await reviewEvent(data.id, approve);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      sileo.success({
        title: `رویداد «${data.title}» ${approve ? "منتشر شد" : "برگردانده شد"}`,
        description: result.message,
      });
      /* The queue and this dialog both re-read the database. */
      onChanged();
      reload();
    });
  }

  function aiCheck() {
    if (!data) return;
    startTransition(async () => {
      const result = await checkEventModeration(data.id);
      if (!result.ok) {
        sileo.error({ title: result.error, description: "دوباره تلاش کنید." });
        return;
      }
      if (result.approved) {
        sileo.success({ title: "تأیید توسط AI", description: result.message });
      } else if (result.flagged) {
        sileo.error({
          title: "رویداد توسط AI رد شد",
          description: result.message,
        });
      } else {
        sileo.info({ title: "بررسی هوشمند ممکن نشد", description: result.message });
      }
      onChanged();
      reload();
    });
  }

  const status = data ? eventLifecycleMeta[data.status] : null;

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
          aria-label={data ? `جزئیات رویداد ${data.title}` : "جزئیات رویداد"}
          className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/70 sm:max-h-[92vh] sm:rounded-3xl"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            {data && (
              <span
                aria-hidden="true"
                className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${data.gradient}`}
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                {loaded && data ? data.title : "جزئیات رویداد"}
              </h2>
              {data && (
                <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                  <span dir="ltr">{data.slug}</span>
                  {" — "}
                  {status?.description}
                </p>
              )}
            </div>
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
              <ConsoleEventDetailSkeleton />
            ) : !data ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                این رویداد پیدا نشد یا حذف شده است.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Photos come first, in a wide horizontal gallery, so an
                    admin can check every image before reading the details. */}
                {data.images.length > 0 && (
                  <EventImageSlideshow
                    images={data.images}
                    title={data.title}
                    orientation="horizontal"
                  />
                )}

                {/* OpenAI's decision, kept next to the content it judged. */}
                <Section title="بررسی هوشمند OpenAI">
                  {!data.moderationCheckedAt ? (
                    <p className="text-slate-400 dark:text-slate-500">
                      هنوز بررسی هوشمندی روی این رویداد انجام نشده است.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p
                        className={`font-bold ${
                          data.moderationFlagged
                            ? "text-red-600 dark:text-red-400"
                            : data.moderationApproved
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {data.moderationFlagged
                          ? "رد توسط هوش مصنوعی"
                          : data.moderationApproved
                            ? "تأیید توسط AI — در انتظار تأیید مدیر"
                            : "بررسی هوشمند ناموفق"}
                      </p>
                      {data.moderationCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {moderationCategoryLabels(data.moderationCategories).map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                      {data.moderationNote && (
                        <p
                          className={`text-xs leading-6 ${
                            data.moderationFlagged
                              ? "font-bold text-red-700 dark:text-red-300"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {data.moderationNote}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        آخرین بررسی: {formatStamp(data.moderationCheckedAt)}
                      </p>
                    </div>
                  )}
                </Section>

                {/* The copy an admin has to read before approving */}
                <Section title="خلاصه">
                  {data.summary || (
                    <span className="text-slate-400 dark:text-slate-500">
                      خلاصه‌ای ثبت نشده است.
                    </span>
                  )}
                </Section>
                <Section title="توضیحات کامل">
                  {data.description ? (
                    <p className="whitespace-pre-line">{data.description}</p>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      توضیحاتی ثبت نشده است.
                    </span>
                  )}
                </Section>

                {/* Every remaining field, in one grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Cell label="دسته‌بندی">{data.category}</Cell>
                  <Cell label="نوع برگزاری">
                    {data.mode === "ONLINE" ? "آنلاین" : "حضوری"}
                    {data.mode === "ONLINE" && data.onlineUrl && (
                      <span dir="ltr" className="mt-1 block break-all text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        {data.onlineUrl}
                      </span>
                    )}
                  </Cell>
                  <Cell label="زمان برگزاری">{data.dateTime}</Cell>
                  <Cell label="شهر">{data.city || "—"}</Cell>
                  <Cell label="محل برگزاری">{data.venue || "—"}</Cell>
                  <Cell label="قیمت">
                    {data.price === null ? (
                      <span className="text-emerald-600 dark:text-emerald-400">رایگان</span>
                    ) : (
                      faPrice(data.price)
                    )}
                  </Cell>
                  <Cell label="ظرفیت">
                    {data.capacity === null ? "نامشخص" : `${toFa(data.capacity)} نفر`}
                  </Cell>
                  <Cell label="نیاز به تیم عکاسی">
                    {data.needsPhotographyTeam ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        بله، نیاز دارد
                      </span>
                    ) : (
                      "خیر"
                    )}
                  </Cell>
                  <Cell label="ثبت‌نام‌ها">
                    {toFa(data.confirmed)} قطعی
                    <span className="mt-1 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      {toFa(data.waitlist)} لیست انتظار
                      {data.seatsLeft === null
                        ? " · ظرفیت نامشخص"
                        : ` · ${toFa(data.seatsLeft)} صندلی آزاد`}
                    </span>
                  </Cell>
                  <Cell label="علاقه‌مندی‌ها">{toFa(data.saved)} ذخیره</Cell>
                  <Cell label="برگزارکننده">
                    {data.organizerName || "—"}
                    <span className="mt-1 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      {data.organizer ? (
                        <>
                          {data.organizer.name} · <span dir="ltr">{data.organizer.phone}</span>
                        </>
                      ) : (
                        "بدون حساب کاربری پیوسته"
                      )}
                    </span>
                  </Cell>
                  <Cell label="زمان ثبت">{formatStamp(data.createdAt)}</Cell>
                  <Cell label="آخرین تغییر">{formatStamp(data.updatedAt)}</Cell>
                  <Cell label="صفحه عمومی">
                    <Link
                      href={`/events/${data.slug}`}
                      className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                    >
                      مشاهده در سایت
                    </Link>
                  </Cell>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer actions ─────────────────────────────── */}
          {data && (
            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <Link
                href={`/console/events/${data.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
              >
                <Pencil className="h-4 w-4" />
                ویرایش اطلاعات
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={aiCheck}
                  disabled={pending || data.status !== "PENDING"}
                  title="بررسی هوشمند با OpenAI"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-bold text-violet-700 transition-all duration-200 hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-900 dark:bg-slate-800 dark:text-violet-300 dark:hover:bg-violet-950"
                >
                  <Sparkles className="h-4 w-4" />
                  بررسی هوشمند
                </button>
                <button
                  type="button"
                  onClick={() => review(false)}
                  disabled={pending || data.status === "REJECTED"}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <X className="h-4 w-4" />
                  نیازمند اصلاح
                </button>
                <button
                  type="button"
                  onClick={() => review(true)}
                  disabled={pending || data.status === "PUBLISHED"}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                  تأیید و انتشار
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
