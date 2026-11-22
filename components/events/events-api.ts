"use client";

import type { EventDetails } from "@/lib/data";
import type { EventCard, RegistrationState } from "@/lib/event-types";

/**
 * The public events read side, spoken as plain GETs — the same shape the
 * dashboard uses (`components/dashboard/dashboard-api.ts`): the browser
 * asks `app/api/events/*` for its rows, Prisma stays behind the route
 * handlers, and `no-store` keeps every load on the current database state.
 */

/** `GET /api/events` — every published event, newest first. */
export type EventListData = {
  events: EventCard[];
};

/** Whether the visitor is signed in, and the ticket they hold if any. */
export type EnrollmentData = {
  signedIn: boolean;
  registration: { id: string; status: RegistrationState; ticketCode: string } | null;
};

/**
 * `GET /api/events/[slug]` — one event with its page copy. `null` means
 * the slug has no published event behind it (a normal answer, not a
 * failure), so the caller can render its not-found state.
 */
export type EventDetailData = {
  event: EventCard;
  details: EventDetails;
  similar: EventCard[];
  enrollment: EnrollmentData;
};

async function getJson<T>(path: string): Promise<T> {
  /* `no-store` keeps the browser and React from reusing an earlier answer. */
  const res = await fetch(path, { cache: "no-store" });
  /* A non-OK status means the read itself failed — the caller shows its
     retry state; a missing slug arrives as a plain `null` body instead. */
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

export function fetchPublishedEvents() {
  return getJson<EventListData>("/api/events");
}

export function fetchEventBySlug(slug: string) {
  return getJson<EventDetailData | null>(`/api/events/${encodeURIComponent(slug)}`);
}
