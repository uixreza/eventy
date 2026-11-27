import { NextResponse } from "next/server";
import { getHostedEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { eventMapCenter } from "@/lib/map";

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
  /* Older in-person rows have no pin — give the form the city centre so the
     map is never blank and a save stores a real point. */
  const pin =
    event.mode === "ONLINE"
      ? null
      : eventMapCenter(event.city, {
          lat: event.latitude ?? Number.NaN,
          lng: event.longitude ?? Number.NaN,
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
      latitude: pin?.lat ?? null,
      longitude: pin?.lng ?? null,
      onlineUrl: event.onlineUrl ?? "",
      capacity: event.capacity,
      highlights: event.highlights,
      agenda: event.agenda,
      price: event.price,
      gradient: event.gradient,
      images: event.images,
      needsPhotographyTeam: event.needsPhotographyTeam,
      promoted: event.promoted,
      mode: event.mode,
      jy: event.jy,
      jm: event.jm,
      jd: event.jd,
      hour: event.hour,
      minute: event.minute,
    },
  });
}
