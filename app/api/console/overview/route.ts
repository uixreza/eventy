import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getConsoleOverview } from "@/lib/console";
import { getSession } from "@/lib/session";

/**
 * Everything `/console` renders: the four stat cards, the moderation queue,
 * the system alerts and the broadcasts that were sent. Read fresh on every
 * client fetch — nothing here is cached, so a review approved a second ago
 * is already reflected and a broadcast just written is already listed.
 *
 * Admin only — the console layout gates the page, and this repeats the gate
 * for direct API calls (same contract as `/api/console/users`).
 */
export async function GET() {
  await io();

  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ overview: await getConsoleOverview() });
}
