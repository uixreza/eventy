import { getLiveBus } from "./live-bus.mjs";

/**
 * Live-refresh topics. Each one maps to a client loader that already knows how
 * to refetch its own API; a message only asks it to run that fetch again.
 */
export type LiveTopic =
  | "console:events"
  | "console:event-reports"
  | "console:tickets"
  | "console:nav-counts"
  | "dashboard:events"
  | "dashboard:tickets"
  | "dashboard:notifications";

export type LiveRefreshMessage = {
  type: "refresh";
  topics: LiveTopic[];
  /** When present, dashboard topics are only for this account. */
  userId?: string;
  issuedAt: number;
};

type LiveListener = (message: LiveRefreshMessage) => void;

/** Used by the custom WebSocket server to forward bus messages to sockets. */
export function subscribeToLiveEvents(listener: LiveListener): () => void {
  const bus = getLiveBus();
  bus.listeners.add(listener as (message: unknown) => void);
  return () => {
    bus.listeners.delete(listener as (message: unknown) => void);
  };
}

function publishLiveRefresh(
  topics: LiveTopic[],
  options: { userId?: string } = {},
): void {
  const message: LiveRefreshMessage = {
    type: "refresh",
    topics: [...new Set(topics)],
    issuedAt: Date.now(),
  };
  if (options.userId) message.userId = options.userId;

  /* A failed listener must never break the server action that just saved a
     row — live refresh is best-effort on top of the database write. */
  for (const listener of [...getLiveBus().listeners]) {
    try {
      (listener as LiveListener)(message);
    } catch {
      /* Ignore one socket fan-out failure; the others still get the event. */
    }
  }
}

/** Event queue, organizer lists and event-derived notifications changed. */
export function publishEventsChanged(options: { userId?: string } = {}): void {
  publishLiveRefresh(
    [
      "console:events",
      "console:nav-counts",
      "dashboard:events",
      "dashboard:notifications",
    ],
    options,
  );
}

/** A visitor sent a report; the admin inbox and its badge must follow. */
export function publishEventReportsChanged(): void {
  publishLiveRefresh(["console:event-reports", "console:nav-counts"]);
}

/** A support conversation changed on either side of the product. */
export function publishTicketsChanged(options: { userId?: string } = {}): void {
  publishLiveRefresh(
    [
      "console:tickets",
      "console:nav-counts",
      "dashboard:tickets",
      "dashboard:notifications",
    ],
    options,
  );
}

/** The derived notification feed changed without another list being touched. */
export function publishNotificationsChanged(
  options: { userId?: string } = {},
): void {
  publishLiveRefresh(["dashboard:notifications"], options);
}
