import { NextResponse } from "next/server";
import {
  getBookmarkedIds,
  getEnrolledEvents,
  getHostedEvents,
} from "@/lib/events";
import { getSession } from "@/lib/session";
import { getOpenTicketCount } from "@/lib/tickets";

/**
 * The dashboard overview's rows — greeting name, both of the user's lists,
 * how many events they have saved, and how many support tickets are open.
 *
 * Every one of these reads the tables on the call (the list readers are
 * uncached on purpose), so the overview shows the database as it is now,
 * including changes made outside this app's own actions.
 */
export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [hosted, enrolled, bookmarkedIds, openTicketCount] = await Promise.all([
    getHostedEvents(userId),
    getEnrolledEvents(userId),
    getBookmarkedIds(userId),
    getOpenTicketCount(userId),
  ]);

  return NextResponse.json({
    userName: session.user.name ?? "",
    hosted,
    enrolled,
    savedCount: bookmarkedIds.length,
    openTicketCount,
  });
}
