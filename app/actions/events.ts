"use server";

import { randomInt } from "node:crypto";
import { updateTag } from "next/cache";
import { jalaaliMonthLength } from "jalaali-js";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getBookmarkedIds } from "@/lib/events";
import { jalaliToDate, dateToJalali, realInstant } from "@/lib/jalali";

/**
 * Every write to the event tables.
 *
 * The rules are repeated here on purpose: the forms check the same things for
 * fast feedback, but a server action is reachable by a direct POST, so the
 * server is the one that decides. Each action reads the session itself and
 * only ever touches the rows the signed-in person owns.
 */

export type EventAgendaRow = { time: string; title: string };

export type EventInput = {
  title: string;
  category: string;
  description: string;
  /** Jalali start date and time, exactly as the wheel picked them. */
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
  mode: "INPERSON" | "ONLINE";
  venue: string;
  city: string;
  onlineUrl: string;
  /** `null` when the organizer left the capacity undefined. */
  capacity: number | null;
  /** «چه چیزی در انتظارتان است؟» bullets, in order. */
  highlights: string[];
  /** «برنامه زمانی» rows, in order. */
  agenda: EventAgendaRow[];
  /** `null` for a free event. */
  price: number | null;
  coverGradient: string;
};

export type EventActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string };

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 500;
const MAX_CAPACITY = 100_000;
const MAX_PRICE = 100_000_000;
const MAX_HIGHLIGHTS = 10;
const MAX_HIGHLIGHT_LENGTH = 120;
const MAX_AGENDA_ROWS = 15;
const MAX_AGENDA_TIME = 24;
const MAX_AGENDA_TITLE = 120;

/** The gradients the cover picker offers. */
const COVER_GRADIENTS = [
  "from-blue-600 via-indigo-500 to-purple-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-pink-500 via-rose-500 to-fuchsia-600",
  "from-violet-600 via-fuchsia-500 to-pink-500",
  "from-orange-500 via-rose-500 to-pink-600",
  "from-indigo-500 via-blue-500 to-sky-600",
];

/** A readable URL segment — Persian letters are kept, they are valid in a path. */
function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "event";
}

/** A slug that is not taken yet. */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate =
      attempt === 0 ? base : `${base}-${randomInt(100, 999)}`;
    const taken = await prisma.event.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** A printed ticket code, e.g. `RD-2481`. */
