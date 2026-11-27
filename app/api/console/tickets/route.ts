import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getSession } from "@/lib/session";
import { getAdminTickets } from "@/lib/tickets";

/** The admin inbox. The layout gates the page; this repeats the gate for API calls. */
export async function GET() {
  await io();

  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ tickets: await getAdminTickets() });
}
