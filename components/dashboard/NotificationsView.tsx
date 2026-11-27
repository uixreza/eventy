"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Megaphone,
  Ticket,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { sileo } from "sileo";
import DataFetchError from "@/components/dashboard/DataFetchError";
import { NotificationsSkeleton } from "@/components/dashboard/Skeletons";
import { fetchNotifications } from "@/components/dashboard/dashboard-api";
import {
  markNotificationsRead,
  publishUnreadCount,
  readNotificationIds,
} from "@/components/dashboard/notification-read";
import { playNotificationSound } from "@/components/dashboard/notification-sound";
import { useLiveRefresh } from "@/components/dashboard/useLiveRefresh";
import { useServerData } from "@/components/dashboard/useServerData";
import type {
  DashboardNotification,
  NotificationGroup,
  NotificationKind,
} from "@/lib/notification-types";
import { toFa } from "@/lib/utils";

const FILTERS = ["همه", "خوانده‌نشده"] as const;

/** The order the day buckets render in — future reminders first. */
const GROUP_ORDER: NotificationGroup[] = [
  "upcoming",
  "today",
  "yesterday",
  "week",
  "earlier",
];

const GROUP_LABELS: Record<NotificationGroup, string> = {
  upcoming: "پیش رو",
  today: "امروز",
  yesterday: "دیروز",
  week: "این هفته",
  earlier: "پیش‌تر",
};

/** The icon and tint each kind of row wears. */
const kindMeta: Record<NotificationKind, { icon: LucideIcon; tint: string }> = {
  broadcast: {
    icon: Megaphone,
    tint: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300",
  },
  ticket: {
    icon: Ticket,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  waitlist: {
    icon: Clock,
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  reminder: {
    icon: Calendar,
    tint: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
  },
  published: {
    icon: CheckCircle2,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  rejected: {
    icon: AlertCircle,
    tint: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
  pending: {
    icon: Clock,
    tint: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  },
  cancelled: {
    icon: XCircle,
    tint: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  },
  seat: {
    icon: Zap,
    tint: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300",
  },
};

/**
 * The notifications route's shell: it asks the server for the feed on every
 * load of `/dashboard/notifications` and mounts the list once it arrives.
 *
 * The feed is built from the tables (`lib/notifications.ts`) — broadcasts,
 * tickets, reminders, moderation results and saved events running out of
 * seats — so it always matches the database. Which rows this browser has
 * read is kept locally (there is no column for it), the same contract the
 * global broadcast toasts follow.
 */
export default function NotificationsView() {
  const { data, loaded, failed, reload } = useServerData(fetchNotifications);
  const liveHintRef = useRef(false);
  const previousUnreadRef = useRef<number | null>(null);

  useLiveRefresh(["dashboard:notifications"], () => {
    liveHintRef.current = true;
    reload();
  });

  /* Only a live reload that actually brings a new unread row chimes. The
     initial fetch and manual retries leave `liveHintRef` false. */
  useEffect(() => {
    if (!loaded || !data) return;
    const readIds = readNotificationIds();
    const count = data.notifications.filter(
      (notice) => !readIds.includes(notice.id),
    ).length;
    const previous = previousUnreadRef.current;
    previousUnreadRef.current = count;
    if (liveHintRef.current) {
      liveHintRef.current = false;
      if (previous !== null && count > previous) playNotificationSound();
    }
  }, [data, loaded]);

  if (failed) return <DataFetchError onRetry={reload} />;
  if (!loaded || !data) return <NotificationsSkeleton />;

  /* The ids are the key: a changed feed starts the list over with the new
     rows, while an identical answer keeps the current read state in place. */
  return (
    <NotificationsList
      key={data.notifications.map((notice) => notice.id).join("|")}
      items={data.notifications}
    />
  );
}

function NotificationsList({ items }: { items: DashboardNotification[] }) {
  /* Read state comes from `localStorage`, read once on mount — this list is
     only ever mounted on the client, after the fetch lands. */
  const [readIds, setReadIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readNotificationIds(),
  );
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("همه");

  const unread = useMemo(
    () => items.filter((notice) => !readIds.includes(notice.id)),
    [items, readIds],
  );
  const unreadCount = unread.length;
  const visible = filter === "همه" ? items : unread;

  /* Keep the shell's bell dot in step with this page — and with its other
     tabs, since `publishUnreadCount` writes the shared key. */
  useEffect(() => {
    publishUnreadCount(unreadCount);
  }, [unreadCount]);

  function markRead(id: string) {
    setReadIds(markNotificationsRead([id]));
  }

  function markAllRead() {
    if (unreadCount === 0) return;
    setReadIds(markNotificationsRead(unread.map((notice) => notice.id)));
    sileo.success({
      title: "همه اعلان‌ها خوانده شد",
      description: `${toFa(unreadCount)} اعلان به عنوان خوانده‌شده علامت خورد.`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                {toFa(unreadCount)}
              </span>
            )}
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              اعلان‌ها
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {unreadCount > 0
                ? `${toFa(unreadCount)} اعلان خوانده‌نشده دارید.`
                : items.length > 0
                  ? "همه اعلان‌ها را خوانده‌اید."
                  : "اعلانی برای شما ثبت نشده است."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300 dark:disabled:border-slate-700 dark:disabled:text-slate-300"
        >
          علامت‌گذاری همه به عنوان خوانده‌شده
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 sm:text-sm ${
              filter === option
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
            }`}
          >
            {option}
            {option === "خوانده‌نشده" && unreadCount > 0 && ` (${toFa(unreadCount)})`}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-6"
        >
          {GROUP_ORDER.map((group) => {
            const rows = visible.filter((notice) => notice.group === group);
            if (rows.length === 0) return null;
            return (
              <section key={group}>
                <h2 className="mb-3 text-xs font-bold text-slate-400 dark:text-slate-500">
                  {GROUP_LABELS[group]}
                </h2>
                <ul className="space-y-3">
                  {rows.map((notice) => {
                    const { icon: Icon, tint } = kindMeta[notice.kind];
                    const isUnread = !readIds.includes(notice.id);
                    const body = (
                      <>
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {notice.title}
                            </span>
                            {isUnread && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-blue-500"
                                aria-label="خوانده‌نشده"
                              />
                            )}
                          </span>
                          <span className="mt-1 block text-xs leading-6 text-slate-500 dark:text-slate-400">
                            {notice.description}
                          </span>
                          <span className="mt-2 block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            {notice.time}
                          </span>
                        </span>
                      </>
                    );
                    const rowClass = `flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                      isUnread
                        ? "border-blue-100 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/40"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    }`;

                    return (
                      <li key={notice.id}>
                        {notice.href ? (
                          <Link
                            href={notice.href}
                            onClick={() => markRead(notice.id)}
                            className={rowClass}
                          >
                            {body}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markRead(notice.id)}
                            className={rowClass}
                          >
                            {body}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {/* Nothing at all — the database has no news for this person. */}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400">
                <Bell className="h-7 w-7" />
              </span>
              <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                هنوز اعلانی نداری.
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-6 text-slate-400 dark:text-slate-500">
                بلیت‌ها، یادآوری‌ها، نتیجهٔ بررسی رویدادهایت و اعلان‌های سراسری
                همین‌جا ظاهر می‌شوند.
              </p>
              <Link
                href="/events"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
              >
                کشف رویدادها
              </Link>
            </div>
          )}

          {/* Items exist, but every one of them has been read. */}
          {items.length > 0 && visible.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                اعلان خوانده‌نشده‌ای نداری.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                همه‌چیز به‌روز است 🎉
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
