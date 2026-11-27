"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  UsersRound,
} from "lucide-react";
import { sileo } from "sileo";
import EventsHeatmap from "@/components/dashboard/EventsHeatmap";
import { confirm } from "@/components/ui/confirm";
import { cancelRegistration, deleteEvent, toggleReminder } from "@/app/actions/events";
import { eventImageUrl } from "@/lib/event-images";
import { eventLifecycleMeta, registrationStateMeta } from "@/lib/event-types";
import type { EnrolledEvent, HostedEvent } from "@/lib/event-types";
import { moderationCategoryLabels } from "@/lib/moderation-categories";
import { faPrice, shamsiMonths, toFa } from "@/lib/utils";

const TABS = ["رویدادهای من", "ثبت‌نام‌های من"] as const;
type Tab = (typeof TABS)[number];

const ghostButton =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300";

const dangerButton =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-red-200 hover:text-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900 dark:hover:text-red-400";

type CoverData = { images: string[]; gradient: string; jd: number; jm: number };

/**
 * The small date tile on a card. When the organizer added photos the first
 * one becomes the tile's cover; the gradient stays underneath as a fallback
 * and for events with no photos. The dark wash keeps the date legible.
 */
function EventDateCover({ event }: { event: CoverData }) {
  const cover = event.images[0];
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
      <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient}`} />
      {cover && (
        <Image
          src={eventImageUrl(cover)}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 64px, 80px"
          className="object-cover"
        />
      )}
      <div className={`absolute inset-0 ${cover ? "bg-black/40" : "bg-black/10"}`} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-lg font-extrabold leading-none">{toFa(event.jd)}</span>
        <span className="mt-1 text-[10px] font-bold">{shamsiMonths[event.jm - 1].label}</span>
      </div>
    </div>
  );
}

type MyEventsViewProps = {
  /** The events the signed-in user created. */
  hosted: HostedEvent[];
  /** The events the signed-in user enrolled in. */
  enrolled: EnrolledEvent[];
  /** Called after a mutation so the parent can re-fetch the two lists. */
  onChanged?: () => void;
};

export default function MyEventsView({ hosted, enrolled, onChanged }: MyEventsViewProps) {
  const [tab, setTab] = useState<Tab>(TABS[0]);
  const [pending, startTransition] = useTransition();

  const hostedUpcoming = hosted.filter((event) => !event.isPast).length;
  const enrolledUpcoming = enrolled.filter(
    (event) => !event.isPast && event.status !== "CANCELLED",
  ).length;

  /** Every event on the user's calendar — the heatmap draws them all. */
  const heatmapEvents = [
    ...hosted.map((event) => ({
      id: `hosted-${event.id}`,
      title: event.title,
      jy: event.jy,
      jm: event.jm,
      jd: event.jd,
    })),
    ...enrolled.map((event) => ({
      id: `enrolled-${event.registrationId}`,
      title: event.title,
      jy: event.jy,
      jm: event.jm,
      jd: event.jd,
    })),
  ];

  function report(ok: boolean, message: string | undefined, fallback: string) {
    if (ok) {
      sileo.success({ title: message ?? fallback, description: "تغییرات ذخیره شد." });
    } else {
      sileo.error({ title: message ?? fallback, description: "دوباره تلاش کنید." });
    }
    /* The lists come from a fetch on every load — ask for them again. */
    onChanged?.();
  }

  async function handleDelete(event: HostedEvent) {
    const confirmed = await confirm({
      title: "حذف رویداد؟",
      question: `«${event.title}» و همهٔ ثبت‌نام‌های آن برای همیشه حذف می‌شود.`,
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteEvent(event.id);
      report(result.ok, result.ok ? result.message : result.error, "حذف رویداد");
    });
  }

  async function handleCancelRegistration(event: EnrolledEvent) {
    const confirmed = await confirm({
      title: "لغو ثبت‌نام؟",
      question: `ثبت‌نام شما در «${event.title}» لغو می‌شود و صندلی شما به نفر بعدی می‌رسد.`,
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await cancelRegistration(event.registrationId);
      report(result.ok, result.ok ? result.message : result.error, "لغو ثبت‌نام");
    });
  }

  async function handleToggleReminder(event: EnrolledEvent) {
    startTransition(async () => {
      const result = await toggleReminder(event.registrationId);
      report(result.ok, result.ok ? result.message : result.error, "یادآوری");
    });
  }

  function showTicket(event: EnrolledEvent) {
    sileo.info({
      title: "بلیت رویداد",
      description: `کد بلیت «${event.title}»: ${event.ticket ? toFa(event.ticket) : "—"}`,
    });
  }

  function countFor(option: Tab): number {
    return option === TABS[0] ? hosted.length : enrolled.length;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              رویدادهای من
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {toFa(hostedUpcoming)} رویداد از شما و {toFa(enrolledUpcoming)} ثبت‌نام فعال دارید.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/events/new"
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          ثبت رویداد جدید
        </Link>
      </div>

      {/* Overview heatmap — a general view, independent of the filter below */}
      <EventsHeatmap events={heatmapEvents} />

      {/* Tabs */}
      <div role="tablist" aria-label="فیلتر رویدادها" className="flex gap-2">
        {TABS.map((option) => (
          <button
            key={option}
            role="tab"
            aria-selected={tab === option}
            type="button"
            onClick={() => setTab(option)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 sm:text-sm ${
              tab === option
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
            }`}
          >
            {option} ({toFa(countFor(option))})
          </button>
        ))}
      </div>

      {/* Event list */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        >
          {/* ── Events I created ─────────────────────────────── */}
          {tab === TABS[0] &&
            hosted.map((event) => {
              const lifecycle = eventLifecycleMeta[event.status];
              return (
                <motion.li
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"
                >
                  {/* Date cover */}
                  <EventDateCover event={event} />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {event.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${lifecycle.tint}`}
                      >
                        {lifecycle.label}
                      </span>
                      {event.moderationApproved && event.status === "PENDING" && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Sparkles className="h-3 w-3" />
                          تأیید توسط AI
                        </span>
                      )}
                      {event.moderationFlagged && event.status === "REJECTED" && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:bg-red-950 dark:text-red-300">
                          <AlertTriangle className="h-3 w-3" />
                          رد توسط AI
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                        {event.dateTime}
                      </span>
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">
                          {event.city ? `${event.city} - ` : ""}
                          {event.venue}
                        </span>
                      </span>
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <UsersRound className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        {event.capacity === null
                          ? `${toFa(event.registered)} ثبت‌نام‌شده`
                          : `${toFa(event.registered)} از ${toFa(event.capacity)} نفر`}
                        {event.waitlist > 0 ? ` · ${toFa(event.waitlist)} در لیست انتظار` : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Ticket className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        {event.price === null ? (
                          <span className="text-emerald-600 dark:text-emerald-400">رایگان</span>
                        ) : (
                          faPrice(event.price)
                        )}
                      </span>
                    </p>
                    {event.status === "REJECTED" &&
                      event.moderationFlagged &&
                      event.moderationNote && (
                        <div className="mt-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-6 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                          <p className="flex items-center gap-1.5 font-extrabold">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            دلیل رد هوش مصنوعی
                          </p>
                          <p className="mt-1 font-semibold">{event.moderationNote}</p>
                          {event.moderationCategories.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {moderationCategoryLabels(event.moderationCategories).map((label) => (
                                <span
                                  key={label}
                                  className="rounded-full bg-white px-2 py-0.5 font-bold text-red-600 dark:bg-slate-900 dark:text-red-300"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:col-span-2 sm:pl-24">
                    <Link
                      href={`/dashboard/events/${event.id}/edit`}
                      className={ghostButton}
                      title="ویرایش رویداد"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        ویرایش
                      </span>
                    </Link>
                    {event.status === "PUBLISHED" && (
                      <Link
                        href={`/events/${event.slug}`}
                        className={ghostButton}
                        title="مشاهده صفحه عمومی رویداد"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          مشاهده
                        </span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(event)}
                      disabled={pending}
                      className={dangerButton}
                      title="حذف رویداد"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </span>
                    </button>
                  </div>
                </motion.li>
              );
            })}

          {/* ── Events I enrolled in ─────────────────────────── */}
          {tab === TABS[1] &&
            enrolled.map((event) => {
              const state = registrationStateMeta[event.status];
              const lifecycle = eventLifecycleMeta[event.eventStatus];
              return (
                <motion.li
                  key={event.registrationId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"
                >
                  {/* Date cover */}
                  <EventDateCover event={event} />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {event.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${state.tint}`}
                      >
                        {state.label}
                      </span>
                      {event.eventStatus !== "PUBLISHED" && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${lifecycle.tint}`}
                        >
                          {lifecycle.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                        {event.dateTime}
                      </span>
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">
                          {event.mode === "ONLINE"
                            ? "آنلاین"
                            : `${event.city ? `${event.city} - ` : ""}${event.venue}`}
                        </span>
                      </span>
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <Ticket className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      {event.ticket ? (
                        <>
                          کد بلیت:{" "}
                          <span dir="ltr" className="font-mono text-slate-700 dark:text-slate-300">
                            {toFa(event.ticket)}
                          </span>
                        </>
                      ) : (
                        "بلیت هنوز صادر نشده است"
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:col-span-2 sm:pl-24">
                    {!event.isPast && event.status !== "CANCELLED" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleReminder(event)}
                          disabled={pending}
                          aria-pressed={event.reminder}
                          aria-label="یادآوری رویداد"
                          title={event.reminder ? "یادآوری فعال است" : "فعال‌سازی یادآوری"}
                          className={`rounded-xl p-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 ${
                            event.reminder
                              ? "border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "border border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-800 dark:hover:text-blue-400"
                          }`}
                        >
                          {event.reminder ? (
                            <BellRing className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelRegistration(event)}
                          disabled={pending}
                          className={dangerButton}
                        >
                          لغو ثبت‌نام
                        </button>
                      </>
                    )}
                    {event.ticket && (
                      <button type="button" onClick={() => showTicket(event)} className={ghostButton}>
                        مشاهده بلیت
                      </button>
                    )}
                    <Link href={`/events/${event.slug}`} className={ghostButton}>
                      <span className="inline-flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        صفحه رویداد
                      </span>
                    </Link>
                  </div>
                </motion.li>
              );
            })}
        </motion.ul>
      </AnimatePresence>

      {/* Empty state */}
      {countFor(tab) === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {tab === TABS[0]
              ? "هنوز رویدادی ثبت نکرده‌اید."
              : "در هیچ رویدادی ثبت‌نام نکرده‌اید."}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {tab === TABS[0]
              ? "با «ثبت رویداد جدید» اولین رویداد خود را بسازید."
              : "از صفحه کشف رویدادها می‌توانید ثبت‌نام کنید."}
          </p>
          {tab === TABS[0] && (
            <Link
              href="/dashboard/events/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              ثبت رویداد جدید
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
