import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getConsoleNavCounts } from "@/lib/console";
import { getSession } from "@/lib/session";

/**
 * The live numbers for the console menu badges — one small GET instead of
 * downloading three full lists on every navigation. Admin only: the layout
 * gates the pages, and this repeats the gate for direct API calls.
 */
export async function GET() {
  await io();

  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ counts: await getConsoleNavCounts() });
}
