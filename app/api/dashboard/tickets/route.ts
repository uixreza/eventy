import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getSession } from "@/lib/session";
import { getMyTickets } from "@/lib/tickets";

/** Signed-in client's own support conversations, newest activity first. */
export async function GET() {
  await io();

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ tickets: await getMyTickets(userId) });
}
