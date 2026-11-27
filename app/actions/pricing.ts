"use server";

import { updateTag } from "next/cache";
import { requireAdminActor } from "@/app/actions/user";
import { prisma } from "@/lib/prisma";
import { PRICING_TAG } from "@/lib/pricing";
import {
  DEFAULT_SITE_PRICING,
  MAX_SITE_PRICE,
} from "@/lib/pricing-types";
import { normalizeDigits } from "@/lib/utils";

export type PricingResult = { ok: true } | { ok: false; error: string };

const PRICING_ID = "primary";

/**
 * Saves the promotion price shown in the event wizard — admin only.
 *
 * The `eventPrice` row stays deliberately untouched: it is a display-only
 * mock for now. Persian digits and the grouped form the admin sees are both
 * accepted; `updateTag` refreshes the cached public read on the next render.
 */
export async function savePromotionPrice(
  input: string | number,
): Promise<PricingResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  const digits = normalizeDigits(String(input));
  if (!digits) {
    return { ok: false, error: "قیمت تبلیغ رویداد را وارد کنید." };
  }

  const price = Number(digits);
  if (!Number.isSafeInteger(price) || price < 0 || price > MAX_SITE_PRICE) {
    return {
      ok: false,
      error: `قیمت باید عددی بین ۰ و ${MAX_SITE_PRICE.toLocaleString("en-US")} تومان باشد.`,
    };
  }

  try {
    await prisma.sitePricing.upsert({
      where: { id: PRICING_ID },
      update: { promotionPrice: price },
      create: {
        id: PRICING_ID,
        promotionPrice: price,
        eventPrice: DEFAULT_SITE_PRICING.eventPrice,
      },
    });
  } catch {
    return { ok: false, error: "ذخیره قیمت ممکن نشد؛ دوباره تلاش کنید." };
  }

  updateTag(PRICING_TAG);
  return { ok: true };
}
