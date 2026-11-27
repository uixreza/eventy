/**
 * The serializable announcement row shared by the public site and console.
 *
 * Kept free of `server-only` imports so client loaders can use the type
 * without pulling the database-backed module into the browser bundle.
 */
export type SiteAnnouncementData = {
  /** The single line shown in the strip; empty means no strip at all. */
  text: string;
  /** Optional destination for that line; empty means plain, unlinked text. */
  link: string;
  /** Private-bucket object key of the banner; null means no banner section. */
  bannerKey: string | null;
  /** Optional destination for the banner image; empty means plain image. */
  bannerLink: string;
};
