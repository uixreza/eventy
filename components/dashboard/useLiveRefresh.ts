"use client";

import { useEffect, useRef } from "react";
import { playNotificationSound, preloadNotificationSound } from "./notification-sound";
import type { LiveTopic } from "@/lib/live-events";

function liveUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/live`;
}

/**
 * Subscribes a client loader to live refresh hints from the Node WebSocket
 * server. When one of the requested topics changes, the loader's existing
 * `reload()` runs — the socket never carries row data, so permissions and
 * caching stay in the API routes that already own them.
 */
export function useLiveRefresh(
  topics: readonly LiveTopic[],
  onRefresh: () => void,
  options: { playSound?: boolean } = {},
): void {
  const handlerRef = useRef(onRefresh);
  const topicsRef = useRef(topics);
  const shouldPlaySound = options.playSound ?? false;
  const soundRef = useRef(shouldPlaySound);

  useEffect(() => {
    handlerRef.current = onRefresh;
    topicsRef.current = topics;
    soundRef.current = shouldPlaySound;
  }, [onRefresh, topics, shouldPlaySound]);

  useEffect(() => {
    if (shouldPlaySound) preloadNotificationSound();
  }, [shouldPlaySound]);

  const topicKey = [...topics].sort().join("|");

  useEffect(() => {
    let disposed = false;
    let retryTimer: number | undefined;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (disposed) return;
      try {
        socket = new WebSocket(liveUrl());
      } catch {
        retryTimer = window.setTimeout(connect, 2_000);
        return;
      }

      socket.addEventListener("message", (event) => {
        if (typeof event.data !== "string") return;
        try {
          const message = JSON.parse(event.data) as {
            type?: string;
            topics?: string[];
          };
          if (message.type !== "refresh" || !Array.isArray(message.topics)) return;
          if (
            message.topics.some((topic) =>
              topicsRef.current.includes(topic as LiveTopic),
            )
          ) {
            /* Only a real WebSocket hint gets here — never the initial fetch
               or a manual `reload()` from a retry button / local mutation. */
            if (soundRef.current) playNotificationSound();
            handlerRef.current();
          }
        } catch {
          /* Ignore malformed frames; they never come from our server. */
        }
      });

      socket.addEventListener("close", () => {
        if (!disposed) retryTimer = window.setTimeout(connect, 2_000);
      });
      socket.addEventListener("error", () => socket?.close());
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      socket?.close();
    };
    /* `topicKey` is the stable identity of the topic list. */
  }, [topicKey]);
}
