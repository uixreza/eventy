import { NextResponse } from "next/server";
import { getConsoleCategories } from "@/lib/categories";
import { getSession } from "@/lib/session";

/**
 * The whole category list behind `/console/categories`. Read fresh on every
 * client fetch — nothing here is cached, so a category created a minute ago
 * is already in the list, a delete is gone, and the event counts are the
 * current database numbers. Admin only — the console layout gates the page,
 * and this repeats the gate for direct API calls (same contract as
 * `/api/console/users`).
 */
export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ categories: await getConsoleCategories() });
}
