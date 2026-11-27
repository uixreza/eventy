/**
 * The public contract of the support-ticket feature.
 *
 * These values are string literals on purpose: this file is imported by both
 * server code and client components, so it must not pull in Prisma or any
 * server-only module. The Server Actions validate against the same constants.
 */

export const TICKET_STATUSES = ["OPEN", "ANSWERED", "CLOSED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "در انتظار",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "بسته شده",
};

/** Amber while waiting, green once answered, red when closed. */
export const TICKET_STATUS_BADGES: Record<TicketStatus, string> = {
  OPEN: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  ANSWERED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  CLOSED: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
};

/** The docked thread column on large screens — shared with its skeleton. */
export const TICKET_THREAD_GRID =
  "grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_520px]";
export const TICKET_THREAD_PANEL_HEIGHT = "h-[60vh] max-h-[560px] min-h-[340px]";

export type TicketAuthorRole = "USER" | "ADMIN";

export const TICKET_AUTHOR_LABELS: Record<TicketAuthorRole, string> = {
  USER: "شما",
  ADMIN: "پشتیبانی",
};

export const MIN_TICKET_SUBJECT = 5;
export const MAX_TICKET_SUBJECT = 120;
export const MIN_TICKET_MESSAGE = 5;
export const MAX_TICKET_MESSAGE = 2000;

export type TicketMessageView = {
  id: string;
  body: string;
  authorRole: TicketAuthorRole;
  authorName: string;
  /** Jalali-formatted on the server. */
  createdAt: string;
};

export type TicketView = {
  id: string;
  subject: string;
  status: TicketStatus;
  statusLabel: string;
  /** Jalali-formatted on the server. */
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  owner: {
    name: string;
    phone: string;
  };
  messages: TicketMessageView[];
};

export type TicketsResponse = { tickets: TicketView[] };
