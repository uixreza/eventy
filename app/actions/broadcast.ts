"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/app/actions/user";
import { publishNotificationsChanged } from "@/lib/live-events";

export type BroadcastResult = { ok: true } | { ok: false; error: string };

/** Title: short and required. Body: optional, but not a whole page. */
const MAX_TITLE = 120;
const MAX_BODY = 500;

function cleanTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Writes the global notification every visitor will be shown.
 *
 * Admin only — `requireAdminActor` re-reads the session here rather than
 * trusting anything the console form sent. The row is the whole delivery
 * mechanism: `GET /api/broadcasts` picks it up on the next load and
 * `components/layout/BroadcastToaster.tsx` shows it once per browser.
 * Nothing is cached around it, so there is no tag to invalidate.
 */
export async function sendBroadcast(input: {
  title: string;
  body: string;
}): Promise<BroadcastResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  const title = cleanTitle(input.title);
  const body = input.body.trim();

  if (!title) return { ok: false, error: "متن اعلان را وارد کنید." };
  if (title.length > MAX_TITLE) {
    return { ok: false, error: `عنوان اعلان باید کمتر از ${MAX_TITLE} حرف باشد.` };
  }
  if (body.length > MAX_BODY) {
    return { ok: false, error: `متن اعلان باید کمتر از ${MAX_BODY} حرف باشد.` };
  }

  try {
    await prisma.broadcast.create({ data: { title, body } });
  } catch {
    return { ok: false, error: "ارسال اعلان ممکن نشد؛ دوباره تلاش کنید." };
  }
  publishNotificationsChanged();

  return { ok: true };
}

/**
 * Pulls a broadcast back. Browsers that already saw it keep their local
 * memory of it; the ones that have not will simply never receive it.
 */
export async function deleteBroadcast(id: string): Promise<BroadcastResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  try {
    await prisma.broadcast.delete({ where: { id } });
  } catch {
    return { ok: false, error: "اعلان پیدا نشد یا حذف ذخیره نشد." };
  }
  publishNotificationsChanged();

  return { ok: true };
}
