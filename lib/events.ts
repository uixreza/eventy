import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  dateToJalali,
  eventTimeStatus,
  formatJalaliDate,
  formatJalaliDateTime,
  formatJalaliTime,
  isPast,
} from "@/lib/jalali";
import { browseEventDetails, type EventAgendaItem, type EventDetails } from "@/lib/data";
import { getCategoryIcons } from "@/lib/categories";
import { FALLBACK_ICON } from "@/lib/category-icons";
import type {
  ConsoleEventDetail,
  ConsoleEventRow,
  EnrolledEvent,
  EventCard,
  EventLifecycle,
  EventMode,
  HostedEvent,
  RegistrationState,
} from "@/lib/event-types";

/**
 * Data Access Layer for events.
 *
 * Every read of the event tables goes through this module, so the rules
 * (which events are public, how a row becomes a card, which cache tag
 * invalidates it) live in one place. Public reads are cached with
 * `use cache` — a mutation invalidates them with `updateTag` (see
 * `app/actions/events.ts`). The per-person reads are the exception: the
 * bookmark list and the dashboard's hosted/enrolled lists always hit the
 * database, so a load can never show a stale page.
 */

/** The subset of an event row the cards need. */
type EventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  venue: string;
  mode: "INPERSON" | "ONLINE";
  startsAt: Date;
  capacity: number | null;
  price: number | null;
  coverGradient: string;
  status: string;
  organizerName: string;
};

type TicketCounts = { confirmed: number; waitlist: number };

/** How many tickets each event holds, split by ticket state. */
async function countTickets(eventIds: string[]): Promise<Map<string, TicketCounts>> {
  const counts = new Map<string, TicketCounts>();
  if (eventIds.length === 0) return counts;

  const rows = await prisma.registration.groupBy({
    by: ["eventId", "status"],
    where: { eventId: { in: eventIds }, status: { in: ["CONFIRMED", "WAITLIST"] } },
    _count: { _all: true },
  });

  for (const row of rows) {
    const entry = counts.get(row.eventId) ?? { confirmed: 0, waitlist: 0 };
    if (row.status === "CONFIRMED") entry.confirmed += row._count._all;
    else entry.waitlist += row._count._all;
    counts.set(row.eventId, entry);
  }

  return counts;
}

function toCard(
  event: EventRow,
  confirmed: number,
  categoryIcons: Record<string, string>,
): EventCard {
  const status = eventTimeStatus(event.startsAt);
  const parts = dateToJalali(event.startsAt);

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    category: event.category,
    categoryIcon: categoryIcons[event.category] ?? FALLBACK_ICON,
    city: event.city,
    venue: event.venue,
    mode: event.mode as EventMode,
    date: formatJalaliDate(event.startsAt),
    time: formatJalaliTime(event.startsAt),
    dateTime: formatJalaliDateTime(event.startsAt),
    status,
    price: event.price,
    /* An event that is over no longer has seats to hand out; one with no
       fixed capacity has no seat count at all. */
    seatsLeft:
      status === "ended" || event.capacity === null
        ? null
        : Math.max(0, event.capacity - confirmed),
    registered: confirmed,
    capacity: event.capacity,
    organizer: event.organizerName,
    gradient: event.coverGradient,
    jy: parts.jy,
    jm: parts.jm,
    jd: parts.jd,
  };
}

/**
 * Every published event — the list of `/events`.
 *
 * Only `PUBLISHED` rows are visible: an event waiting for moderation or sent
 * back for changes must never reach the public pages. Newest first, so a
 * freshly published event heads the list.
 */
export async function getPublishedEvents(): Promise<EventCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  /* Cards now wear the category's glyph, so an icon change invalidates too. */
  cacheTag("categories");

  const [events, categoryIcons] = await Promise.all([
    prisma.event.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    }),
    getCategoryIcons(),
  ]);

  const counts = await countTickets(events.map((event) => event.id));
  return events.map((event) =>
    toCard(event, counts.get(event.id)?.confirmed ?? 0, categoryIcons),
  );
}

