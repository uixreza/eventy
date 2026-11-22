/**
 * The shapes `/console/reports` renders.
 *
 * Everything is plain and serializable — `lib/reports.ts` assembles it on the
 * server, `GET /api/console/reports` hands it out, and the client only lays
 * it out. Numbers arrive already formatted for display (Persian digits), so
 * the page does no arithmetic of its own except splitting the daily series
 * across the selected window.
 */

/** The three windows the range pills switch between, in days. */
export type ReportRange = 7 | 30 | 90;

/** One Iranian day's registration count. */
export type ReportDay = {
  /** «۲۸ آبان» — the day this bucket counts. */
  date: string;
  count: number;
};

/** One slice of the category donut: a category and its share of the catalog. */
export type ReportShare = {
  label: string;
  /** Whole percent, 0–100. */
  percent: number;
};

/** One row of «رویدادهای برتر» — ordered by confirmed registrations. */
export type ReportTopEvent = {
  id: string;
  title: string;
  city: string;
  /** Formatted confirmed-registration count, e.g. «۱۸۶». */
  registrations: string;
  /** Formatted share of the event's capacity, e.g. «۸۲٪». */
  fill: string;
};

export type ConsoleReports = {
  /**
   * Confirmed registrations per Iranian day for the last 180 days, oldest
   * first. The longest window is 90 days, so every range still has its
   * previous equal-length period for the change figure.
   */
  daily: ReportDay[];
  /** Fill rate across every published event — a live figure. */
  fill: { value: string; change: string };
  /** Share of published events per category — a live figure. */
  share: ReportShare[];
  /** The five most-registered published events — a live figure. */
  topEvents: ReportTopEvent[];
  /** Seeded: nothing on the platform counts page views. */
  visitors: { value: string; change: string };
  /** Seeded: there is no payments table, so revenue cannot be computed. */
  revenue: { value: string; change: string };
};
