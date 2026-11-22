"use client";

import type { EventCard, EnrolledEvent, HostedEvent } from "@/lib/event-types";
import type { NotificationFeed } from "@/lib/notification-types";
import type { EventFormValues } from "./NewEventForm";
import type { SettingsInitial } from "./SettingsForm";

/**
 * The dashboard's read side, spoken as plain GETs.
 *
 * Every dashboard route is a client route: when one loads, the browser
 * asks one of these endpoints for its rows. Prisma lives behind the route
 * handlers in `app/api/dashboard/*` — the session only decides whose rows
 * come back, and no cache sits in between, so every load sees the current
 * database state.
 */

export type OverviewData = {
  userName: string;
  hosted: HostedEvent[];
  enrolled: EnrolledEvent[];
  /** How many events this person has saved — the heart rows, live. */
  savedCount: number;
};

export type MyEventsData = {
  hosted: HostedEvent[];
  enrolled: EnrolledEvent[];
};

export type EditEventData = {
  organizerName: string;
  initial: EventFormValues;
};

async function getJson<T>(path: string): Promise<T> {
  /* `no-store` keeps the browser and React from reusing an earlier answer. */
  const res = await fetch(path, { cache: "no-store" });
  /* 401/404 mean the session ended — the caller shows its retry state. */
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

export function fetchOverview() {
  return getJson<OverviewData>("/api/dashboard/overview");
}

export function fetchMyEvents() {
  return getJson<MyEventsData>("/api/dashboard/events");
}

export function fetchSavedEvents() {
  return getJson<EventCard[]>("/api/dashboard/saved");
}

/** `GET /api/dashboard/notifications` — the feed derived from the tables. */
export function fetchNotifications() {
  return getJson<NotificationFeed>("/api/dashboard/notifications");
}

export function fetchProfile() {
  return getJson<SettingsInitial>("/api/dashboard/profile");
}

export function fetchOrganizerName() {
  return getJson<{ name: string }>("/api/dashboard/organizer");
}

export function fetchEventForEdit(eventId: string) {
  return getJson<EditEventData | null>(`/api/dashboard/events/${eventId}`);
}