/**
 * The landing section's «رویدادهای داغ و برگزیده این هفته».
 *
 * Published events that have not started yet, soonest first. A card on the
 * landing page offers a seat, so an event whose start time has passed must
 * never appear here — the grid shows what is actually open for sign-up, and
 * the six nearest fill it. Same cache contract as `getPublishedEvents`, so
 * every publish/edit lands on the next render.
 */
export async function getHotEvents(): Promise<EventCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  cacheTag("categories");

  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 6,
  });

  const [counts, categoryIcons] = await Promise.all([
    countTickets(events.map((event) => event.id)),
    getCategoryIcons(),
  ]);

  return events.map((event) =>
    toCard(event, counts.get(event.id)?.confirmed ?? 0, categoryIcons),
  );
}

/**
 * The `agenda` JSON column as the page's rows. Anything that is not a
 * `{ time, title }` pair is dropped, so a hand-edited row can never crash
 * the detail page.
 */
function parseAgenda(value: unknown): EventAgendaItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as { time?: unknown; title?: unknown };
    const time = typeof record.time === "string" ? record.time.trim() : "";
    const title = typeof record.title === "string" ? record.title.trim() : "";
    return time && title ? [{ time, title }] : [];
  });
}

/**
 * One event, by its URL slug, with the long-form copy of its page.
 *
 * The seeded events keep their hand-written copy (`lib/data.ts`); anything
 * created on the platform gets a description built from its own fields and
 * the highlights/agenda the organizer typed into the wizard.
 */
export async function getEventBySlug(
  slug: string,
): Promise<{ event: EventCard; details: EventDetails } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  cacheTag("categories");

  const event = await prisma.event.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  if (!event) return null;

  cacheTag(`event:${event.id}`);

  const [counts, categoryIcons] = await Promise.all([
    countTickets([event.id]),
    getCategoryIcons(),
  ]);
  const card = toCard(event, counts.get(event.id)?.confirmed ?? 0, categoryIcons);

  const copy = browseEventDetails[slug];
  const details: EventDetails = copy ?? {
    about: [
      `«${event.title}» توسط ${event.organizerName} در ${event.venue} شهر ${event.city} برگزار می‌شود.`,
      event.summary || event.description,
    ].filter(Boolean),
    /* Both lists come from the wizard; an empty one hides its section. */
    highlights: event.highlights,
    agenda: parseAgenda(event.agenda),
  };

  return { event: card, details };
}

/** Other published events of the same category — the «رویدادهای مشابه» list. */
export async function getSimilarEvents(eventId: string, category: string): Promise<EventCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  cacheTag("categories");

  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", category },
    orderBy: { startsAt: "asc" },
    take: 4,
  });
  const [counts, categoryIcons] = await Promise.all([
    countTickets(events.map((event) => event.id)),
    getCategoryIcons(),
  ]);

  return events
    .filter((event) => event.id !== eventId)
    .slice(0, 3)
    .map((event) => toCard(event, counts.get(event.id)?.confirmed ?? 0, categoryIcons));
}

/**
 * The events this user created — the «رویدادهای من» tab and the dashboard
 * overview.
 *
 * Deliberately **not** cached, unlike the public event reads: the dashboard
 * must show the tables as they are right now. A registration someone else
 * makes changes this user's `registered` count, and no cache tag of theirs
 * would be invalidated for it; an admin's approval, a seed run or a direct
 * database edit has the same problem. Reading on every load is the only way
 * the page can promise it matches the database.
 */
