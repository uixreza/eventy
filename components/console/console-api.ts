"use client";

import type { ConsoleCategory } from "@/lib/category-types";
import type { ConsoleOverview } from "@/lib/console-types";
import type { ConsoleEventDetail, ConsoleEventRow } from "@/lib/event-types";
import type { ConsoleReports } from "@/lib/report-types";
import type { ConsoleUserDetail, ConsoleUserRow } from "@/lib/user-types";

/**
 * The console's read side, spoken as plain GETs — the same shape the
 * dashboard uses (`components/dashboard/dashboard-api.ts`): the browser
 * asks `app/api/console/*` for its rows, Prisma stays behind the route
 * handlers, and `no-store` keeps every load on the current database state.
 */

async function getJson<T>(path: string): Promise<T> {
  /* `no-store` keeps the browser and React from reusing an earlier answer. */
  const res = await fetch(path, { cache: "no-store" });
  /* A non-OK status means the read itself failed — the caller shows its
     retry state; a missing event arrives as a plain `null` body instead. */
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** `GET /api/console/events` — the whole moderation queue, newest first. */
export function fetchConsoleEvents() {
  return getJson<{ events: ConsoleEventRow[] }>("/api/console/events");
}

/** `GET /api/console/events/[id]` — one event in full, or `null`. */
export function fetchConsoleEvent(id: string) {
  return getJson<ConsoleEventDetail | null>(
    `/api/console/events/${encodeURIComponent(id)}`,
  );
}

/** `GET /api/console/users` — every account, newest first, plus our own id. */
export function fetchConsoleUsers() {
  return getJson<{ users: ConsoleUserRow[]; me: string }>("/api/console/users");
}

/** `GET /api/console/users/[id]` — one account in full, or `null`. */
export function fetchConsoleUser(id: string) {
  return getJson<ConsoleUserDetail | null>(
    `/api/console/users/${encodeURIComponent(id)}`,
  );
}

/** `GET /api/console/categories` — every category with its live event count. */
export function fetchConsoleCategories() {
  return getJson<{ categories: ConsoleCategory[] }>("/api/console/categories");
}

/** `GET /api/console/overview` — the home page's live numbers. */
export function fetchConsoleOverview() {
  return getJson<{ overview: ConsoleOverview }>("/api/console/overview");
}

/** `GET /api/console/reports` — the analytics page's live numbers. */
export function fetchConsoleReports() {
  return getJson<{ reports: ConsoleReports }>("/api/console/reports");
}
