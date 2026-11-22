import "server-only";

import { prisma } from "@/lib/prisma";
import {
  dateToJalali,
  formatJalaliDate,
  formatJalaliDateTime,
  formatJalaliFull,
  formatJalaliTime,
  inIran,
  iranDayStart,
  realInstant,
  todayJalali,
} from "@/lib/jalali";
import type {
  DashboardNotification,
  NotificationGroup,
} from "@/lib/notification-types";
import { toFa } from "@/lib/utils";

const DAY_MS = 86_400_000;
/** A reminder shows up this close to the event, never earlier. */
const REMINDER_WINDOW_MS = 7 * DAY_MS;
/** A saved event starts warning about its seats at this fill rate. */
const SEAT_ALERT_PERCENT = 80;
/** The feed is a page, not an archive. */
const MAX_ITEMS = 40;

/** The day bucket and the «۲ ساعت پیش» line for one real instant. */
function timing(
  instant: Date,
  now: Date,
): { group: NotificationGroup; time: string } {
  /* `instant` is genuine UTC; the calendar helpers speak the Iranian wall
     clock, so shift before asking which Jalali day it is. */
  const wall = inIran(instant);
  const { jy, jm, jd } = dateToJalali(wall);
  const start = iranDayStart(jy, jm, jd);
  const today = todayJalali();
  const todayStart = iranDayStart(today.jy, today.jm, today.jd);
  const dayDiff = Math.round(
    (todayStart.getTime() - start.getTime()) / DAY_MS,
  );
  const clock = formatJalaliTime(wall);

  /* Still ahead: a reminder for an event that has not started. */
  if (instant.getTime() > now.getTime()) {
    if (dayDiff === 0) return { group: "upcoming", time: `امروز، ${clock}` };
    if (dayDiff === -1) return { group: "upcoming", time: `فردا، ${clock}` };
    return {
      group: "upcoming",
      time: `${toFa(-dayDiff)} روز دیگر، ${clock}`,
    };
  }

  if (dayDiff === 0) {
    const minutes = Math.floor((now.getTime() - instant.getTime()) / 60_000);
    if (minutes < 1) return { group: "today", time: "همین حالا" };
    if (minutes < 60)
      return { group: "today", time: `${toFa(minutes)} دقیقه پیش` };
    return {
      group: "today",
      time: `${toFa(Math.floor(minutes / 60))} ساعت پیش`,
    };
  }

  if (dayDiff === 1) return { group: "yesterday", time: `دیروز، ${clock}` };
  if (dayDiff < 7)
    return { group: "week", time: `${toFa(dayDiff)} روز پیش` };

  const sameYear = jy === today.jy;
  return {
    group: "earlier",
    time: sameYear ? formatJalaliDate(wall) : formatJalaliFull(wall),
  };
}

/** Where an event is held, for reminder lines. */
function place(city: string, venue: string): string {
  return venue || city;
}

/**
 * Everything `/dashboard/notifications` shows, built from the tables.
 *
 * Nothing here is stored as a notification: each row is a *consequence* of
 * data that does exist, computed fresh on every load —
 *
 * - a `Broadcast` (the console's global announcements),
 * - a `Registration`: the ticket that was issued, the waitlist it joined,
 *   the reminder it asked for, or the cancellation it received,
 * - a hosted `Event`'s moderation status: waiting, published, rejected, or
 *   cancelled,
 * - a `Bookmark` on a published event that has almost no seats left.
 *
 * Read state is not in the database (there is no column for it) — the page
 * remembers which ids this browser has read, the same contract the global
 * broadcast toasts use. The *content*, which is what has to match the
 * database, is always this answer.
 *
 * Deliberately uncached, like the other dashboard reads: a registration made
 * a second ago must be on the next load.
 */
