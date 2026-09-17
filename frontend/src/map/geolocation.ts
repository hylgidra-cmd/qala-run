import { PILOT_BOUNDS } from './style';

/** Codes from the W3C GeolocationPositionError interface. */
export const PERMISSION_DENIED = 1;
export const POSITION_UNAVAILABLE = 2;
export const TIMEOUT = 3;

export const OUT_OF_BOUNDS_NOTICE =
  'You are outside the Nukus pilot area, so the map cannot follow you yet.';

/**
 * A browser geolocation failure is silent on the map itself: the control just
 * stops. This turns the error code into something the runner can act on.
 */
export function geolocationNotice(code: number): string {
  switch (code) {
    case PERMISSION_DENIED:
      return 'Location is blocked for this site. Allow it in the browser address-bar settings and press the locate button again.';
    case POSITION_UNAVAILABLE:
      return 'No position fix. A laptop without GPS falls back to Wi-Fi positioning, which can fail indoors or on a phone hotspot.';
    case TIMEOUT:
      return 'The location request timed out. Press the locate button again.';
    default:
      return 'Location is unavailable right now.';
  }
}

/** PILOT_BOUNDS is [west, south, east, north] in EPSG:4326. */
export function isInsidePilotBounds(longitude: number, latitude: number): boolean {
  const [west, south, east, north] = PILOT_BOUNDS;

  return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
}
