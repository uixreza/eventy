/**
 * The shapes a client account takes on its way to `/console/users` — plain,
 * serializable values: the server reads a Prisma row, turns it into one of
 * these, and the browser only ever sees these. Same contract as
 * `lib/event-types.ts`.
 *
 * The role union mirrors the `Role` enum so the client side never has to
 * import Prisma to talk about roles.
 */

import type { EventLifecycle, RegistrationState } from "@/lib/event-types";

export type UserRole = "USER" | "ADMIN";

/** Whether an account may sign in — `bannedAt` is the single switch. */
export type ConsoleUserStatus = "active" | "banned";

export const userRoleMeta: Record<UserRole, { label: string; tint: string }> = {
  ADMIN: {
    label: "مدیر",
    tint: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
  USER: {
    label: "کاربر",
    tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

export const userStatusMeta: Record<
  ConsoleUserStatus,
  { label: string; tint: string }
> = {
  active: {
    label: "فعال",
    tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  banned: {
    label: "مسدود",
    tint: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

/** One line of the clients table in `/console/users`. */
export type ConsoleUserRow = {
  id: string;
  name: string;
  /** Latin digits as stored — the table renders them with `toFa`. */
  phone: string;
  role: UserRole;
  /** The moment an admin blocked the account; `null` means active. */
  bannedAt: string | null;
  /** «۲۸ آبان ۱۴۰۳» */
  joined: string;
  /** Events this account created. */
  eventCount: number;
  /** Tickets this account holds, in any state. */
  registrationCount: number;
};

/**
 * One account in full — everything the detail modal shows: the profile
 * fields, both of the account's lists, and the timestamps, so an admin can
 * read who this person is before changing their role or blocking them.
 */
export type ConsoleUserDetail = {
  id: string;
  name: string;
  /** Latin digits as stored. */
  phone: string;
  /** کد ملی — Latin digits as stored; the modal renders with `toFa`. */
  nationalId: string;
  /** «۱۴۰۳/۰۲/۱۵» — the birth day, as the profile form speaks. */
  birthDate: string;
  role: UserRole;
  bannedAt: string | null;
  /** «۲۸ آبان ۱۴۰۳» */
  joined: string;
  /** ISO — «آخرین تغییر» in the modal. */
  updatedAt: string;
  /** Newest first. */
  hostedEvents: ConsoleUserHostedEvent[];
  /** Newest first. */
  registrations: ConsoleUserRegistration[];
};

/** One event this account created. */
export type ConsoleUserHostedEvent = {
  id: string;
  title: string;
  status: EventLifecycle;
  /** «۲۸ آبان - ۱۶:۰۰» */
  dateTime: string;
  /** `null` when the organizer left the capacity undefined. */
  capacity: number | null;
  /** Confirmed seats — the same count the moderation table shows. */
  registered: number;
};

/** One ticket this account holds. */
export type ConsoleUserRegistration = {
  registrationId: string;
  eventId: string;
  title: string;
  /** The ticket's own state. */
  status: RegistrationState;
  /** «۲۸ آبان - ۱۶:۰۰» */
  dateTime: string;
};
