"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { sileo } from "sileo";
import { eventMapCenter, isValidMapPoint, type MapPoint } from "@/lib/map";

type LeafletModule = typeof import("leaflet");
type LeafletMap = import("leaflet").Map;

type EventMapProps = {
  /** The organizer's exact pin, when one has been chosen. */
  point?: MapPoint | null;
  /** Used to centre the map when no exact pin exists yet. */
  city?: string;
  /** Present turns the map into a picker and fires on every click. */
  onSelect?: (point: MapPoint) => void;
  selectable?: boolean;
  className?: string;
};

/** A self-contained pin — no bundled marker images to go missing. */
const pinHtml = `
  <span style="display:flex;width:30px;height:38px;align-items:flex-start;justify-content:center">
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 24 32" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0Z"
        fill="#2563eb" stroke="#ffffff" stroke-width="2" />
      <circle cx="12" cy="12" r="4" fill="#ffffff" />
    </svg>
  </span>`;

export default function EventMap({
  point,
  city,
  onSelect,
  selectable = false,
  className = "h-64",
}: EventMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const onSelectRef = useRef(onSelect);
  const pointRef = useRef(point);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  /* Keep the latest callbacks/value for Leaflet's long-lived listeners. */
  useEffect(() => {
    onSelectRef.current = onSelect;
    pointRef.current = point;
  }, [onSelect, point]);

  const placeMarker = useCallback((next: MapPoint) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    markerRef.current?.remove();
    markerRef.current = L.marker([next.lat, next.lng], {
      icon: L.divIcon({
        className: "kooja-event-pin",
        html: pinHtml,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
      }),
    }).addTo(map);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let instance: LeafletMap | null = null;

    async function init() {
      const L = await import("leaflet");
      if (cancelled || !hostRef.current || mapRef.current) return;
      leafletRef.current = L;

      const initial = eventMapCenter(city, pointRef.current);
      instance = L.map(hostRef.current, {
        center: [initial.lat, initial.lng],
        zoom: isValidMapPoint(pointRef.current) ? 15 : 12,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(instance);

      /* Store the instance first so `placeMarker` can use it below. */
      mapRef.current = instance;
      if (isValidMapPoint(pointRef.current)) placeMarker(pointRef.current);
      if (selectable) {
        instance.on("click", (event) => {
          const next = { lat: event.latlng.lat, lng: event.latlng.lng };
          placeMarker(next);
          onSelectRef.current?.(next);
        });
      }

      setReady(true);
      requestAnimationFrame(() => instance?.invalidateSize());
    }

    void init();
    return () => {
      cancelled = true;
      instance?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      markerRef.current = null;
    };
  }, [city, placeMarker, selectable]);

  /* An outside change (e.g. the geolocation button in the parent) keeps the
     pin and the viewport in sync with the value the form will save. */
  const pointLat = point?.lat;
  const pointLng = point?.lng;
  useEffect(() => {
    if (
      pointLat === undefined ||
      pointLng === undefined ||
      !isValidMapPoint({ lat: pointLat, lng: pointLng }) ||
      !mapRef.current
    ) {
      return;
    }
    placeMarker({ lat: pointLat, lng: pointLng });
    mapRef.current.setView([pointLat, pointLng], Math.max(mapRef.current.getZoom(), 14));
  }, [placeMarker, pointLat, pointLng]);

  function locate() {
    if (!navigator.geolocation) {
      sileo.error({
        title: "مکان فعلی در دسترس نیست",
        description: "مرورگر شما از یافتن موقعیت پشتیبانی نمی کند.",
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lng: coords.longitude };
        placeMarker(next);
        mapRef.current?.setView([next.lat, next.lng], 16);
        onSelectRef.current?.(next);
        setLocating(false);
        sileo.success({
          title: "مکان فعلی پیدا شد",
          description: "نشانگر روی نقشه قرار گرفت.",
        });
      },
      () => {
        setLocating(false);
        sileo.error({
          title: "مکان فعلی پیدا نشد",
          description: "دسترسی به موقعیت مکانی را در مرورگر اجازه دهید.",
        });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-[#eaf0f6] dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <div ref={hostRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-slate-100/80 text-xs font-bold text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
          در حال بارگذاری نقشه...
        </div>
      )}
      {selectable && (
        <button
          type="button"
          onClick={locate}
          disabled={locating || !ready}
          aria-label="یافتن مکان فعلی"
          title="یافتن مکان فعلی"
          className="absolute bottom-3 right-3 z-[1100] flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-md transition-all duration-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-blue-400"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
