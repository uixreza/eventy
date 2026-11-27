"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requireAdminActor } from "@/app/actions/user";
import {
  MAX_TICKET_MESSAGE,
  MAX_TICKET_SUBJECT,
  MIN_TICKET_MESSAGE,
  MIN_TICKET_SUBJECT,
  type TicketStatus,
} from "@/lib/ticket-types";

/**
 * Every write to a support conversation.
 *
 * Server Actions are reachable by direct POST, so the rules live here rather
 * than only in the forms: sign-in, field lengths, conversation ownership, and
 * an independent admin check for answer/close/reopen. Every read is uncached,
 * so no tag invalidation is needed — the client reloads after each result.
 */

export type TicketResult =
  | { ok: true; ticketId?: string }
  | { ok: false; error: string };

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateFields(subject: string, body: string): string | null {
  if (subject.length < MIN_TICKET_SUBJECT || subject.length > MAX_TICKET_SUBJECT) {
    return `عنوان تیکت باید بین ${MIN_TICKET_SUBJECT} تا ${MAX_TICKET_SUBJECT} نویسه باشد.`;
  }
  if (body.length < MIN_TICKET_MESSAGE || body.length > MAX_TICKET_MESSAGE) {
    return `پیام شما باید بین ${MIN_TICKET_MESSAGE} تا ${MAX_TICKET_MESSAGE} نویسه باشد.`;
  }
  return null;
}

/** A signed-in client opens a new conversation with its first message. */
export async function createSupportTicket(input: {
  subject: string;
  message: string;
}): Promise<TicketResult> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId || !session) {
    return { ok: false, error: "برای ارسال تیکت باید وارد حساب خود شوید." };
  }

  const subject = clean(input?.subject);
  const body = clean(input?.message);
  const invalid = validateFields(subject, body);
  if (invalid) return { ok: false, error: invalid };

  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        ownerId: userId,
        messages: {
          create: {
            authorId: userId,
            authorRole: "USER",
            authorName: session.user.name,
            body,
          },
        },
      },
      select: { id: true },
    });
    return { ok: true, ticketId: ticket.id };
  } catch {
    return { ok: false, error: "ثبت تیکت ممکن نشد؛ دوباره تلاش کنید." };
  }
}

/**
 * Adds one message to an existing conversation.
 *
 * The owner may write a follow-up (which leaves the ticket waiting for an
 * admin); only a message written from the admin side marks it as answered.
 * An admin posting on their *own* ticket is still the client, so role alone
 * must never flip the badge. Closed tickets are read-only until reopened.
 */
export async function addSupportTicketMessage(
  ticketId: string,
  message: string,
): Promise<TicketResult> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId || !session) {
    return { ok: false, error: "نشست شما به پایان رسیده است؛ دوباره وارد شوید." };
  }

  const id = clean(ticketId);
  const body = clean(message);
  const invalid = validateFields("عنوان معتبر", body);
  if (invalid) return { ok: false, error: invalid };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { ownerId: true, status: true },
  });
  if (!ticket) {
    return { ok: false, error: "تیکت مورد نظر پیدا نشد." };
  }

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && ticket.ownerId !== userId) {
    return { ok: false, error: "شما به این تیکت دسترسی ندارید." };
  }
  if (ticket.status === "CLOSED") {
    return { ok: false, error: "این تیکت بسته شده است." };
  }

  /* Answering means "an admin replied to someone else's ticket". The owner is
     always the client here — even when their account happens to have the
     ADMIN role — so their own follow-up keeps the ticket in the waiting state. */
  const isAdminReply = isAdmin && ticket.ownerId !== userId;
  const nextStatus: TicketStatus = isAdminReply ? "ANSWERED" : "OPEN";
  try {
    await prisma.$transaction([
      prisma.supportTicketMessage.create({
        data: {
          ticketId: id,
          authorId: userId,
          authorRole: isAdminReply ? "ADMIN" : "USER",
          authorName: session.user.name,
          body,
        },
      }),
      prisma.supportTicket.update({
        where: { id },
        data: { status: nextStatus },
      }),
    ]);
    return { ok: true };
  } catch {
    return { ok: false, error: "ارسال پیام ممکن نشد؛ دوباره تلاش کنید." };
  }
}

/** Admin-only: stop the conversation. The owner can still read the thread. */
export async function closeSupportTicket(ticketId: string): Promise<TicketResult> {
  const actor = await requireAdminActor();
  if (!actor.ok) return { ok: false, error: actor.error };

  const id = clean(ticketId);
  if (!id) return { ok: false, error: "تیکت مورد نظر پیدا نشد." };

  try {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "بسته کردن تیکت ممکن نشد؛ دوباره تلاش کنید." };
  }
}

/** Admin-only: let both sides write again after a closure. */
export async function reopenSupportTicket(ticketId: string): Promise<TicketResult> {
  const actor = await requireAdminActor();
  if (!actor.ok) return { ok: false, error: actor.error };

  const id = clean(ticketId);
  if (!id) return { ok: false, error: "تیکت مورد نظر پیدا نشد." };

  try {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: "OPEN", closedAt: null },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "بازگشایی تیکت ممکن نشد؛ دوباره تلاش کنید." };
  }
}
