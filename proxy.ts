import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

/**
 * Route gate for the two protected areas. Runs before every matching request —
 * including client-side navigations and prefetches — so an unauthorized
 * visitor is turned around before a single byte of the page renders.
 *
 * Only the signed session cookie is read here (no database), which keeps the
 * check cheap: `proxy.ts` must never import Prisma. `lib/session.ts` repeats
 * the same rules on the server for defense in depth.
 */

const COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"] as const;

async function readSession(request: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  for (const name of COOKIE_NAMES) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;

    try {
      /* Auth.js derives the JWT key from the cookie name — the salt has to be
         the same one the session was signed with. */
      return await decode({ token, secret, salt: name });
    } catch {
      /* Wrong key for this cookie variant — fall through to the next one. */
    }
  }

  return null;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isConsole = pathname === "/console" || pathname.startsWith("/console/");
  if (!isDashboard && !isConsole) return NextResponse.next();

  const session = await readSession(request);

  /* No (valid) session → the auth page. It opens the same phone/OTP modal as
     the marketing CTAs, then returns to the route the visitor asked for. */
  if (!session?.id) {
    const authUrl = new URL("/auth", request.nextUrl);
    authUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(authUrl);
  }

  /* /console is admin-only; everyone else belongs in their own dashboard. */
  if (isConsole && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/console/:path*"],
};
