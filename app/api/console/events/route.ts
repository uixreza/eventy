import { NextResponse } from "next/server";
import { getConsoleEvents } from "@/lib/events";
import { getSession } from "@/lib/session";

/**
 * The moderation queue behind `/console/events` — every event, newest first.
 * Read fresh on every client fetch: nothing here is cached, so an event
 * created a moment ago is already in the list and an approve/reject result
 * is the answer the next load sees. Admin only — the console layout gates
 * the page, and this repeats the gate for direct API calls.
 */
export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ events: await getConsoleEvents() });
}
