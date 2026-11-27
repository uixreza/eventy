/**
 * The read side of `/console/categories` — every category row plus the live
 * event count behind it, assembled from the database on each request.
 *
 * Categories and events are deliberately decoupled: `Event.category` stays a
 * free-text string (organizers type it into the event form), so the count
 * here is a `groupBy` over that column rather than a relation. A category
 * named «فناوری و AI» therefore counts every event whose `category` string
 * equals it, exactly as the public grids filter.
 */

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatJalaliFull } from "@/lib/jalali";
import { FALLBACK_ICON } from "@/lib/category-icons";
import type { ConsoleCategory } from "@/lib/category-types";

export async function getConsoleCategories(): Promise<ConsoleCategory[]> {
  const [rows, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
    /* One pass over events: category string → how many carry it. */
    prisma.event.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);

  const countBy = new Map(counts.map((row) => [row.category, row._count._all]));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    /* An unknown key degrades to the generic tag on the client anyway. */
    icon: row.icon || FALLBACK_ICON,
    visible: row.visible,
    eventCount: countBy.get(row.name) ?? 0,
    createdAt: formatJalaliFull(row.createdAt),
  }));
}

/** One visible category as the public pages speak it: name + icon key. */
export type PublicCategory = {
  name: string;
  /** Registry key from `lib/category-icons.ts`. */
  icon: string;
};

/**
 * Every category's icon key, by name.
 *
 * An event row keeps its category as a free-text string, so a card that
 * wants the category's glyph resolves it through this map. Unlike
 * `getPublicCategories`, hidden rows are included: hiding a category takes
 * it off the hero picker and the `/events` chips, not off the events that
 * already carry its name.
 */
export async function getCategoryIcons(): Promise<Record<string, string>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");

  const rows = await prisma.category.findMany({ select: { name: true, icon: true } });
  return Object.fromEntries(rows.map((row) => [row.name, row.icon || FALLBACK_ICON]));
}

/**
 * The categories the public pages show — visible rows only, in the order the
 * console lists them. Hidden categories never reach the landing grid, the
 * header dropdown, the hero search or the `/events` chips, and an admin's
 * change is picked up on the next render because every category action calls
 * `updateTag("categories")`.
 *
 * Cached with the same contract as `getPublishedEvents` (`lib/events.ts`):
 * `cacheLife("minutes")` bounds staleness, `cacheTag` lets the console
 * invalidate on write, and the value is plain data so it can live in the
 * static shell.
 */
export async function getPublicCategories(): Promise<PublicCategory[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");

  const rows = await prisma.category.findMany({
    where: { visible: true },
    orderBy: { createdAt: "asc" },
    select: { name: true, icon: true },
  });

  return rows.map((row) => ({ name: row.name, icon: row.icon || FALLBACK_ICON }));
}