export async function getDashboardNotifications(
  userId: string,
): Promise<DashboardNotification[]> {
  const now = new Date();

  const [broadcasts, registrations, hosted, bookmarks] = await Promise.all([
    prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, body: true, createdAt: true },
    }),
    prisma.registration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        reminder: true,
        ticketCode: true,
        createdAt: true,
        updatedAt: true,
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            city: true,
            venue: true,
            startsAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.event.findMany({
      where: { organizerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.bookmark.findMany({
      where: { userId, event: { status: "PUBLISHED" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            startsAt: true,
            capacity: true,
            _count: {
              select: {
                registrations: { where: { status: "CONFIRMED" } },
              },
            },
          },
        },
      },
    }),
  ]);

  const items: DashboardNotification[] = [];

  /* ── Global announcements ─────────────────────────────────────── */
  for (const broadcast of broadcasts) {
    items.push({
      id: `broadcast:${broadcast.id}`,
      kind: "broadcast",
      title: broadcast.title,
      description: broadcast.body || "اعلان سراسری رویدادشو",
      at: broadcast.createdAt.toISOString(),
      ...timing(broadcast.createdAt, now),
    });
  }

  /* ── Tickets, waitlists, reminders, cancellations ─────────────── */
  for (const registration of registrations) {
    const event = registration.event;
    const href = `/events/${event.slug}`;

    if (registration.status === "CONFIRMED") {
      items.push({
        id: `ticket:${registration.id}`,
        kind: "ticket",
        title: "بلیت شما صادر شد",
        description: `بلیت «${event.title}» با کد ${registration.ticketCode} آماده است.`,
        href,
        at: registration.createdAt.toISOString(),
        ...timing(registration.createdAt, now),
      });

      /* The reminder the person asked for, once the event is close enough
         to be worth it — and only while the event is still on the site. */
      const startsAt = realInstant(event.startsAt);
      const untilStart = startsAt.getTime() - now.getTime();
      if (
        registration.reminder &&
        event.status === "PUBLISHED" &&
        untilStart > 0 &&
        untilStart <= REMINDER_WINDOW_MS
      ) {
        const where = place(event.city, event.venue);
        items.push({
          id: `reminder:${registration.id}:${event.startsAt.toISOString()}`,
          kind: "reminder",
          title: `یادآوری: ${event.title}`,
          description: `${formatJalaliDateTime(event.startsAt)}${
            where ? ` — ${where}` : ""
          }`,
          href,
          at: startsAt.toISOString(),
          ...timing(startsAt, now),
        });
      }
    } else if (registration.status === "WAITLIST") {
      items.push({
        id: `waitlist:${registration.id}`,
        kind: "waitlist",
        title: "در لیست انتظار قرار گرفتید",
        description: `ظرفیت «${event.title}» پر است؛ اگر جای خالی شود خبرتان می‌کنیم.`,
        href,
        at: registration.createdAt.toISOString(),
        ...timing(registration.createdAt, now),
      });
    } else {
      items.push({
        id: `cancelled-registration:${registration.id}`,
        kind: "cancelled",
        title: "ثبت‌نام شما لغو شد",
        description: `ثبت‌نام «${event.title}» لغو شد و جایگاه شما آزاد شد.`,
        href,
        at: registration.updatedAt.toISOString(),
        ...timing(registration.updatedAt, now),
      });
    }
  }

  /* ── Moderation of the events this person organizes ───────────── */
  for (const event of hosted) {
    const href = `/dashboard/events/${event.id}/edit`;
    const copy =
      event.status === "PENDING"
        ? {
            kind: "pending" as const,
            title: "رویداد شما در انتظار بررسی است",
            description: `«${event.title}» پس از بررسی کارشناسان منتشر می‌شود.`,
            at: event.createdAt,
          }
        : event.status === "PUBLISHED"
          ? {
              kind: "published" as const,
              title: "رویداد شما منتشر شد",
              description: `«${event.title}» روی سایت منتشر شد و ثبت‌نام باز است.`,
              at: event.updatedAt,
            }
          : event.status === "REJECTED"
            ? {
                kind: "rejected" as const,
                title: "رویداد شما تأیید نشد",
                description: `«${event.title}» به ویرایش نیاز دارد؛ اصلاحش کنید و دوباره بفرستید.`,
                at: event.updatedAt,
              }
            : event.status === "CANCELLED"
              ? {
                  kind: "cancelled" as const,
                  title: "رویداد شما لغو شد",
                  description: `«${event.title}» از تقویم رویدادها برداشته شد.`,
                  at: event.updatedAt,
                }
              : null;

    /* A draft is private work in progress — nobody needs telling about it. */
    if (!copy) continue;

    items.push({
      id: `host:${event.id}:${event.status}`,
      href,
      ...copy,
      at: copy.at.toISOString(),
      ...timing(copy.at, now),
    });
  }

  /* ── Saved events that are running out of seats ───────────────── */
  for (const { event } of bookmarks) {
    /* An event with no fixed capacity never runs out of seats. */
    if (event.capacity === null || event.capacity <= 0) continue;
    if (realInstant(event.startsAt).getTime() <= now.getTime()) continue;

    const confirmed = event._count.registrations;
    const seatsLeft = event.capacity - confirmed;
    if (seatsLeft <= 0) continue;
    if ((confirmed / event.capacity) * 100 < SEAT_ALERT_PERCENT) continue;

    items.push({
      id: `seat:${event.id}`,
      kind: "seat",
      title: "ظرفیت رویداد ذخیره‌شده رو به اتمام است",
      description: `«${event.title}» فقط ${toFa(seatsLeft)} جایگاه آزاد دارد؛ اگر می‌خواهید شرکت کنید عجله کنید.`,
      href: `/events/${event.slug}`,
      at: now.toISOString(),
      ...timing(now, now),
    });
  }

  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ITEMS);
}
