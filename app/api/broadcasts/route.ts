import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getBroadcasts } from "@/lib/broadcasts";

/**
 * The public notification feed — every page load asks this for the newest
 * global broadcasts. It is deliberately open: the toasts are not secret and
 * gating them would mean a signed-out visitor never learns the site is down
 * for maintenance.
 *
 * The handler reads nothing request-specific, so `io()` keeps it out of the
 * prerender (same contract as `/api/events`): it runs per client fetch
 * instead of shipping a build-time snapshot, which is what makes a broadcast
 * sent a moment ago appear on the very next load.
 */
export async function GET() {
  await io();

  return NextResponse.json({ broadcasts: await getBroadcasts() });
}
