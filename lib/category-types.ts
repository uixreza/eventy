/**
 * The shapes a category takes on its way to `/console/categories` — plain,
 * serializable values: the server reads a Prisma row, turns it into one of
 * these, and the browser only ever sees these. Same contract as
 * `lib/user-types.ts`.
 *
 * `icon` is a key into `lib/category-icons.ts`, never a component — the
 * column stays a string in the database and the client resolves it against
 * the registry to draw the glyph.
 */

/** One line of the categories list in `/console/categories`. */
export type ConsoleCategory = {
  id: string;
  name: string;
  /** Registry key from `lib/category-icons.ts` (`"Tag"` when generic). */
  icon: string;
  /** Hidden categories stay in the console but leave the public grids. */
  visible: boolean;
  /** Events whose free-text `category` equals this name — counted live. */
  eventCount: number;
  /** «۲۸ آبان ۱۴۰۳» */
  createdAt: string;
};
