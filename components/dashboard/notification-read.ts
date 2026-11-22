"use client";

/**
 * Which derived notifications this browser has read.
 *
 * The feed itself always comes from the database, but read state has no
 * column — so it lives here, the same per-browser contract the global
 * broadcast toasts use (`components/layout/BroadcastToaster.tsx`). The ids
 * are stable (`ticket:<id>`, `host:<eventId>:<status>`, …), so a row that
 * was read stays read on the next load and in the next tab.
 */

/** Ids this browser has already read. */
export const NOTIFICATIONS_READ_KEY = "kooja:read-notifications";
/** The last unread count, so the shell's bell can show a dot. */
export const NOTIFICATIONS_UNREAD_KEY = "kooja:notifications-unread";
/** Fired in this tab after the read set changes (storage only fires elsewhere). */
export const NOTIFICATIONS_CHANGED_EVENT = "kooja:notifications-changed";

/* Bounded so the key can never grow without limit on a long-lived device. */
const MAX_READ = 200;

function readList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    /* Private mode or a corrupt value — treat as "read nothing". */
    return [];
  }
}

/** The ids this browser has read. */
export function readNotificationIds(): string[] {
  return readList(NOTIFICATIONS_READ_KEY);
}

/** Adds ids to the read set (newest first, bounded) and returns the result. */
export function markNotificationsRead(ids: string[]): string[] {
  const next = [
    ...ids,
    ...readNotificationIds().filter((id) => !ids.includes(id)),
  ].slice(0, MAX_READ);
  try {
    window.localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify(next));
  } catch {
    /* Storage is unavailable: the page still updates for this visit. */
  }
  return next;
}

/** Publishes the unread count for the shell's bell, then notifies this tab. */
export function publishUnreadCount(count: number): void {
  try {
    window.localStorage.setItem(NOTIFICATIONS_UNREAD_KEY, String(count));
  } catch {
    /* Same as above — the dot just won't survive a reload. */
  }
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}