export async function getHostedEvents(userId: string): Promise<HostedEvent[]> {
  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    orderBy: { startsAt: "asc" },
  });

  const counts = await countTickets(events.map((event) => event.id));

  return events.map((event) => {
    const parts = dateToJalali(event.startsAt);
    const count = counts.get(event.id) ?? { confirmed: 0, waitlist: 0 };

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      category: event.category,
      city: event.city,
      venue: event.venue,
      mode: event.mode as EventMode,
      dateTime: formatJalaliDateTime(event.startsAt),
      date: formatJalaliDate(event.startsAt),
      time: formatJalaliTime(event.startsAt),
      status: event.status as EventLifecycle,
      capacity: event.capacity,
      registered: count.confirmed,
      waitlist: count.waitlist,
      price: event.price,
      gradient: event.coverGradient,
      jy: parts.jy,
      jm: parts.jm,
      jd: parts.jd,
      createdAt: event.createdAt.toISOString(),
      isPast: isPast(event.startsAt),
    };
  });
}

/**
 * The events this user enrolled in — the «ثبت‌نام‌های من» tab and the
 * dashboard overview.
 *
 * Uncached for the same reason as `getHostedEvents`: the ticket state shown
 * on the dashboard has to be the row that exists now, including changes an
 * admin or another process made outside this app's own actions.
 */
export async function getEnrolledEvents(userId: string): Promise<EnrolledEvent[]> {
  const registrations = await prisma.registration.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { event: true },
  });

  return registrations.map((registration) => {
    const event = registration.event;
    const parts = dateToJalali(event.startsAt);

    return {
      registrationId: registration.id,
      eventId: event.id,
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      category: event.category,
      city: event.city,
      venue: event.venue,
      mode: event.mode as EventMode,
      dateTime: formatJalaliDateTime(event.startsAt),
      date: formatJalaliDate(event.startsAt),
      time: formatJalaliTime(event.startsAt),
      status: registration.status as RegistrationState,
      eventStatus: event.status as EventLifecycle,
      price: event.price,
      gradient: event.coverGradient,
      jy: parts.jy,
      jm: parts.jm,
      jd: parts.jd,
      /* A waiting person has no seat yet, so there is no ticket to show. */
      ticket: registration.status === "WAITLIST" ? null : registration.ticketCode,
      reminder: registration.reminder,
      isPast: isPast(event.startsAt),
    };
  });
}

/**
 * The ids of the events a person saved — what fills the heart on the cards.
 * Read fresh on every call: bookmarks change on each click, and a cached
 * entry could be re-populated by a concurrent read that started before
 * the write, serving an empty list until the entry expired.
 */
export async function getBookmarkedIds(userId: string): Promise<string[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { eventId: true },
  });
  return bookmarks.map((bookmark) => bookmark.eventId);
}

/**
 * The saved events themselves — the `/dashboard/saved` list. Only published
 * events come back: one that comes down from the site disappears from the
 * list along with it.
 *
 * Deliberately uncached (see `getBookmarkedIds`): the page must show the
 * current bookmarks the moment it loads, never a cached snapshot.
 */
export async function getBookmarkedEvents(userId: string): Promise<EventCard[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, event: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    include: { event: true },
  });

  const [counts, categoryIcons] = await Promise.all([
    countTickets(bookmarks.map((bookmark) => bookmark.eventId)),
    getCategoryIcons(),
  ]);
  return bookmarks.map((bookmark) =>
    toCard(bookmark.event, counts.get(bookmark.eventId)?.confirmed ?? 0, categoryIcons),
  );
}

/**
 * The event an organizer is editing. Only their own event comes back —
 * the caller's id is part of the query, never a parameter.
 */
