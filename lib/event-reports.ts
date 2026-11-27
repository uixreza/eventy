import "server-only";

import { prisma } from "@/lib/prisma";
import { formatJalaliDateTime, inIran } from "@/lib/jalali";
import {
  EVENT_REPORT_REASONS,
  type AdminEventReport,
} from "@/lib/event-report-types";

/**
 * The managers' report inbox. Deliberately uncached: a report sent a second
 * ago must be on the console list on its next fetch. Only the fields the list
 * shows leave the server; formatted here so the client needs no date helpers.
 */
export async function getAdminEventReports(): Promise<AdminEventReport[]> {
  const rows = await prisma.eventReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      event: { select: { id: true, title: true, slug: true } },
      reporter: { select: { name: true, phone: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    reason: row.reason,
    reasonLabel:
      EVENT_REPORT_REASONS.find((item) => item.value === row.reason)?.label ?? row.reason,
    message: row.message ?? "",
    createdAt: formatJalaliDateTime(inIran(row.createdAt)),
    reporter: row.reporter,
    event: row.event,
  }));
}
