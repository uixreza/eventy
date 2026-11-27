"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  EVENT_REPORT_REASONS,
  MAX_REPORT_MESSAGE,
} from "@/lib/event-report-types";

/**
 * The one write for visitor reports.
 *
 * A direct POST can reach a Server Action, so every rule is checked here:
 * sign-in, a real published event, a reason from the shared list, and the
 * organizer never reporting their own event. The message stays optional.
 */
export type ReportResult = { ok: true } | { ok: false; error: string };

export async function submitEventReport(input: {
  eventId: string;
  reason: string;
  message: string;
}): Promise<ReportResult> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "برای ثبت گزارش باید وارد حساب خود شوید." };
  }

  if (!input || typeof input !== "object") {
    return { ok: false, error: "اطلاعات گزارش معتبر نیست." };
  }

  const eventId = typeof input.eventId === "string" ? input.eventId.trim() : "";
  if (!eventId) {
    return { ok: false, error: "رویداد مورد نظر پیدا نشد." };
  }

  const reason = EVENT_REPORT_REASONS.find((item) => item.value === input.reason)?.value;
  if (!reason) {
    return { ok: false, error: "لطفاً یکی از دلایل گزارش را انتخاب کنید." };
  }

  const rawMessage = typeof input.message === "string" ? input.message.trim() : "";
  if (rawMessage.length > MAX_REPORT_MESSAGE) {
    return { ok: false, error: `پیام شما باید حداکثر ${MAX_REPORT_MESSAGE} نویسه باشد.` };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, status: true },
  });
  if (!event || event.status !== "PUBLISHED") {
    return { ok: false, error: "این رویداد در دسترس نیست." };
  }
  if (event.organizerId === userId) {
    return { ok: false, error: "نمی‌توانید رویداد خودتان را گزارش کنید." };
  }

  try {
    await prisma.eventReport.create({
      data: {
        eventId,
        reporterId: userId,
        reason,
        message: rawMessage || null,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "ثبت گزارش ممکن نشد؛ دوباره تلاش کنید." };
  }
}
