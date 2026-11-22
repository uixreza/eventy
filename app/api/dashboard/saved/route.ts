import { NextResponse } from "next/server";
import { getBookmarkedEvents } from "@/lib/events";
import { getSession } from "@/lib/session";

/**
 * The favorites list behind `/dashboard/saved` — the `Bookmark` rows as
 * they are right now. Read fresh on every client fetch; nothing here is
 * cached, so a save made a moment ago is already in the answer.
 */
export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getBookmarkedEvents(userId));
}
