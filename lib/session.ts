import "server-only";

import { cache } from "react";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Data Access Layer for the session. Every protected render and every server
 * action that touches user data goes through these helpers, so the rules live
 * in one place instead of being re-invented per route.
 *
 * The JWT is verified by NextAuth itself; `proxy.ts` repeats the cheap part of
 * this check on every request so bad redirects happen before rendering.
 */

/**
 * Memoized per render pass — several components can ask for the user once.
 *
 * The signed cookie says *who*; the row says *what that still means*. The
 * row is re-read on every request so the two mutable facts land immediately:
 * a role change (a demoted admin loses `/console` on their next request, no
 * re-login needed) and an admin ban — a blocked or deleted account reads as
 * signed out here, so pages, APIs and server actions all treat its stale
 * cookie exactly like a visitor's.
 */
export const getSession = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!session || !id) return null;

  const row = await prisma.user.findUnique({
    where: { id },
    select: { name: true, role: true, bannedAt: true },
  });
  if (!row || row.bannedAt) return null;

  return { ...session, user: { ...session.user, name: row.name, role: row.role } };
});

/**
 * Any signed-in user. Sends visitors back to the marketing site.
 *
 * `io()` stops the prerender right before the session is read. The read
 * itself is a request-time API, but Auth.js re-encrypts the session JWT on
 * every call, and that encryption calls `crypto.getRandomValues()` — an
 * "unstable value" that Cache Components refuses to run while prerendering a
 * route. With `io()` the whole read happens at request time instead.
 */
export async function requireUser() {
  await io();
  const session = await getSession();
  const user = session?.user;
  if (!user?.id) redirect("/");
  return user;
}

/** Admin only — `/console`. Non-admins land on their own dashboard. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
