/**
 * Runs once, when the Next.js server starts — before it accepts a request.
 *
 * The Prisma query engine picks a random client id when it boots, and that
 * `crypto.getRandomValues()` call is an "unstable value" for Cache
 * Components: when the engine happens to boot while a route is being
 * prerendered, Next flags the route with a `blocking-prerender-crypto` error.
 *
 * Booting the engine here — outside any render — keeps that call in the
 * startup phase, where it belongs. The warm-up query is best effort: the
 * database may be briefly unreachable at boot, and the server must still
 * start (the first request retries).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    /* The first request will connect — nothing to do here. */
  }
}
