import "server-only";

import { prisma } from "@/lib/prisma";
import { formatJalaliDateTime } from "@/lib/jalali";
import type { BroadcastNotice } from "@/lib/broadcast-types";

/**
 * The newest global notifications, newest first.
 *
 * Read fresh on every call — a broadcast an admin sent a second ago must be
 * on the next page load, so nothing here is put in the cache and no tag has
 * to be invalidated when one is written (`app/actions/broadcast.ts`).
 */
export async function getBroadcasts(limit = 10): Promise<BroadcastNotice[]> {
  const rows = await prisma.broadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, title: true, body: true, createdAt: true },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    sentAt: formatJalaliDateTime(row.createdAt),
  }));
}
