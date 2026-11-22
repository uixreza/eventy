import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getConsoleReports } from "@/lib/reports";
import { getSession } from "@/lib/session";

/**
 * Everything `/console/reports` renders: the daily signup series, the fill
 * rate, the category share and the top events — all read from the tables on
 * each client fetch, so a registration that just came in is already counted.
 *
 * Admin only — the console layout gates the page, and this repeats the gate
 * for direct API calls (same contract as `/api/console/overview`).
 */
export async function GET() {
  await io();

  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ reports: await getConsoleReports() });
}
