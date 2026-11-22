"use client";

/**
 * Bookmark changes are announced here instead of waiting for a refresh.
 *
 * The same-tab announcement is a `window` event; the `localStorage` copy
 * reaches every other open tab of the app (the `storage` event only fires
 * in the tabs that did not write). The favorites list listens to both and
 * re-fetches the moment a bookmark lands in the database.
 */

const EVENT = "bookmarks-changed";
const STORAGE_KEY = "bookmarks-changed";

export function notifyBookmarksChanged() {
  try {
    /* A changing value so other tabs always see a real `storage` event. */
    localStorage.setItem(STORAGE_KEY, `${Date.now()}:${Math.random()}`);
  } catch {
    /* Storage may be unavailable — the same-tab event still works. */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The same-tab event name, for listeners. */
export const BOOKMARKS_CHANGED_EVENT = EVENT;

/** The cross-tab storage key, for listeners to filter on. */
export const BOOKMARKS_CHANGED_STORAGE_KEY = STORAGE_KEY;
