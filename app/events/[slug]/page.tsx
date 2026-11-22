import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import EventDetailLoader from "@/components/events/EventDetailLoader";
import { EventDetailSkeleton } from "@/components/events/EventsSkeletons";
import { getEventBySlug } from "@/lib/events";

type EventDetailParams = { params: Promise<{ slug: string }> };

/**
 * A percent-encoded path segment (a Persian slug becomes `%D8%A2…`) back
 * into the real slug — and a value that is already decoded passes through.
 *
 * `generateMetadata` receives `params.slug` decoded, while the page's own
 * `params` hands over the segment exactly as it appears in the URL. Both
 * call sites normalize through here, so the `<title>` and the rendered
 * event can never disagree over which slug they are looking up.
 */
function decodeSlug(value: string): string {
  if (!value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: EventDetailParams): Promise<Metadata> {
  const { slug } = await params;
  const found = await getEventBySlug(decodeSlug(slug));
  if (!found) return { title: "رویداد پیدا نشد" };
  return { title: found.event.title, description: found.event.summary };
}

/**
 * Everything that depends on `slug` lives inside this child, so the page's
 * App Shell stays URL-independent (Instant navigation / `instant-shell-url-data`).
 * The params promise is passed down un-awaited and only awaited here.
 */
async function EventDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventDetailLoader slug={decodeSlug(slug)} />;
}

export default async function EventDetailPage(props: PageProps<"/events/[slug]">) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      {/* URL-independent shell content: visible immediately on navigation */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به فهرست رویدادها
      </Link>

      {/* Same skeleton in the fallback and in the loader, so the swap from
          shell to fetched content is invisible. */}
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailContent params={props.params} />
      </Suspense>
    </div>
  );
}
