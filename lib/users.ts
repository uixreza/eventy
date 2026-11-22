import "server-only";

import { prisma } from "@/lib/prisma";
import { dateToJalali, formatJalaliDateTime, formatJalaliFull } from "@/lib/jalali";
import { toFa } from "@/lib/utils";
import type { EventLifecycle, RegistrationState } from "@/lib/event-types";
import type {
  ConsoleUserDetail,
  ConsoleUserRow,
} from "@/lib/user-types";

/**
 * Data Access Layer for client accounts, for the admin console.
 *
 * Deliberately uncached, exactly like the moderation reads in
 * `lib/events.ts`: an admin has to see the database as it is right now —
 * a signup from a minute ago is already in the list, and a ban, a role
 * change or a profile edit lands on the very next fetch.
 */

/** «۱۴۰۳/۰۲/۱۵» — a date-only value, the way the profile form speaks. */
function jalaliDay(date: Date): string {
  const { jy, jm, jd } = dateToJalali(date);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${toFa(jy)}/${toFa(pad(jm))}/${toFa(pad(jd))}`;
}

/**
 * Every account, for the clients table in `/console/users`, newest member
 * first, each line carrying its two activity counts so the table needs no
 * second round trip.
 */
export async function getConsoleUsers(): Promise<ConsoleUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { hostedEvents: true, registrations: true } } },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    bannedAt: user.bannedAt?.toISOString() ?? null,
    joined: formatJalaliFull(user.createdAt),
    eventCount: user._count.hostedEvents,
    registrationCount: user._count.registrations,
  }));
}

/**
 * One account in full — the profile, every event it created (with live
 * confirmed-seat counts) and every ticket it holds, so the detail modal
 * can show who this person is and what they have done on the platform.
 * `null` when there is no such account.
 */
export async function getConsoleUser(userId: string): Promise<ConsoleUserDetail | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      hostedEvents: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, startsAt: true, capacity: true },
      },
      registrations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          event: { select: { id: true, title: true, startsAt: true } },
        },
      },
    },
  });
  if (!user) return null;

  /* Confirmed seats per hosted event — the same number the moderation
     table prints, read straight from the registrations. */
  const eventId = user.hostedEvents.map((event) => event.id);
  const counts = eventId.length
    ? await prisma.registration.groupBy({
        by: ["eventId"],
        where: { eventId: { in: eventId }, status: "CONFIRMED" },
        _count: { _all: true },
      })
    : [];
  const confirmed = new Map(counts.map((row) => [row.eventId, row._count._all]));

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    nationalId: user.nationalId,
    birthDate: jalaliDay(user.birthDate),
    role: user.role,
    bannedAt: user.bannedAt?.toISOString() ?? null,
    joined: formatJalaliFull(user.createdAt),
    updatedAt: user.updatedAt.toISOString(),
    hostedEvents: user.hostedEvents.map((event) => ({
      id: event.id,
      title: event.title,
      status: event.status as EventLifecycle,
      dateTime: formatJalaliDateTime(event.startsAt),
      capacity: event.capacity,
      registered: confirmed.get(event.id) ?? 0,
    })),
    registrations: user.registrations.map((registration) => ({
      registrationId: registration.id,
      eventId: registration.event.id,
      title: registration.event.title,
      status: registration.status as RegistrationState,
      dateTime: formatJalaliDateTime(registration.event.startsAt),
    })),
  };
}
