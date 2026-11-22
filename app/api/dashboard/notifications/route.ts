import { NextResponse } from "next/server";
import { getDashboardNotifications } from "@/lib/notifications";
import { getSession } from "@/lib/session";

/**
 * The feed behind `/dashboard/notifications` — derived from the tables on
 * every fetch: broadcasts, this person's registrations and tickets, the
 * moderation status of the events they host, and saved events that are
 * nearly full. Nothing is cached, so a registration made a moment ago is
 * already in the answer.
 *
 * The session decides whose rows come back; a visitor gets 401.
 */
export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    notifications: await getDashboardNotifications(userId),
  });
}
