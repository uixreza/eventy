/**
 * The one-line advertisement shown above the landing page's hero.
 *
 * The public read is cached and tagged so an admin's save invalidates it
 * immediately; the console reads the same row directly because its ads page
 * is deliberately uncached and must show what is stored right now.
 */

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { SiteAnnouncementData } from "@/lib/announcement-types";
import { prisma } from "@/lib/prisma";

export const ANNOUNCEMENT_TAG = "site-announcement";
const ANNOUNCEMENT_ID = "primary";

/** Direct read for the console form — no cache between admin and database. */
export async function readSiteAnnouncement(): Promise<SiteAnnouncementData> {
  const row = await prisma.siteAnnouncement.findUnique({
    where: { id: ANNOUNCEMENT_ID },
    select: { text: true, link: true, bannerKey: true, bannerLink: true },
  });
  return {
    text: row?.text ?? "",
    link: row?.link ?? "",
    bannerKey: row?.bannerKey ?? null,
    bannerLink: row?.bannerLink ?? "",
  };
}

/** Public read: empty text means the landing page renders no strip at all. */
export async function getSiteAnnouncement(): Promise<SiteAnnouncementData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ANNOUNCEMENT_TAG);

  return readSiteAnnouncement();
}
