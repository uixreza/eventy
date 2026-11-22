/**
 * The shapes one global notification takes on its way to the browser.
 *
 * Plain and serializable — the server writes the row, `GET /api/broadcasts`
 * hands this out, and the console form reads the very same shape back.
 */

export type BroadcastNotice = {
  id: string;
  /** Headline — the toast's title. */
  title: string;
  /** Optional second line; empty when the admin sent a title only. */
  body: string;
  /** «۲۸ آبان ۱۴۰۵ - ۱۶:۰۰» */
  sentAt: string;
};
