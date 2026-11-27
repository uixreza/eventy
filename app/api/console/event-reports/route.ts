import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getAdminEventReports } from "@/lib/event-reports";
import { getSession } from "@/lib/session";

/**
 * The managers' inbox of visitor reports. Admin only — the console layout
 * gates the page, and this repeats the gate for direct API calls.
 */
export async function GET() {
  await io();

  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ reports: await getAdminEventReports() });
}
