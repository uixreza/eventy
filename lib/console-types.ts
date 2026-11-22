/**
 * The shapes the console home (`/console`) renders.
 *
 * Everything here is a plain, serializable value assembled on the server by
 * `lib/console.ts`; the client only ever sees these — never a Prisma object.
 * Numbers arrive already formatted for display (Persian digits, grouped),
 * because the page is a leaf and does no arithmetic of its own.
 */

import type { BroadcastNotice } from "@/lib/broadcast-types";

/** Which stat card a number belongs to — the page keys its icon off this. */
export type ConsoleStatKey = "published" | "users" | "approvedToday" | "revenue";

export type ConsoleStat = {
  key: ConsoleStatKey;
  /** Display value, e.g. «۲۴۳» or «۹۴.۲M». */
  value: string;
  /** The small line under the value, e.g. «+۱۲ این هفته». */
  change: string;
  /**
   * True when no table backs the number. The card then wears a «داده نمونه»
   * badge so nobody mistakes a placeholder for a live figure.
   */
  mock: boolean;
};

/** The two moderation states a row in «در انتظار بررسی» can be in. */
export type ConsoleReviewStatus = "PENDING" | "REJECTED";

export type ConsoleReviewRow = {
  id: string;
  title: string;
  organizer: string;
  /** «۲۸ آبان» — the day the event starts. */
  date: string;
  status: ConsoleReviewStatus;
};

export type ConsoleAlertLevel = "amber" | "red" | "emerald" | "blue";

export type ConsoleAlert = {
  id: string;
  text: string;
  level: ConsoleAlertLevel;
  /** Same contract as `ConsoleStat.mock`. */
  mock: boolean;
};

export type ConsoleOverview = {
  stats: ConsoleStat[];
  /** Events waiting on an admin, oldest first. */
  reviews: ConsoleReviewRow[];
  alerts: ConsoleAlert[];
  /** The ten most recent global notifications, newest first. */
  broadcasts: BroadcastNotice[];
};
