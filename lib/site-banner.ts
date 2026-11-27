/**
 * Shared rules for the landing page's single ad banner.
 *
 * Safe to import from both the browser and the server: no credentials, no I/O.
 * The database stores only an opaque object key; `siteBannerUrl` is the local
 * route that signs a short-lived read from the private bucket.
 */

/** The dimensions an admin must supply, and the aspect the landing reserves. */
export const SITE_BANNER_WIDTH = 1200;
export const SITE_BANNER_HEIGHT = 200;

/** Input cap; a GIF banner is stored byte-for-byte, so it stays animated. */
export const MAX_SITE_BANNER_BYTES = 10 * 1024 * 1024;

/** SVG is excluded because it can script; GIF is kept for animated ads. */
const SITE_BANNER_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export type SiteBannerInputType = keyof typeof SITE_BANNER_EXTENSIONS;

/** The browser's `accept` list, kept in one place for the console form. */
export const SITE_BANNER_ACCEPT = Object.keys(SITE_BANNER_EXTENSIONS).join(",");

/** Maps an uploaded MIME type to the extension used in its object key. */
export function siteBannerExtension(type: string): string | null {
  return (
    SITE_BANNER_EXTENSIONS[type as SiteBannerInputType] ?? null
  );
}

/** Only keys this app generated may reach the private bucket or serving route. */
const SITE_BANNER_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif)$/;

export function isSiteBannerKey(value: string): boolean {
  return SITE_BANNER_KEY.test(value);
}

/** The local route that signs a private-bucket read for the stored banner. */
export function siteBannerUrl(key: string): string {
  return `/api/site-banner/${key}`;
}
