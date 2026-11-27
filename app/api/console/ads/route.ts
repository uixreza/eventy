import { NextResponse } from "next/server";
import { io } from "next/cache";
import { readSiteAnnouncement } from "@/lib/announcement";
import { getSession } from "@/lib/session";

/**
 * The ad text, link and banner with its destination for `/console/ads`, read
 * fresh on every client fetch.
 * No cache sits between the admin and the database, so a just-saved line (or
 * a just-cleared one) is what the form loads. `io()` keeps the session read
 * out of the prerender, as on `/api/console/overview`.
 *
 * Admin only — the console layout gates the page, and this repeats the gate
 * for direct API calls (same contract as `/api/console/categories`).
 */
export async function GET() {
  await io();

  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ announcement: await readSiteAnnouncement() });
}
