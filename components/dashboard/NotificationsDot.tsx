"use client";

import { useEffect, useState } from "react";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_UNREAD_KEY,
} from "./notification-read";

/**
 * The orange dot on the mobile bell.
 *
 * It reflects the last unread count the notifications page computed, kept in
 * `localStorage` (see `notification-read.ts`). That keeps the shell cheap —
 * no feed fetch on every dashboard route — and honest: a fresh browser shows
 * no dot until it has actually counted, and the dot disappears the moment
 * the page marks everything read, in this tab or another.
 */
export default function NotificationsDot() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const sync = () => {
      try {
        const raw = window.localStorage.getItem(NOTIFICATIONS_UNREAD_KEY);
        const parsed = raw === null ? 0 : Number(raw);
        setUnread(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
      } catch {
        /* Storage unavailable — no dot rather than a wrong one. */
        setUnread(0);
      }
    };

    sync();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, sync);
    const onStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATIONS_UNREAD_KEY) sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (unread === 0) return null;

  return (
    <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900" />
  );
}
