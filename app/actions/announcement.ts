"use server";

import { updateTag } from "next/cache";
import { requireAdminActor } from "@/app/actions/user";
import { MAX_AD_LINK, normalizeAdLink } from "@/lib/ad-link";
import { ANNOUNCEMENT_TAG } from "@/lib/announcement";
import { prisma } from "@/lib/prisma";
import {
  deleteSiteBannerObject,
  uploadSiteBanner,
} from "@/lib/site-banner-storage";

export type AnnouncementResult = { ok: true } | { ok: false; error: string };

/** One line, so the strip never grows taller than its 2rem slot. */
const MAX_TEXT = 160;
const ANNOUNCEMENT_ID = "primary";

/**
 * Saves the site-wide advertisement line and its optional link — admin only.
 *
 * The session is re-checked here, not trusted from the console form. An empty
 * text is valid and removes the strip; `updateTag` makes the next public
 * render read the new values instead of the tagged cached ones.
 */
export async function saveSiteAnnouncement(
  text: string,
  link: string,
): Promise<AnnouncementResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  const cleanText = text.trim().replace(/\s+/g, " ");
  if (cleanText.length > MAX_TEXT) {
    return { ok: false, error: `متن تبلیغاتی باید کمتر از ${MAX_TEXT} حرف باشد.` };
  }
  if (link.trim().length > MAX_AD_LINK) {
    return { ok: false, error: `لینک تبلیغاتی باید کمتر از ${MAX_AD_LINK} حرف باشد.` };
  }

  const cleanLink = normalizeAdLink(link);
  if (cleanLink === null) {
    return { ok: false, error: "لینک تبلیغاتی نامعتبر است؛ از یک آدرس http یا https استفاده کنید." };
  }

  try {
    await prisma.siteAnnouncement.upsert({
      where: { id: ANNOUNCEMENT_ID },
      update: { text: cleanText, link: cleanLink },
      create: { id: ANNOUNCEMENT_ID, text: cleanText, link: cleanLink },
    });
  } catch {
    return { ok: false, error: "ذخیره متن تبلیغاتی ممکن نشد؛ دوباره تلاش کنید." };
  }

  updateTag(ANNOUNCEMENT_TAG);
  return { ok: true };
}

/**
 * Saves the banner destination and, when a file is supplied, swaps the image.
 *
 * The file arrives as `FormData` from `/console/ads`. Its original bytes go
 * straight into the private bucket (so GIFs keep animating), the row is
 * pointed at the new key, and only then is the previous object deleted. The
 * link can also be saved on its own — an empty file input is not an error. A
 * failed database write rolls the new object back; a failed cleanup never
 * hides a successful save.
 */
export async function saveSiteBanner(
  form: FormData,
): Promise<AnnouncementResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  const current = await prisma.siteAnnouncement.findUnique({
    where: { id: ANNOUNCEMENT_ID },
    select: { bannerKey: true, bannerLink: true },
  });
  const previous = current?.bannerKey ?? null;
  const currentLink = current?.bannerLink ?? "";

  const rawLink = form.get("bannerLink");
  if (rawLink !== null && typeof rawLink !== "string") {
    return { ok: false, error: "لینک بنر نامعتبر است." };
  }
  const linkInput = rawLink === null ? currentLink : rawLink;
  if (linkInput.trim().length > MAX_AD_LINK) {
    return { ok: false, error: `لینک بنر باید کمتر از ${MAX_AD_LINK} حرف باشد.` };
  }
  const bannerLink = normalizeAdLink(linkInput);
  if (bannerLink === null) {
    return {
      ok: false,
      error: "لینک بنر نامعتبر است؛ از یک آدرس http یا https استفاده کنید.",
    };
  }

  const file = form.get("banner");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && bannerLink === currentLink) return { ok: true };

  let key = previous;
  if (hasFile && file instanceof File) {
    try {
      key = await uploadSiteBanner(file);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "آپلود بنر ممکن نشد.",
      };
    }
  }

  try {
    await prisma.siteAnnouncement.upsert({
      where: { id: ANNOUNCEMENT_ID },
      update: { bannerKey: key, bannerLink },
      create: { id: ANNOUNCEMENT_ID, bannerKey: key, bannerLink },
    });
  } catch {
    if (hasFile && key && key !== previous) {
      await deleteSiteBannerObject(key).catch(() => {});
    }
    return { ok: false, error: "ذخیره بنر ممکن نشد؛ دوباره تلاش کنید." };
  }

  if (hasFile && previous && previous !== key) {
    await deleteSiteBannerObject(previous).catch(() => {});
  }

  updateTag(ANNOUNCEMENT_TAG);
  return { ok: true };
}

/**
 * Removes the landing banner and its private-bucket object — admin only.
 * The stored destination is kept, so a later upload can reuse it.
 */
export async function deleteSiteBanner(): Promise<AnnouncementResult> {
  const gate = await requireAdminActor();
  if (!gate.ok) return gate;

  const current = await prisma.siteAnnouncement.findUnique({
    where: { id: ANNOUNCEMENT_ID },
    select: { bannerKey: true },
  });
  const previous = current?.bannerKey ?? null;

  try {
    await prisma.siteAnnouncement.upsert({
      where: { id: ANNOUNCEMENT_ID },
      update: { bannerKey: null },
      create: { id: ANNOUNCEMENT_ID, bannerKey: null },
    });
  } catch {
    return { ok: false, error: "حذف بنر ممکن نشد؛ دوباره تلاش کنید." };
  }

  if (previous) {
    await deleteSiteBannerObject(previous).catch(() => {});
  }

  updateTag(ANNOUNCEMENT_TAG);
  return { ok: true };
}
