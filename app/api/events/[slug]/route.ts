import { NextResponse } from "next/server";
import { getEventBySlug, getRegistration, getSimilarEvents } from "@/lib/events";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * One published event for `/events/[slug]`: the card, its page copy, the
 * similar list, and the visitor's own booking state (signed in or not,
 * which ticket they hold). Both the session and the event reads happen at
 * request time, so the page always shows the row as it is right now.
 *
 * A slug with no published event behind it answers `null` with a 200,
 * which the client turns into a not-found card: `notFound()` only runs on
 * the server, and this page's rows are fetched by the browser.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const session = await getSession();
  const userId = session?.user?.id;

  const found = await getEventBySlug(slug, userId);
  if (!found) return NextResponse.json(null);

  const { event, details, isOwner } = found;

  const [similar, registration] = await Promise.all([
    getSimilarEvents(event.id, event.category),
    userId ? getRegistration(event.id, userId) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    event,
    details,
    similar,
    enrollment: { signedIn: Boolean(userId), isOwner, registration },
  });
}
