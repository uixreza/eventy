import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * The organizer name the event wizard shows in its preview. `getSession`
 * re-reads the profile row on every request, so a name saved in settings
 * a moment ago is already the one handed to the preview — the JWT's minted
 * name never reaches this route.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ name: session.user.name ?? "" });
}
