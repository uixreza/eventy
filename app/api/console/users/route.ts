import { NextResponse } from "next/server";
import { getConsoleUsers } from "@/lib/users";
import { getSession } from "@/lib/session";

/**
 * The whole member list behind `/console/users` — every account, newest
 * first, with its activity counts. Read fresh on every client fetch:
 * nothing here is cached, so a signup from a minute ago is already in the
 * list and a ban or role change is the answer the next load sees. Admin
 * only — the console layout gates the page, and this repeats the gate for
 * direct API calls.
 *
 * `me` is the acting admin's own id: the table uses it to fence off the
 * self-demotion and self-ban the server actions refuse anyway.
 */
export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ users: await getConsoleUsers(), me: session.user.id });
}