export async function getHostedEvent(
  eventId: string,
  userId: string,
): Promise<{
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  city: string;
  venue: string;
  mode: EventMode;
  onlineUrl: string | null;
  capacity: number | null;
  highlights: string[];
  agenda: EventAgendaItem[];
  price: number | null;
  gradient: string;
  status: EventLifecycle;
  dateTime: string;
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
} | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`user-events:${userId}`);

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: userId },
  });
  if (!event) return null;

  const parts = dateToJalali(event.startsAt);

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    description: event.description,
    category: event.category,
    city: event.city,
    venue: event.venue,
    mode: event.mode as EventMode,
    onlineUrl: event.onlineUrl,
    capacity: event.capacity,
    highlights: event.highlights,
    agenda: parseAgenda(event.agenda),
    price: event.price,
    gradient: event.coverGradient,
    status: event.status as EventLifecycle,
    dateTime: formatJalaliDateTime(event.startsAt),
    jy: parts.jy,
    jm: parts.jm,
    jd: parts.jd,
    hour: parts.hh,
    minute: parts.mm,
  };
}

/** The ticket a person holds for an event — `null` when they have none. */
export async function getRegistration(
  eventId: string,
  userId: string,
): Promise<{ id: string; status: RegistrationState; ticketCode: string } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`user-registrations:${userId}`);
  cacheTag(`event:${eventId}`);

  const registration = await prisma.registration.findFirst({
    where: { eventId, userId },
  });
  if (!registration) return null;

  return {
    id: registration.id,
    status: registration.status as RegistrationState,
    ticketCode: registration.ticketCode,
  };
}

/**
 * Every event, for the moderation table in `/console/events`.
 *
 * Deliberately uncached: an admin has to see the database exactly as it is
 * right now — an event created a moment ago is already here, and a review
 * result or an edit lands without waiting for a cache to expire.
 */
export async function getConsoleEvents(): Promise<ConsoleEventRow[]> {
  const events = await prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  const counts = await countTickets(events.map((event) => event.id));

  return events.map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    category: event.category,
    city: event.city,
    venue: event.venue,
    dateTime: formatJalaliDateTime(event.startsAt),
    status: event.status as EventLifecycle,
    capacity: event.capacity,
    registered: counts.get(event.id)?.confirmed ?? 0,
    price: event.price,
    organizer: event.organizerName,
    gradient: event.coverGradient,
    createdAt: event.createdAt.toISOString(),
  }));
}

/**
 * One event in full — every field the review modal and the console edit
 * form need, including the long description the table never shows, the
 * organizer's account, and the live ticket counts. Also uncached, for the
 * same reason as the list above. `null` when there is no such event.
 */
export async function getConsoleEvent(eventId: string): Promise<ConsoleEventDetail | null> {
  const event = await prisma.event.findFirst({
    where: { id: eventId },
    include: { organizer: { select: { id: true, name: true, phone: true } } },
  });
  if (!event) return null;

  const counts = await countTickets([event.id]);
  const confirmed = counts.get(event.id)?.confirmed ?? 0;
  const waitlist = counts.get(event.id)?.waitlist ?? 0;
  const saved = await prisma.bookmark.count({ where: { eventId: event.id } });
  const parts = dateToJalali(event.startsAt);

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    description: event.description,
    category: event.category,
    city: event.city,
    venue: event.venue,
    mode: event.mode as EventMode,
    onlineUrl: event.onlineUrl,
    status: event.status as EventLifecycle,
    dateTime: formatJalaliDateTime(event.startsAt),
    jy: parts.jy,
    jm: parts.jm,
    jd: parts.jd,
    hour: parts.hh,
    minute: parts.mm,
    capacity: event.capacity,
    highlights: event.highlights,
    agenda: parseAgenda(event.agenda),
    price: event.price,
    gradient: event.coverGradient,
    organizerName: event.organizerName,
    organizer: event.organizer
      ? { id: event.organizer.id, name: event.organizer.name, phone: event.organizer.phone }
      : null,
    confirmed,
    waitlist,
    /* Raw numbers on purpose — an admin wants the truth, not the card's
       «sold out» shorthand for an event that is already over. */
    seatsLeft:
      event.capacity === null
        ? null
        : Math.max(0, event.capacity - confirmed),
    saved,
    startsAt: event.startsAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
