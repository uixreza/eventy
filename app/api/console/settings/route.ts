import { NextResponse } from "next/server";
import { io } from "next/cache";
import { readSitePricing } from "@/lib/pricing";
import { getSession } from "@/lib/session";

/**
 * The live prices for `/console/settings`, read fresh on every client fetch.
 *
 * Admin only — the console layout gates the page, and this repeats the gate
 * for direct API calls (same contract as `/api/console/ads`).
 */
export async function GET() {
  await io();

  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ pricing: await readSitePricing() });
}
