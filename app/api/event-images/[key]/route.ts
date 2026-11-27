import { connection, NextResponse } from "next/server";
import { isEventImageKey } from "@/lib/event-images";
import { signedEventImageUrl } from "@/lib/event-storage";

/**
 * Serves a private-bucket event photo without exposing the bucket itself.
 *
 * The browser (or `<Image unoptimized>`) requests this local path; we answer
 * with a redirect to a short-lived signed GET URL. Cache Components removed
 * the old `dynamic` segment flag, so `connection()` opts this handler into
 * request time — a build-time signature would expire. The response is also
 * marked no-store.
 */
type RouteContext = { params: Promise<{ key: string }> };

export async function GET(_request: Request, context: RouteContext) {
  await connection();

  const { key } = await context.params;
  if (!isEventImageKey(key)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const location = await signedEventImageUrl(key);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: location,
        "Cache-Control": "private, no-store, must-revalidate",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
