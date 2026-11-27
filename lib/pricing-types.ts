/**
 * The serializable price row shared by the public wizard and the console.
 *
 * Kept free of `server-only` imports so client loaders and forms can use it
 * without pulling the database-backed module into the browser bundle.
 */
export type SitePricingData = {
  /** Mock event price — shown in the console but not editable yet. */
  eventPrice: number;
  /** Price of the top-placement toggle in the event wizard, in Toman. */
  promotionPrice: number;
};

/** What the site uses when the singleton row has never been saved. */
export const DEFAULT_SITE_PRICING: SitePricingData = {
  eventPrice: 0,
  promotionPrice: 250_000,
};

/** Upper bound shared by the console form and the server action. */
export const MAX_SITE_PRICE = 100_000_000;
