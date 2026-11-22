import { NextResponse } from "next/server";
import { getHostedEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * One of the caller's own events, pre-filled for the edit form. Anyone
 * else's event (or a missing one) comes back as `null`, which the client
 * turns into a not-found card.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const event = await getHostedEvent(id, userId);
  if (!event) return NextResponse.json(null);

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return NextResponse.json({
    organizerName: row?.name ?? session.user.name ?? "",
    initial: {
      id: event.id,
      title: event.title,
      category: event.category,
      description: event.description || event.summary,
      city: event.city,
      venue: event.venue,
      onlineUrl: event.onlineUrl ?? "",
      capacity: event.capacity,
      highlights: event.highlights,
      agenda: event.agenda,
      price: event.price,
      gradient: event.gradient,
      mode: event.mode,
      jy: event.jy,
      jm: event.jm,
      jd: event.jd,
      hour: event.hour,
      minute: event.minute,
    },
  });
}
