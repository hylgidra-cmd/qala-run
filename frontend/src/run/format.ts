/** Presentation helpers for run results. No decisions are made here. */

/** Rejection reasons are a stable server enum (TZ section 19). */
export const REASON_TEXT: Record<string, string> = {
  LOOP_NOT_CLOSED: 'The loop never came back to the start. Finish where you began.',
  TOO_SHORT: 'The loop is shorter than 300 m.',
  AREA_TOO_SMALL: 'The enclosed area is under 2,000 m².',
  BAD_SHAPE: 'The track could not be turned into a clean shape.',
  ACTIVITY_NOT_ALLOWED: 'Only walking and running count. That pace was too fast.',
  TELEPORT_DETECTED: 'The track jumps further than a person can move.',
  LOW_GPS_QUALITY: 'The GPS signal was too poor or too sparse to trust.',
  OUTSIDE_REGION: 'The loop is outside the Nukus pilot area.',
  NO_AWARDABLE_AREA: 'Nothing was left after exclusion zones were removed.',
  DUPLICATE_RUN: 'This run has already been submitted.',
};

export function describeReason(reason: string | null): string {
  if (!reason) {
    return '';
  }

  return REASON_TEXT[reason] ?? reason;
}

export function formatArea(squareMetres: number | null): string {
  if (squareMetres === null || !Number.isFinite(squareMetres)) {
    return '—';
  }

  if (squareMetres >= 10_000) {
    return `${(squareMetres / 10_000).toFixed(2)} ha`;
  }

  return `${Math.round(squareMetres).toLocaleString('en-US')} m²`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;

  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function formatSpeed(metresPerSecond: number | null): string {
  if (metresPerSecond === null || !Number.isFinite(metresPerSecond)) {
    return '—';
  }

  return `${(metresPerSecond * 3.6).toFixed(1)} km/h`;
}

export function formatDistance(metres: number | null): string {
  if (metres === null || !Number.isFinite(metres)) {
    return '—';
  }

  if (metres >= 1000) {
    return `${(metres / 1000).toFixed(2)} km`;
  }

  return `${Math.round(metres)} m`;
}
