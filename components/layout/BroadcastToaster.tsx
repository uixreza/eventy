"use client";

import { useEffect } from "react";
import { sileo } from "sileo";
import type { BroadcastNotice } from "@/lib/broadcast-types";

/** Which broadcasts this browser has already been shown. */
const STORAGE_KEY = "kooja:seen-broadcasts";
/* Bounded so the key can never grow without limit on a long-lived device. */
const MAX_SEEN = 50;
/* Never more than a handful of toasts at once, whatever is in the table. */
const MAX_PER_LOAD = 5;
const TOAST_MS = 8000;

function readSeen(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    /* Private mode or a corrupt value — treat as "seen nothing". */
    return [];
  }
}

function remember(id: string): void {
  try {
    const next = [id, ...readSeen().filter((seen) => seen !== id)].slice(0, MAX_SEEN);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Storage is unavailable: the toast still shows, it may show again later. */
  }
}

/**
 * The receiving half of `/console`'s global notifications.
 *
 * Mounted once in the root layout, so it covers every route for every
 * visitor. It fetches the feed after mount (never during SSR — there is no
 * flash of a toast nobody asked for yet) and shows each broadcast **once per
 * browser**: the id is written to `localStorage` as it is shown, so a
 * refresh, a new tab or another page does not repeat it. Dismissing is per
 * person and never deletes the row — the console keeps its own history.
 *
 * A failed feed is swallowed on purpose: notifications are additive, and a
 * down endpoint must not disturb the page that is rendering.
 */
export default function BroadcastToaster() {
  useEffect(() => {
    let alive = true;

    fetch("/api/broadcasts", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ broadcasts: BroadcastNotice[] }>) : null))
      .then((data) => {
        if (!alive || !data?.broadcasts?.length) return;

        const seen = readSeen();
        for (const notice of data.broadcasts.slice(0, MAX_PER_LOAD)) {
          /* Read-then-write in one synchronous block, so two runs of this
             effect (React StrictMode in development) can never both show
             the same notice. */
          if (seen.includes(notice.id)) continue;
          remember(notice.id);
          sileo.info({
            title: notice.title,
            description: notice.body || undefined,
            duration: TOAST_MS,
          });
        }
      })
      .catch(() => {
        /* Nothing to do — see the doc comment. */
      });

    return () => {
      alive = false;
    };
  }, []);

  return null;
}
