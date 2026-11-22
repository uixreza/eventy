"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { DEFAULT_CITY, DEFAULT_PROVINCE } from "@/lib/iran-locations";

/**
 * The one place the visitor's location lives.
 *
 * The header carries the central picker; the event form reads the same
 * value, so the city of a new event follows the location the visitor picked
 * for the site. The choice is kept in `localStorage`, and the store is read
 * through `useSyncExternalStore` — the server renders the default and the
 * browser takes over after hydration, with no `setState` inside an effect.
 */

export type LocationValue = {
  /** The province (استان). */
  province: string;
  /** The city (شهر) inside that province. */
  city: string;
};

const STORAGE_KEY = "kooja:location";
const CHANGE_EVENT = "kooja:location-change";

export const DEFAULT_LOCATION: LocationValue = {
  province: DEFAULT_PROVINCE,
  city: DEFAULT_CITY,
};

/* The parsed snapshot is cached, so `read()` always returns the very same
   object for the same stored value — `useSyncExternalStore` compares
   snapshots by identity. */
let cachedRaw: string | null = null;
let cachedValue: LocationValue = DEFAULT_LOCATION;

function read(): LocationValue {
  if (typeof window === "undefined") return DEFAULT_LOCATION;

  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === cachedRaw) return cachedValue;

  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as LocationValue) : null;
    cachedValue =
      parsed && typeof parsed.province === "string" && typeof parsed.city === "string"
        ? parsed
        : DEFAULT_LOCATION;
  } catch {
    cachedValue = DEFAULT_LOCATION;
  }
  return cachedValue;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Stores the location and tells every listener about it. */
export function writeLocation(next: LocationValue): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Private mode — the location simply stays for this page view. */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const LocationContext = createContext<LocationValue>(DEFAULT_LOCATION);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const location = useSyncExternalStore(subscribe, read, () => DEFAULT_LOCATION);
  return <LocationContext.Provider value={location}>{children}</LocationContext.Provider>;
}

/** The current location, and a setter that updates every picker at once. */
export function useLocation(): {
  location: LocationValue;
  setLocation: (next: LocationValue) => void;
} {
  const location = useContext(LocationContext);
  return { location, setLocation: writeLocation };
}
