/**
 * The shapes the event data takes on its way to the browser.
 *
 * Everything here is a plain, serializable value: the server reads the
 * database, turns a row into one of these, and the client components only
 * ever see these — never a Prisma object.
 */

/** Where an event stands in the moderation flow. */
export type EventLifecycle = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "CANCELLED";

/** The state of one person's ticket. */
export type RegistrationState = "CONFIRMED" | "WAITLIST" | "CANCELLED";

/** How the event is held. */
export type EventMode = "INPERSON" | "ONLINE";

/** Where an event stands in time. */
export type EventTimeState = "live" | "upcoming" | "ended";

export const eventLifecycleMeta: Record<
  EventLifecycle,
  { label: string; tint: string; description: string }
> = {
  DRAFT: {
    label: "پیش‌نویس",
    tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    description: "رویداد هنوز منتشر نشده است.",
  },
  PENDING: {
    label: "در انتظار تأیید",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    description: "رویداد ثبت شد و منتظر بررسی کارشناسان است.",
  },
  PUBLISHED: {
    label: "منتشر شده",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    description: "رویداد روی سایت دیده می‌شود و کاربران می‌توانند ثبت‌نام کنند.",
  },
  REJECTED: {
    label: "نیازمند اصلاح",
    tint: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    description: "بررسی کارشناسان رویداد را برگرداند؛ پس از اصلاح دوباره ثبت کنید.",
  },
  CANCELLED: {
    label: "لغو شده",
    tint: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    description: "رویداد لغو شده است.",
  },
};

export const registrationStateMeta: Record<
  RegistrationState,
  { label: string; tint: string }
> = {
  CONFIRMED: {
    label: "ثبت‌نام قطعی",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  WAITLIST: {
    label: "در انتظار تکمیل ظرفیت",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  },
  CANCELLED: {
    label: "لغو شده",
    tint: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  },
};

/** An event as the public pages show it. */
export type EventCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  /** Registry key into `lib/category-icons.ts` — the category's glyph. */
  categoryIcon: string;
  city: string;
  venue: string;
  mode: EventMode;
  /** Exact map pin — `null` for online or older in-person events. */
  latitude: number | null;
  longitude: number | null;
  /** «۲۸ آبان» */
  date: string;
  /** «۱۶:۰۰» */
  time: string;
  /** «۲۸ آبان - ۱۶:۰۰» */
  dateTime: string;
  status: EventTimeState;
  price: number | null;
  /** Organizer paid for top placement — pinned first on public listings. */
  promoted: boolean;
  /** Free seats — `null` once the event is over or sign-ups are closed. */
  seatsLeft: number | null;
  /** People who hold a confirmed seat. */
  registered: number;
  /** `null` when the organizer left the capacity undefined. */
  capacity: number | null;
  organizer: string;
  gradient: string;
  /** Private-bucket object keys in display order — the first is the cover. */
  images: string[];
  /** Jalali parts of the start date — the heatmap bins by them. */
  jy: number;
  jm: number;
  jd: number;
};

/** An event the signed-in user created. */
export type HostedEvent = EventModerationInfo & {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  venue: string;
  mode: EventMode;
  dateTime: string;
  date: string;
  time: string;
  status: EventLifecycle;
  /** `null` when the organizer left the capacity undefined. */
  capacity: number | null;
  /** Confirmed participants. */
  registered: number;
  /** People waiting for a seat. */
  waitlist: number;
  price: number | null;
  gradient: string;
  /** Private-bucket object keys — the first one is used as the card cover. */
  images: string[];
  jy: number;
  jm: number;
  jd: number;
  /** ISO timestamp of the creation. */
  createdAt: string;
  isPast: boolean;
};

/** An event the signed-in user enrolled in. */
export type EnrolledEvent = {
  registrationId: string;
  eventId: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  venue: string;
  mode: EventMode;
  dateTime: string;
  date: string;
  time: string;
  /** The ticket's own state. */
  status: RegistrationState;
  /** The event's state — a cancelled event shows up here. */
  eventStatus: EventLifecycle;
  price: number | null;
  gradient: string;
  /** Private-bucket object keys — the first one is used as the card cover. */
  images: string[];
  jy: number;
  jm: number;
  jd: number;
  /** The printed ticket code — `null` while the person is only waitlisted. */
  ticket: string | null;
  reminder: boolean;
  isPast: boolean;
};

/** Result of the last OpenAI moderation pass, shown in the console. */
export type EventModerationInfo = {
  /** A clean AI pass. The event still waits for an admin's approval. */
  moderationApproved: boolean;
  /** Issues were found, so AI rejected the event. */
  moderationFlagged: boolean;
  /** Raw OpenAI category keys, e.g. `violence/graphic`. */
  moderationCategories: string[];
  /** ISO timestamp of the last attempt, including failed ones. */
  moderationCheckedAt: string | null;
  /** Persian explanation of the result, or why no check could run. */
  moderationNote: string | null;
};

/** A row of the moderation table in `/console/events`. */
export type ConsoleEventRow = EventModerationInfo & {
  id: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  venue: string;
  dateTime: string;
  status: EventLifecycle;
  /** `null` when the organizer left the capacity undefined. */
  capacity: number | null;
  registered: number;
  price: number | null;
  organizer: string;
  gradient: string;
  createdAt: string;
};

/**
 * One event in full — everything the review modal shows and the console
 * edit form starts from, so an admin can read every field before approving.
 */
export type ConsoleEventDetail = EventModerationInfo & {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  city: string;
  venue: string;
  mode: EventMode;
  latitude: number | null;
  longitude: number | null;
  onlineUrl: string | null;
  status: EventLifecycle;
  /** Jalali date-time of the start, formatted for display. */
  dateTime: string;
  /** The same start moment as the wheel's pieces — the edit form needs them. */
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
  /** `null` when the organizer left the capacity undefined. */
  capacity: number | null;
  /** «چه چیزی در انتظارتان است؟» */
  highlights: string[];
  /** «برنامه زمانی» */
  agenda: { time: string; title: string }[];
  /** `null` means free. */
  price: number | null;
  gradient: string;
  /** Private-bucket object keys in display order — the first is the cover. */
  images: string[];
  /** Publish-time answer for the managers only; absent from the public card. */
  needsPhotographyTeam: boolean;
  /** Whether this event is set to lead the public listings once published. */
  promoted: boolean;
  organizerName: string;
  /** The organizer's account, when the event still has one. */
  organizer: { id: string; name: string; phone: string } | null;
  /** Ticket counts, straight from the registrations. */
  confirmed: number;
  waitlist: number;
  /** `null` when there is no fixed capacity. */
  seatsLeft: number | null;
  /** How many people saved the event. */
  saved: number;
  startsAt: string;
  createdAt: string;
  updatedAt: string;
};
