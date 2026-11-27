import { connection, NextResponse } from "next/server";
import { isSiteBannerKey } from "@/lib/site-banner";
import { signedSiteBannerUrl } from "@/lib/site-banner-storage";

/**
 * Serves the private-bucket landing banner without exposing the bucket itself.
 *
 * The browser (or `<Image unoptimized>`) requests this local path; we answer
 * with a redirect to a short-lived signed GET URL. `connection()` opts the
 * handler into request time under Cache Components — a build-time signature
 * would expire — and the response itself is marked no-store.
 */
type RouteContext = { params: Promise<{ key: string }> };

export async function GET(_request: Request, context: RouteContext) {
  await connection();

  const { key } = await context.params;
  if (!isSiteBannerKey(key)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const location = await signedSiteBannerUrl(key);
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
