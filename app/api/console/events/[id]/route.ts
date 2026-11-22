import { NextResponse } from "next/server";
import { getConsoleEvent } from "@/lib/events";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * One event in full — every field the review modal shows and the console
 * edit form starts from, so an admin can read the whole thing (long
 * description, organizer, live counts) before approving it. Admin only.
 *
 * A missing event answers `null` with a 200, which the client turns into
 * its own not-found state: `notFound()` only runs on the server.
 */
export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  return NextResponse.json(await getConsoleEvent(id));
}
