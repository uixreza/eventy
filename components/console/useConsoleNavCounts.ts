"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLiveRefresh } from "@/components/dashboard/useLiveRefresh";
import type { ConsoleNavCounts } from "@/lib/console-types";
import { fetchConsoleNavCounts } from "./console-api";

/** Fired after a console mutation so the menu follows the database at once. */
export const CONSOLE_COUNTS_CHANGED_EVENT = "kooja:console-counts-changed";

const EMPTY_COUNTS: ConsoleNavCounts = {
  pendingEvents: 0,
  eventReports: 0,
  openTickets: 0,
};

export function refreshConsoleNavCounts() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONSOLE_COUNTS_CHANGED_EVENT));
  }
}

/**
 * The badge counts shared by the desktop sidebar and the mobile pills.
 *
 * `ConsoleShell` stays mounted between console routes, so the fetch is keyed
 * on `pathname` as well as running on mount. Local mutations, returning to the
 * tab, and live WebSocket hints all run this same loader.
 */
export function useConsoleNavCounts(): ConsoleNavCounts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<ConsoleNavCounts>(EMPTY_COUNTS);
  const requestId = useRef(0);
  const liveLoadRef = useRef<() => void>(() => undefined);
  const loadFromLive = useCallback(() => liveLoadRef.current(), []);

  useEffect(() => {
    const load = async () => {
      const id = ++requestId.current;
      try {
        const response = await fetchConsoleNavCounts();
        /* Ignore older answers when several hints arrive close together. */
        if (id === requestId.current) setCounts(response.counts);
      } catch {
        /* Keep the last known numbers — a failed read is not a zero count. */
      }
    };

    liveLoadRef.current = load;
    load();
    window.addEventListener(CONSOLE_COUNTS_CHANGED_EVENT, load);
    window.addEventListener("focus", load);

    return () => {
      window.removeEventListener(CONSOLE_COUNTS_CHANGED_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, [pathname]);

  useLiveRefresh(["console:nav-counts"], loadFromLive);

  return counts;
}
