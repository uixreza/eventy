import Image from "next/image";
import {
  SITE_BANNER_HEIGHT,
  SITE_BANNER_WIDTH,
  siteBannerUrl,
} from "@/lib/site-banner";

/**
 * The single ad banner between the hero and the hot events.
 *
 * Rendered only when a key is stored. The local src is signed on demand by
 * `/api/site-banner/[key]`; `unoptimized` lets the browser follow that redirect
 * directly and, crucially, keeps animated GIFs animated. A stored destination
 * turns the whole image into a new-tab link; without one it stays plain.
 */
export default function SiteBanner({
  bannerKey,
  link = "",
}: {
  bannerKey: string;
  link?: string;
}) {
  const image = (
    <Image
      src={siteBannerUrl(bannerKey)}
      alt="بنر تبلیغاتی"
      width={SITE_BANNER_WIDTH}
      height={SITE_BANNER_HEIGHT}
      sizes="(max-width: 1024px) 100vw, 1200px"
      unoptimized
      className="h-auto w-full rounded-2xl shadow-sm"
    />
  );

  return (
    <section
      aria-label="بنر تبلیغاتی"
      className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7"
    >
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </section>
  );
}
