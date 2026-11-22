import { NextResponse } from "next/server";
import { getEnrolledEvents, getHostedEvents } from "@/lib/events";
import { getSession } from "@/lib/session";

/**
 * "My events": what the user hosts plus what they enrolled in. Read fresh
 * on every client fetch; nothing here is cached.
 */
export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [hosted, enrolled] = await Promise.all([
    getHostedEvents(userId),
    getEnrolledEvents(userId),
  ]);

  return NextResponse.json({ hosted, enrolled });
}
