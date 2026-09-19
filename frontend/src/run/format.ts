/** Presentation helpers for run results. No decisions are made here. */
import { t } from '../i18n/qq';

/** Rejection reasons are a stable server enum (TZ section 19). */
export const REASON_TEXT = t.reasons;

export function describeReason(reason: string | null): string {
  if (!reason) {
    return '';
  }

  return REASON_TEXT[reason] ?? reason;
}

/** The server's activity enum, in the player's language. */
export function describeActivity(activity: string | undefined): string {
  if (!activity) {
    return '';
  }

  return t.activity[activity] ?? activity;
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
