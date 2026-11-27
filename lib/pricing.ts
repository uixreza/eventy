/**
 * The site-wide prices shown in the event wizard and `/console/settings`.
 *
 * The public read is cached and tagged, so an admin save invalidates it with
 * `updateTag("site-pricing")`; the console reads the row directly because its
 * settings form must show what is stored right now. The singleton may not
 * exist yet — both reads fall back to the documented defaults.
 */

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SITE_PRICING,
  type SitePricingData,
} from "@/lib/pricing-types";

export const PRICING_TAG = "site-pricing";
const PRICING_ID = "primary";

/** Direct read for the console form — no cache between admin and database. */
export async function readSitePricing(): Promise<SitePricingData> {
  const row = await prisma.sitePricing.findUnique({
    where: { id: PRICING_ID },
    select: { eventPrice: true, promotionPrice: true },
  });
  return {
    eventPrice: row?.eventPrice ?? DEFAULT_SITE_PRICING.eventPrice,
    promotionPrice: row?.promotionPrice ?? DEFAULT_SITE_PRICING.promotionPrice,
  };
}

/** Public read used by the event wizard's promotion section. */
export async function getPublicPricing(): Promise<SitePricingData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PRICING_TAG);

  return readSitePricing();
}
