import "server-only";

import { prisma } from "@/lib/prisma";
import { formatJalaliDateTime, inIran } from "@/lib/jalali";
import {
  TICKET_STATUS_LABELS,
  type TicketStatus,
  type TicketView,
} from "@/lib/ticket-types";

/**
 * Read side of the support inbox.
 *
 * Deliberately uncached, like the event-report inbox: a message sent a second
 * ago must be visible the next time either side loads the page. Only the
 * fields the views render leave the server, with Jalali dates already
 * formatted so client components need no date helpers.
 */

type StoredMessage = {
  id: string;
  body: string;
  authorRole: string;
  authorName: string;
  createdAt: Date;
};

type StoredTicket = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  owner: { name: string; phone: string };
  messages: StoredMessage[];
};

const ticketInclude = {
  owner: { select: { name: true, phone: true } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      body: true,
      authorRole: true,
      authorName: true,
      createdAt: true,
    },
  },
};

function toView(row: StoredTicket): TicketView {
  const status = row.status as TicketStatus;
  return {
    id: row.id,
    subject: row.subject,
    status,
    statusLabel: TICKET_STATUS_LABELS[status] ?? row.status,
    createdAt: formatJalaliDateTime(inIran(row.createdAt)),
    updatedAt: formatJalaliDateTime(inIran(row.updatedAt)),
    closedAt: row.closedAt ? formatJalaliDateTime(inIran(row.closedAt)) : null,
    owner: row.owner,
    messages: row.messages.map((message) => ({
      id: message.id,
      body: message.body,
      authorRole: message.authorRole === "ADMIN" ? "ADMIN" : "USER",
      authorName: message.authorName,
      createdAt: formatJalaliDateTime(inIran(message.createdAt)),
    })),
  };
}

/** How many of this account's conversations still need an admin reply. */
export async function getOpenTicketCount(userId: string): Promise<number> {
  return prisma.supportTicket.count({
    where: { ownerId: userId, status: "OPEN" },
  });
}

/** Only the signed-in account's conversations. */
export async function getMyTickets(userId: string): Promise<TicketView[]> {
  const rows = await prisma.supportTicket.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: ticketInclude,
  });
  return rows.map(toView);
}

/** Every conversation, for the admin console. */
export async function getAdminTickets(): Promise<TicketView[]> {
  const rows = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: ticketInclude,
    take: 200,
  });
  return rows.map(toView);
}
