"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchNotifications } from "./dashboard-api";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_UNREAD_KEY,
  publishUnreadCount,
  readNotificationIds,
} from "./notification-read";

/**
 * The shell's live unread count, shared by the desktop tab and mobile bell.
 *
 * The feed itself is derived on the server, while "read" is a per-browser
 * localStorage contract. On every dashboard route except the notifications
 * page itself we recompute the count from the feed, so a new notification is
 * reflected without making the user open the page first. On the notifications
 * page `NotificationsView` owns the count and publishes it through the same
 * shared key/event.
 */
export function useUnreadNotifications(): number {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      try {
        const raw = window.localStorage.getItem(NOTIFICATIONS_UNREAD_KEY);
        const parsed = raw === null ? 0 : Number(raw);
        setUnread(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
      } catch {
        /* Storage unavailable — no badge rather than a wrong one. */
        setUnread(0);
      }
    };

    sync();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, sync);
    const onStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATIONS_UNREAD_KEY) sync();
    };
    window.addEventListener("storage", onStorage);

    if (pathname !== "/dashboard/notifications") {
      fetchNotifications()
        .then((feed) => {
          if (cancelled) return;
          const readIds = readNotificationIds();
          const count = feed.notifications.filter((item) => !readIds.includes(item.id)).length;
          /* Publishing also tells any other badge in this tab to update. */
          publishUnreadCount(count);
          setUnread(count);
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

  return unread;
}
