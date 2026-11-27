"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Heart,
  LifeBuoy,
  Plus,
  Settings,
  Sparkles,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { fetchOverview } from "@/components/dashboard/dashboard-api";
import DataFetchError from "@/components/dashboard/DataFetchError";
import { OverviewSkeleton } from "@/components/dashboard/Skeletons";
import { useServerData } from "@/components/dashboard/useServerData";
import type { EventLifecycle } from "@/lib/event-types";
import { toFa } from "@/lib/utils";

type OverviewStat = {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
  tint: string;
};

// Quick links to the dashboard's sub-routes.
type DashboardSection = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

const dashboardSections: DashboardSection[] = [
  { title: "رویدادهای من", href: "/dashboard/events", description: "رویدادهایی که ساخته‌اید و ثبت‌نام‌های شما", icon: Calendar },
  { title: "علاقه‌مندی‌ها", href: "/dashboard/saved", description: "رویدادهای ذخیره‌شده برای بعد", icon: Heart },
  { title: "پروفایل و تنظیمات", href: "/dashboard/settings", description: "نام، تاریخ تولد و کد ملی شما", icon: Settings },
  { title: "تیکت", href: "/dashboard/tickets", description: "پیام‌ها و پاسخ‌های پشتیبانی", icon: LifeBuoy },
];

/** The badge each lifecycle state wears — the label is the row's real status. */
const hostedStatusMeta: Record<EventLifecycle, { label: string; tint: string }> = {
  DRAFT: {
    label: "پیش‌نویس",
    tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  PENDING: {
    label: "در انتظار تأیید",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  PUBLISHED: {
    label: "منتشر شده",
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  REJECTED: {
    label: "نیاز به اصلاح",
    tint: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
  CANCELLED: {
    label: "لغو شده",
    tint: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  },
};

/**
 * The dashboard overview. It fetches its own rows from the server on
 * every load — nothing here is rendered from a session-cached snapshot.
 */
export default function OverviewView() {
  const { data, loaded, failed, reload } = useServerData(fetchOverview);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <OverviewSkeleton />;

  const hosted = data.hosted;
  const enrolled = data.enrolled;

  /* Cancelled events are no longer on anyone's calendar. */
  const upcomingHosted = hosted.filter(
    (event) => !event.isPast && event.status !== "CANCELLED",
  );
  const activeTickets = enrolled.filter(
    (event) =>
      !event.isPast &&
      event.status === "CONFIRMED" &&
      event.eventStatus !== "CANCELLED",
  );

  const overviewStats: OverviewStat[] = [
    {
      label: "رویدادهای پیش رو",
      value: toFa(upcomingHosted.length + activeTickets.length),
      href: "/dashboard/events",
      icon: Calendar,
      tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      label: "بلیت‌های فعال",
      value: toFa(activeTickets.length),
      href: "/dashboard/events",
      icon: Ticket,
      tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      label: "ذخیره‌شده‌ها",
      value: toFa(data.savedCount),
      href: "/dashboard/saved",
      icon: Heart,
      tint: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300",
    },
    {
      label: "تیکت‌های باز",
      value: toFa(data.openTicketCount),
      href: "/dashboard/tickets",
      icon: LifeBuoy,
      tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
  ];

  /** The next events on the user's calendar — the ones they host, then the
      ones they enrolled in. */
  const upcomingEvents = [
    ...upcomingHosted.map((event) => {
      const meta = hostedStatusMeta[event.status];
      return {
        key: `hosted-${event.id}`,
        title: event.title,
        date: event.dateTime,
        place: event.venue || event.city,
        status: meta.label,
        tint: meta.tint,
        href: `/dashboard/events/${event.id}/edit`,
        aiApproved: event.moderationApproved && event.status === "PENDING",
        reason:
          event.status === "REJECTED" && event.moderationFlagged
            ? event.moderationNote
            : null,
      };
    }),
    ...activeTickets.map((event) => ({
      key: `enrolled-${event.registrationId}`,
      title: event.title,
      date: event.dateTime,
      place: event.venue || event.city,
      status: "ثبت‌نام قطعی",
      tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
      href: `/events/${event.slug}`,
      aiApproved: false,
      reason: null,
    })),
  ].slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            سلام {data.userName.split(" ")[0] || "مهمان"} 👋
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            {activeTickets.length + upcomingHosted.length > 0
              ? `${toFa(activeTickets.length)} بلیت فعال و ${toFa(upcomingHosted.length)} رویداد در دست شما دارید.`
              : "هنوز بلیتی ندارید و رویدادی نساخته‌اید؛ از کشف رویدادها شروع کنید."}
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          ثبت رویداد جدید
        </Link>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {overviewStats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800 sm:p-5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {s.label}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming events */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              رویدادهای پیش رو
            </h2>
            <Link
              href="/dashboard/events"
              className="flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              مشاهده همه
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {upcomingEvents.map((ev) => (
                <li
                  key={ev.key}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link href={ev.href} className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                      {ev.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {ev.date} • {ev.place}
                    </p>
                    {ev.aiApproved && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Sparkles className="h-3 w-3" />
                        تأیید توسط AI
                      </p>
                    )}
                    {ev.reason && (
                      <p className="mt-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                        دلیل رد AI: {ev.reason}
                      </p>
                    )}
                  </Link>
                  <span
                    className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${ev.tint}`}
                  >
                    {ev.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                رویداد پیش رویی ندارید.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                یک رویداد ثبت کنید یا از صفحه کشف رویدادها ثبت‌نام کنید.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">دسترسی سریع</h2>
          <div className="mt-4 space-y-2.5">
            {[
              { label: "کشف رویدادها", href: "/events", icon: Calendar },
              { label: "ذخیره‌شده‌ها", href: "/dashboard/saved", icon: Heart },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                >
                  <Icon className="h-4 w-4" />
                  {a.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-route quick links */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            بخش‌های داشبورد
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {dashboardSections.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <ArrowLeft className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:-translate-x-1 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  {s.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
