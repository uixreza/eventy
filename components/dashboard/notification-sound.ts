"use client";

/**
 * The chime for live dashboard/ticket updates.
 *
 * The file lives in `public/`, so Next serves it from the site root; see the
 * `public` folder convention in `node_modules/next/dist/docs`. The element is
 * created on the client only (no `Audio` on the server) and warmed before the
 * first hint so the first chime is not waiting on a network fetch.
 */
const SOUND_URL = "/assets/sounds/notification.mp3";

/* One action can publish several refresh topics, and both the shell and the
   page loaders may receive them. Keep that batch to a single chime. */
const DEDUPE_MS = 400;

let audio: HTMLAudioElement | null = null;
let lastPlayedAt = 0;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (audio) return audio;
  try {
    const element = new Audio();
    element.preload = "auto";
    element.src = SOUND_URL;
    element.load();
    audio = element;
  } catch {
    /* Audio is optional — a browser without it still gets every live refresh. */
    return null;
  }
  return audio;
}

/** Warm the element on mount so the first live hint can play immediately. */
export function preloadNotificationSound(): void {
  getAudio();
}

/** Plays the notification sound, ignoring autoplay/decoding failures. */
export function playNotificationSound(): void {
  const element = getAudio();
  if (!element) return;

  const now = Date.now();
  if (now - lastPlayedAt < DEDUPE_MS) return;
  lastPlayedAt = now;

  try {
    element.pause();
    element.currentTime = 0;
    void element.play().catch(() => {
      /* Autoplay can be blocked until the first user interaction. */
    });
  } catch {
    /* A missing or undecodable source must never interrupt a live refresh. */
  }
}
