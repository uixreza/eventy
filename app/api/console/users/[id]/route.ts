import { NextResponse } from "next/server";
import { getConsoleUser } from "@/lib/users";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * One account in full — the profile, its hosted events and its tickets —
 * for the client detail modal of `/console/users`, fetched the moment the
 * modal opens. Admin only, same as the list above.
 *
 * A missing account answers `null` with a 200, which the client turns into
 * its own not-found state: `notFound()` only runs on the server.
 */
export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  return NextResponse.json(await getConsoleUser(id));
}
