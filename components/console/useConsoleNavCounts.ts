"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
 * on `pathname` as well as running on mount. Mutations in the loaded pages
 * broadcast the event above; returning to the tab re-reads too, so a change
 * made elsewhere is picked up without a manual reload.
 */
export function useConsoleNavCounts(): ConsoleNavCounts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<ConsoleNavCounts>(EMPTY_COUNTS);

  useEffect(() => {
    let cancelled = false;
    let requestId = 0;

    const load = async () => {
      const id = ++requestId;
      try {
        const response = await fetchConsoleNavCounts();
        if (!cancelled && id === requestId) setCounts(response.counts);
      } catch {
        /* Keep the last known numbers — a failed read is not a zero count. */
      }
    };

    load();
    window.addEventListener(CONSOLE_COUNTS_CHANGED_EVENT, load);
    window.addEventListener("focus", load);

    return () => {
      cancelled = true;
      window.removeEventListener(CONSOLE_COUNTS_CHANGED_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, [pathname]);

  return counts;
}
