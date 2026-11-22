/**
 * The blur every placeholder box in the console wears.
 *
 * The console mixes live figures (read from the database on each visit) with
 * seeded ones that no table backs — the revenue card, the operational alerts,
 * the whole reports and transactions pages. Those are blurred by a hair so a
 * placeholder can never be mistaken for a live number at a glance; the
 * «داده نمونه» badge next to it stays sharp as the legend. Purely visual:
 * the text stays in the DOM for screen readers.
 */
export const MOCK_CLASS = "blur-[1.5px]";
