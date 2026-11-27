/**
 * Shared rules for event photos.
 *
 * The database stores only opaque object keys. This module is safe to import
 * from both the browser form and server code: it contains no credentials and
 * performs no I/O, just the key shape, limits, and the public serving path.
 */

export const MAX_EVENT_IMAGES = 6;
/** Input cap. Photos are downscaled to WebP before they reach the bucket. */
export const MAX_EVENT_IMAGE_BYTES = 10 * 1024 * 1024;
/** Longest edge of the stored WebP; plenty for the widest review gallery. */
export const EVENT_IMAGE_MAX_EDGE = 1600;
export const EVENT_IMAGE_WEBP_QUALITY = 78;

/** Browser-renderable inputs. SVG is excluded because it can script. */
export const EVENT_IMAGE_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
] as const;

export type EventImageInputType = (typeof EVENT_IMAGE_INPUT_TYPES)[number];

export function isEventImageInputType(type: string): type is EventImageInputType {
  return (EVENT_IMAGE_INPUT_TYPES as readonly string[]).includes(type);
}

/* New uploads are always `.webp`. The older extensions stay valid so photos
   saved before the conversion continue to load and can still be deleted. */
const EVENT_IMAGE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

/** A key generated for a new upload, e.g. `8f14…a2.webp`. */
export function isEventImageKey(value: string): boolean {
  return EVENT_IMAGE_KEY.test(value);
}

/** The local route that signs a private-bucket read for one stored object. */
export function eventImageUrl(key: string): string {
  return `/api/event-images/${key}`;
}

/** A photo chosen in the browser but not yet uploaded on publish. */
export function isLocalEventPreview(src: string): boolean {
  return src.startsWith("blob:");
}
