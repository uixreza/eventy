/**
 * Writes the platform's starting events into the database.
 *
 *   npm run seed:events
 *
 * The script is idempotent: every event is matched on its slug, so it can be
 * run again at any time — a re-run refreshes the seeded rows and leaves the
 * events people created alone.
 */
import { PrismaClient } from "@prisma/client";
import { toGregorian } from "jalaali-js";
import { seedEvents } from "../lib/seed-events.ts";

const prisma = new PrismaClient();

/**
 * The Iranian wall clock is kept in the UTC fields of the stored timestamp
 * (see `lib/jalali.ts`) — the same rule the app itself uses.
 */
function startsAt(event: {
  jy: number;
  jm: number;
  jd: number;
  hh: number;
  mm: number;
}): Date {
  const { gy, gm, gd } = toGregorian(event.jy, event.jm, event.jd);
  return new Date(Date.UTC(gy, gm - 1, gd, event.hh, event.mm));
}

let created = 0;
let updated = 0;

try {
  for (const event of seedEvents) {
    const data = {
      title: event.title,
      summary: event.summary.slice(0, 140),
      description: event.summary,
      category: event.category,
      city: event.city,
      venue: event.venue,
      mode: event.mode,
      startsAt: startsAt(event),
      capacity: event.capacity,
      price: event.price,
      coverGradient: event.gradient,
      organizerName: event.organizer,
      status: "PUBLISHED" as const,
    };

    const existing = await prisma.event.findUnique({
      where: { slug: event.slug },
      select: { id: true },
    });

    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.event.create({ data: { ...data, slug: event.slug } });
      created += 1;
    }
  }

  console.log(`events ready → ${created} created, ${updated} refreshed (${seedEvents.length} total)`);
} catch (error) {
  console.error("seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
