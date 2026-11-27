/**
 * The narrow strip at the very top of the landing page.
 *
 * Light theme uses a black bar; dark theme uses a slightly deeper shade of
 * the header login button's blue so the two read as related accents. Rendered
 * only when the admin has stored a non-empty line. When a link is stored too,
 * the whole line becomes an anchor; the header knows to sit below the strip
 * on first paint (see `SiteHeader`'s `announcementText` prop), then returns to
 * its normal resting/scrolled positions as the page moves.
 */
export default function TopAnnouncement({ text, link = "" }: { text: string; link?: string }) {
  const label = <span className="min-w-0 truncate">{text}</span>;

  return (
    <div
      role="region"
      aria-label="اعلان تبلیغاتی"
      className="flex h-8 w-full items-center justify-center bg-black px-4 text-center text-[11px] font-bold leading-none text-white sm:text-xs dark:bg-blue-700 dark:text-white"
    >
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 max-w-full items-center underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {label}
        </a>
      ) : (
        label
      )}
    </div>
  );
}
