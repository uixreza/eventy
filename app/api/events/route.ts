import { NextResponse } from "next/server";
import { io } from "next/cache";
import { getPublishedEvents } from "@/lib/events";

/**
 * The public list behind `/events` — every `PUBLISHED` row as it is right
 * now. The handler reads nothing request-specific, so `io()` keeps it out
 * of the prerender: it runs per client fetch instead of shipping a
 * build-time snapshot. The rows themselves come from the tagged cache in
 * `lib/events.ts`, which every publish/edit/remove invalidates.
 */
export async function GET() {
  await io();

  return NextResponse.json({ events: await getPublishedEvents() });
}