async function uniqueTicketCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `RD-${randomInt(1000, 9999)}`;
    const taken = await prisma.registration.findUnique({
      where: { ticketCode: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `RD-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * The shared validation of the event form. Returns the cleaned input or the
 * Persian message that explains what is wrong.
 */
type ValidatedEvent = {
  title: string;
  category: string;
  description: string;
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
  venue: string;
  city: string;
  mode: "INPERSON" | "ONLINE";
  capacity: number | null;
  highlights: string[];
  agenda: EventAgendaRow[];
  price: number | null;
  coverGradient: string;
  onlineUrl: string | null;
  startsAt: Date;
};

function validate(
  input: EventInput,
  options: { isNew: boolean },
): { ok: true; value: ValidatedEvent } | { ok: false; error: string } {
  const title = input.title.replace(/\s+/g, " ").trim();
  if (title.length < 5) {
    return { ok: false, error: "عنوان رویداد باید حداقل ۵ حرف باشد." };
  }
  if (title.length > MAX_TITLE) {
    return { ok: false, error: "عنوان رویداد حداکثر ۸۰ نویسه است." };
  }

  const category = input.category.trim();
  if (!category) {
    return { ok: false, error: "دسته‌بندی را انتخاب کنید." };
  }

  const description = input.description.trim();
  if (description.length < 10) {
    return { ok: false, error: "توضیحات رویداد را کامل‌تر بنویسید." };
  }
  if (description.length > MAX_DESCRIPTION) {
    return { ok: false, error: "توضیحات رویداد حداکثر ۵۰۰ نویسه است." };
  }

  /* Date — the wheels only ever produce a real day, but the action is
     reachable directly, so the day is checked against the month's length. */
  const { jy, jm, jd, hour, minute } = input;
  if (!Number.isInteger(jy) || jy < 1400 || jy > 1500) {
    return { ok: false, error: "سال برگزاری معتبر نیست." };
  }
  if (!Number.isInteger(jm) || jm < 1 || jm > 12) {
    return { ok: false, error: "ماه برگزاری معتبر نیست." };
  }
  if (!Number.isInteger(jd) || jd < 1 || jd > jalaaliMonthLength(jy, jm)) {
    return { ok: false, error: "روز برگزاری برای این ماه وجود ندارد." };
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { ok: false, error: "ساعت برگزاری معتبر نیست." };
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { ok: false, error: "دقیقه برگزاری معتبر نیست." };
  }

  const startsAt = jalaliToDate(jy, jm, jd, hour, minute);
  if (options.isNew && realInstant(startsAt).getTime() <= Date.now()) {
    return { ok: false, error: "زمان برگزاری باید در آینده باشد." };
  }

  const mode = input.mode === "ONLINE" ? "ONLINE" : "INPERSON";
  const venue = input.venue.replace(/\s+/g, " ").trim();
  const city = input.city.replace(/\s+/g, " ").trim();
  const onlineUrl = input.onlineUrl.trim();

  if (mode === "INPERSON" && !venue) {
    return { ok: false, error: "آدرس محل برگزاری لازم است." };
  }
  if (mode === "ONLINE") {
    if (!onlineUrl) {
      return { ok: false, error: "لینک پخش آنلاین لازم است." };
    }
    if (!/^https?:\/\/.+\..+/.test(onlineUrl)) {
      return { ok: false, error: "لینک پخش باید یک نشانی معتبر باشد." };
    }
  }

  /* `null` is the «نامشخص» option — no fixed limit, so no waitlist. */
  const capacity =
    input.capacity === null ? null : Number(input.capacity);
  if (
    capacity !== null &&
    (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY)
  ) {
    return { ok: false, error: "ظرفیت رویداد باید بین ۱ و ۱۰۰٬۰۰۰ نفر باشد." };
  }

  /* Both lists are optional, but an item that is only half filled (an
     agenda row with a time and no title) is a mistake worth reporting. */
  const highlights = Array.isArray(input.highlights)
    ? input.highlights
        .map((item) => String(item).replace(/\s+/g, " ").trim())
        .filter(Boolean)
    : [];
  if (highlights.length > MAX_HIGHLIGHTS) {
    return { ok: false, error: `حداکثر ${MAX_HIGHLIGHTS} مورد برای «چه چیزی در انتظارتان است؟» مجاز است.` };
  }
  if (highlights.some((item) => item.length > MAX_HIGHLIGHT_LENGTH)) {
    return { ok: false, error: "هر مورد «چه چیزی در انتظارتان است؟» حداکثر ۱۲۰ نویسه است." };
  }

  const agenda = Array.isArray(input.agenda)
    ? input.agenda.map((row) => ({
        time: String(row?.time ?? "").replace(/\s+/g, " ").trim(),
        title: String(row?.title ?? "").replace(/\s+/g, " ").trim(),
      }))
    : [];
  const filledAgenda = agenda.filter((row) => row.time || row.title);
  if (filledAgenda.some((row) => !row.time || !row.title)) {
    return { ok: false, error: "هر ردیف برنامه زمانی به ساعت و عنوان نیاز دارد." };
  }
  if (filledAgenda.length > MAX_AGENDA_ROWS) {
    return { ok: false, error: `حداکثر ${MAX_AGENDA_ROWS} ردیف برای برنامه زمانی مجاز است.` };
  }
  if (
    filledAgenda.some(
      (row) => row.time.length > MAX_AGENDA_TIME || row.title.length > MAX_AGENDA_TITLE,
    )
  ) {
    return { ok: false, error: "ساعت یا عنوان یکی از ردیف‌های برنامه زمانی خیلی بلند است." };
  }

  const price = input.price === null ? null : Number(input.price);
  if (price !== null && (!Number.isInteger(price) || price < 0 || price > MAX_PRICE)) {
    return { ok: false, error: "قیمت بلیت معتبر نیست." };
  }

  const coverGradient = COVER_GRADIENTS.includes(input.coverGradient)
    ? input.coverGradient
    : COVER_GRADIENTS[0];

  return {
    ok: true,
    value: {
      title,
      category,
      description,
      jy,
      jm,
      jd,
      hour,
      minute,
      venue,
      city,
      mode,
      capacity,
      highlights,
      agenda: filledAgenda,
      price,
      coverGradient,
      onlineUrl: mode === "ONLINE" ? onlineUrl : null,
      startsAt,
    },
  };
}

/** The signed-in user, or `null`. */
async function currentUser() {
  const session = await getSession();
  return session?.user?.id ? { id: session.user.id, name: session.user.name ?? "" } : null;
}

/**
 * Creates an event. It starts as `PENDING` — an admin approves it in
 * `/console/events` before it becomes visible on the public pages.
 */
export async function createEvent(input: EventInput): Promise<EventActionResult> {
  const user = await currentUser();
  if (!user) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }

  const checked = validate(input, { isNew: true });
  if (!checked.ok) return { ok: false, error: checked.error };
  const value = checked.value;

  try {
    const event = await prisma.event.create({
      data: {
        slug: await uniqueSlug(value.title),
        title: value.title,
        summary: value.description.slice(0, 140),
        description: value.description,
        category: value.category,
        city: value.city,
        venue: value.venue,
        mode: value.mode,
        onlineUrl: value.onlineUrl,
        startsAt: value.startsAt,
        capacity: value.capacity,
        highlights: value.highlights,
        agenda: value.agenda,
        price: value.price,
        coverGradient: value.coverGradient,
        status: "PENDING",
        organizerId: user.id,
        organizerName: user.name,
      },
    });

    updateTag("events");
    updateTag(`event:${event.id}`);
    updateTag(`user-events:${user.id}`);

    return {
      ok: true,
      id: event.id,
      message: "رویداد شما ثبت شد و پس از تأیید کارشناسان منتشر می‌شود.",
    };
  } catch {
    return { ok: false, error: "ثبت رویداد ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }
}

/**
 * Updates one of the caller's own events. A change sends the event back to
 * the moderation queue, so what people see stays reviewed.
 */
export async function updateEvent(
  eventId: string,
  input: EventInput,
): Promise<EventActionResult> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }
  /* An admin may correct any event from `/console`; everyone else only
     the ones they host. */
  const isAdmin = session.user.role === "ADMIN";

  const event = await prisma.event.findFirst({
    where: isAdmin ? { id: eventId } : { id: eventId, organizerId: userId },
    select: { id: true, startsAt: true, status: true, organizerId: true },
  });
  if (!event) {
    return { ok: false, error: "این رویداد پیدا نشد یا متعلق به شما نیست." };
  }

  /* An unchanged date may sit in the past — only a new one has to be ahead. */
  const stored = dateToJalali(event.startsAt);
  const sameMoment =
    input.jy === stored.jy &&
    input.jm === stored.jm &&
    input.jd === stored.jd &&
    input.hour === stored.hh &&
    input.minute === stored.mm;

  const checked = validate(input, { isNew: !sameMoment });
  if (!checked.ok) return { ok: false, error: checked.error };
  const value = checked.value;

  try {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        title: value.title,
        summary: value.description.slice(0, 140),
        description: value.description,
        category: value.category,
        city: value.city,
        venue: value.venue,
        mode: value.mode,
        onlineUrl: value.onlineUrl,
        startsAt: value.startsAt,
        capacity: value.capacity,
        highlights: value.highlights,
        agenda: value.agenda,
        price: value.price,
        coverGradient: value.coverGradient,
        /* A participant's edit re-opens the review — a published or sent-back
           event goes back to the queue. An admin's edit is final: the status
           only changes through approve/reject. */
        status: isAdmin
          ? event.status
          : event.status === "PUBLISHED" || event.status === "REJECTED"
            ? "PENDING"
            : event.status,
      },
    });

    updateTag("events");
    updateTag(`event:${event.id}`);
    updateTag(`user-events:${userId}`);
    /* The host's own list too, when an admin edited someone else's event. */
    if (event.organizerId && event.organizerId !== userId) {
      updateTag(`user-events:${event.organizerId}`);
    }

    return { ok: true, message: "تغییرات رویداد ذخیره شد." };
  } catch {
    return { ok: false, error: "ذخیره تغییرات ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }
}

/** Deletes one of the caller's own events — its tickets go with it. */
export async function deleteEvent(eventId: string): Promise<EventActionResult> {
  const user = await currentUser();
  if (!user) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: user.id },
    select: { id: true },
  });
  if (!event) {
    return { ok: false, error: "این رویداد پیدا نشد یا متعلق به شما نیست." };
  }

  try {
    await prisma.event.delete({ where: { id: event.id } });
  } catch {
    return { ok: false, error: "حذف رویداد ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }

  updateTag("events");
  updateTag(`event:${event.id}`);
  updateTag(`user-events:${user.id}`);

  return { ok: true, message: "رویداد حذف شد." };
}

/**
 * Enrolls the signed-in user in an event.
 *
 * A free seat is confirmed right away; a full event puts the person on the
 * waiting list, where the next free seat is theirs.
 */
export async function enrollInEvent(eventId: string): Promise<EventActionResult> {
  const user = await currentUser();
  if (!user) {
    return { ok: false, error: "برای ثبت‌نام باید وارد حساب خود شوید." };
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "PUBLISHED" },
    select: { id: true, title: true, capacity: true, startsAt: true, slug: true },
  });
  if (!event) {
    return { ok: false, error: "این رویداد در دسترس نیست." };
  }
  if (realInstant(event.startsAt).getTime() <= Date.now()) {
    return { ok: false, error: "ثبت‌نام این رویداد بسته شده است." };
  }

  const existing = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
  });
  if (existing && existing.status !== "CANCELLED") {
    return {
      ok: false,
      error:
        existing.status === "WAITLIST"
          ? "شما در لیست انتظار این رویداد هستید."
          : "شما قبلاً در این رویداد ثبت‌نام کرده‌اید.",
    };
  }

  const confirmed = await prisma.registration.count({
    where: { eventId: event.id, status: "CONFIRMED" },
  });
  /* An event with no fixed capacity never fills up. */
  const status =
    event.capacity === null || confirmed < event.capacity
      ? "CONFIRMED"
      : "WAITLIST";

  try {
    if (existing) {
      await prisma.registration.update({
        where: { id: existing.id },
        data: { status, ticketCode: await uniqueTicketCode(), reminder: false },
      });
    } else {
      await prisma.registration.create({
        data: {
          eventId: event.id,
          userId: user.id,
          status,
          ticketCode: await uniqueTicketCode(),
        },
      });
    }
  } catch {
    return { ok: false, error: "ثبت‌نام ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }

  updateTag("events");
  updateTag(`event:${event.id}`);
  updateTag(`user-registrations:${user.id}`);

  return {
    ok: true,
    message:
      status === "CONFIRMED"
        ? "ثبت‌نام شما قطعی شد."
        : "ظرفیت رویداد تکمیل است؛ شما در لیست انتظار قرار گرفتید.",
  };
}

/** Gives a seat back — the next person on the waiting list takes it. */
export async function cancelRegistration(registrationId: string): Promise<EventActionResult> {
  const user = await currentUser();
  if (!user) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }

  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, userId: user.id },
    select: { id: true, eventId: true, status: true, event: { select: { capacity: true } } },
  });
  if (!registration) {
    return { ok: false, error: "این ثبت‌نام پیدا نشد یا متعلق به شما نیست." };
  }
  if (registration.status === "CANCELLED") {
    return { ok: false, error: "این ثبت‌نام قبلاً لغو شده است." };
  }

  try {
    await prisma.registration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED", reminder: false },
    });

    /* A freed seat goes to the first person on the waiting list. */
    if (registration.status === "CONFIRMED") {
      const confirmed = await prisma.registration.count({
        where: { eventId: registration.eventId, status: "CONFIRMED" },
      });
      if (
        registration.event.capacity === null ||
        confirmed < registration.event.capacity
      ) {
        const next = await prisma.registration.findFirst({
          where: { eventId: registration.eventId, status: "WAITLIST" },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (next) {
          await prisma.registration.update({
            where: { id: next.id },
            data: { status: "CONFIRMED" },
          });
        }
      }
    }
  } catch {
    return { ok: false, error: "لغو ثبت‌نام ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }

  updateTag("events");
  updateTag(`event:${registration.eventId}`);
  updateTag(`user-registrations:${user.id}`);

  return { ok: true, message: "ثبت‌نام لغو شد." };
}

/** Turns the reminder of a ticket on or off. */
export async function toggleReminder(registrationId: string): Promise<EventActionResult> {
  const user = await currentUser();
  if (!user) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }

  const registration = await prisma.registration.findFirst({
    where: { id: registrationId, userId: user.id },
    select: { id: true, reminder: true, eventId: true },
  });
  if (!registration) {
    return { ok: false, error: "این ثبت‌نام پیدا نشد یا متعلق به شما نیست." };
  }

  try {
    await prisma.registration.update({
      where: { id: registration.id },
      data: { reminder: !registration.reminder },
    });
  } catch {
    return { ok: false, error: "تغییر یادآور ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }

  updateTag(`user-registrations:${user.id}`);
  updateTag(`event:${registration.eventId}`);

  return {
    ok: true,
    message: registration.reminder ? "یادآوری غیرفعال شد." : "یادآوری فعال شد.",
  };
}

export type BookmarkActionResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string };

/**
 * Saves or unsaves an event — the heart on the cards. A signed-out visitor
 * never reaches here: the card opens the sign-in modal first and the save
 * runs the moment they are in.
 */
export async function toggleBookmark(eventId: string): Promise<BookmarkActionResult> {
  const user = await currentUser();
  if (!user) {
    return { ok: false, error: "برای ذخیره رویداد باید وارد حساب خود شوید." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) {
    return { ok: false, error: "این رویداد در دسترس نیست." };
  }

  const existing = await prisma.bookmark.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });

  try {
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
    } else {
      await prisma.bookmark.create({ data: { eventId, userId: user.id } });
    }
  } catch {
    return { ok: false, error: "ذخیره انجام نشد؛ اتصال اینترنت را بررسی کنید." };
  }

  /* Clears the client router cache so the next navigation to
     `/dashboard/saved` (or anywhere) refetches instead of showing a
     pre-bookmark flight from the browser cache. */
  updateTag(`user-bookmarks:${user.id}`);

  return { ok: true, saved: !existing };
}

/**
 * The ids the hearts start filled with, read by the cards right after the
 * session resolves — `/events` itself stays static, and a visitor who is not
 * signed in costs no request at all.
 */
export async function fetchBookmarkedIds(): Promise<string[]> {
  const user = await currentUser();
  if (!user) return [];
  return getBookmarkedIds(user.id);
}

/**
 * Moderation: an admin publishes an event or sends it back for changes.
 * Only admins get here — the role is checked again in the action.
 */
export async function reviewEvent(
  eventId: string,
  approve: boolean,
): Promise<EventActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }
  if (session.user.role !== "ADMIN") {
    return { ok: false, error: "این عملیات فقط برای مدیر انجام می‌شود." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, organizerId: true },
  });
  if (!event) {
    return { ok: false, error: "این رویداد پیدا نشد." };
  }

  try {
    await prisma.event.update({
      where: { id: event.id },
      data: { status: approve ? "PUBLISHED" : "REJECTED" },
    });
  } catch {
    return { ok: false, error: "تغییر وضعیت ممکن نشد؛ اتصال اینترنت را بررسی کنید." };
  }

  updateTag("events");
  updateTag(`event:${event.id}`);
  if (event.organizerId) updateTag(`user-events:${event.organizerId}`);

  return {
    ok: true,
    message: approve
      ? "رویداد تأیید و منتشر شد."
      : "رویداد برای اصلاح به برگزارکننده بازگردانده شد.",
  };
}

/** Number of free seats left — used by the detail page and the console. */
export async function getSeatsLeft(eventId: string): Promise<number | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { capacity: true },
  });
  if (!event) return null;
  /* No fixed capacity — there is no meaningful number of seats left. */
  if (event.capacity === null) return null;

  const confirmed = await prisma.registration.count({
    where: { eventId, status: "CONFIRMED" },
  });
  return Math.max(0, event.capacity - confirmed);
}
