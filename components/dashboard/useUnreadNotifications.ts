"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchNotifications } from "./dashboard-api";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_UNREAD_KEY,
  publishUnreadCount,
  readNotificationIds,
} from "./notification-read";
import {
  playNotificationSound,
  preloadNotificationSound,
} from "./notification-sound";
import { useLiveRefresh } from "./useLiveRefresh";

/**
 * The shell's live unread count, shared by the desktop tab and mobile bell.
 *
 * The feed itself is derived on the server, while "read" is a per-browser
 * localStorage contract. On every dashboard route except the notifications
 * page itself we recompute the count from the feed; a WebSocket hint runs the
 * same recompute even while the tab sits idle. On the notifications page
 * `NotificationsView` owns the count and publishes it through the shared key.
 */
export function useUnreadNotifications(): number {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const requestId = useRef(0);
  const unreadRef = useRef(0);
  const liveSyncRef = useRef<() => void>(() => undefined);
  const syncFromLive = useCallback(() => liveSyncRef.current(), []);

  useEffect(() => {
    const applyCount = (count: number) => {
      unreadRef.current = count;
      setUnread(count);
    };

    const sync = () => {
      try {
        const raw = window.localStorage.getItem(NOTIFICATIONS_UNREAD_KEY);
        const parsed = raw === null ? 0 : Number(raw);
        applyCount(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
      } catch {
        /* Storage unavailable — no badge rather than a wrong one. */
        applyCount(0);
      }
    };

    /* `announce` is true only for a WebSocket hint. The mount and navigation
       reads below must never play the chime. */
    const syncFeed = async (announce = false) => {
      if (pathname === "/dashboard/notifications") return;
      const id = ++requestId.current;
      try {
        const feed = await fetchNotifications();
        if (id !== requestId.current) return;
        const readIds = readNotificationIds();
        const count = feed.notifications.filter(
          (item) => !readIds.includes(item.id),
        ).length;
        if (announce && count > unreadRef.current) playNotificationSound();
        /* Publishing also tells any other badge in this tab to update. */
        publishUnreadCount(count);
        applyCount(count);
      } catch {
        /* Keep the last known count — a failed read is not zero notifications. */
      }
    };

    /* On the feed page the count is published by `NotificationsView`; elsewhere
       a live hint refetches the derived feed before reading the shared count. */
    liveSyncRef.current = () => {
      void syncFeed(true).then(sync);
    };

    preloadNotificationSound();
    sync();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, sync);
    const onStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATIONS_UNREAD_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    void syncFeed();

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

  useLiveRefresh(["dashboard:notifications"], syncFromLive);

  return unread;
}
