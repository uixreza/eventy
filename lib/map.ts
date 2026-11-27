/**
 * Shared map defaults for event pins.
 *
 * The exact point comes from the organizer's click (or the browser's current
 * position). When an older event has no pin, the city centre gives the public
 * page a sensible place to show instead of an empty map.
 */

export type MapPoint = { lat: number; lng: number };

/** Tehran is the platform default, matching the header's default city. */
export const DEFAULT_MAP_CENTER: MapPoint = { lat: 35.6892, lng: 51.389 };

const CITY_CENTERS: Record<string, MapPoint> = {
  تهران: { lat: 35.6892, lng: 51.389 },
  اصفهان: { lat: 32.6572, lng: 51.6771 },
  مشهد: { lat: 36.2972, lng: 59.6067 },
  شیراز: { lat: 29.5918, lng: 52.5837 },
  تبریز: { lat: 38.0792, lng: 46.2887 },
  بجنورد: { lat: 37.4712, lng: 57.3281 },
  کرج: { lat: 35.8344, lng: 50.9924 },
  رشت: { lat: 37.2809, lng: 49.5832 },
  اهواز: { lat: 31.3183, lng: 48.6706 },
  قم: { lat: 34.6416, lng: 50.8746 },
};

export function isValidMapPoint(point: MapPoint | null | undefined): point is MapPoint {
  return (
    Boolean(point) &&
    Number.isFinite(point!.lat) &&
    Number.isFinite(point!.lng) &&
    point!.lat >= -90 &&
    point!.lat <= 90 &&
    point!.lng >= -180 &&
    point!.lng <= 180
  );
}

/** The point to open a map at: the stored pin first, then the city centre. */
export function eventMapCenter(city?: string, point?: MapPoint | null): MapPoint {
  if (isValidMapPoint(point)) return point;
  const known = city?.trim() ? CITY_CENTERS[city.trim()] : undefined;
  return known ?? DEFAULT_MAP_CENTER;
}
