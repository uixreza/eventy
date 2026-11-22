/**
 * The shapes `/dashboard/notifications` renders.
 *
 * There is no notifications table — every row here is *derived* on the server
 * from rows that do exist: a `Broadcast`, a `Registration` (and the event it
 * belongs to), a hosted event's moderation status, or a `Bookmark` on an
 * event that is nearly full. The client only groups, filters and remembers
 * which ids this browser has read.
 */

/** What produced the row — the client maps it to an icon and a tint. */
export type NotificationKind =
  | "broadcast"
  | "ticket"
  | "waitlist"
  | "reminder"
  | "published"
  | "rejected"
  | "pending"
  | "cancelled"
  | "seat";

/** The day bucket a row falls into, relative to today in Iran. */
export type NotificationGroup =
  | "upcoming"
  | "today"
  | "yesterday"
  | "week"
  | "earlier";

export type DashboardNotification = {
  /** Stable across loads, so «خوانده‌شده» sticks: e.g. `ticket:<id>`. */
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  /** «۲ ساعت پیش» / «فردا، ۱۶:۰۰» — already formatted on the server. */
  time: string;
  /** Real instant the row refers to, ISO — the sort key, newest first. */
  at: string;
  group: NotificationGroup;
  /** Where the row leads, when there is somewhere to go. */
  href?: string;
};

/** One page of the feed, newest first. */
export type NotificationFeed = {
  notifications: DashboardNotification[];
};
