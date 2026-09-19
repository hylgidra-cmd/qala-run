import { t } from '../i18n/qq';
import { PILOT_BOUNDS } from './style';

/** Codes from the W3C GeolocationPositionError interface. */
export const PERMISSION_DENIED = 1;
export const POSITION_UNAVAILABLE = 2;
export const TIMEOUT = 3;

export const OUT_OF_BOUNDS_NOTICE = t.geo.outOfBounds;

/**
 * A browser geolocation failure is silent on the map itself: the control just
 * stops. This turns the error code into something the runner can act on.
 */
export function geolocationNotice(code: number): string {
  switch (code) {
    case PERMISSION_DENIED:
      return t.geo.denied;
    case POSITION_UNAVAILABLE:
      return t.geo.unavailable;
    case TIMEOUT:
      return t.geo.timeout;
    default:
      return t.geo.unknown;
  }
}

/** PILOT_BOUNDS is [west, south, east, north] in EPSG:4326. */
export function isInsidePilotBounds(longitude: number, latitude: number): boolean {
  const [west, south, east, north] = PILOT_BOUNDS;

  return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
}
