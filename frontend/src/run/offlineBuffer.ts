/**
 * Offline buffer for GPS fixes (docs/TZ-mobile-apk-v1.0.md section 4.2).
 *
 * A runner loses signal under a bridge or in a basement far more often than
 * they lose the phone, so a failed upload must never cost the track. Every
 * fix that has not reached the server is mirrored here, and the run tracker
 * replays the buffer before it asks the server to finish.
 *
 * This is a mirror of the in-memory queue, never the source of truth: the
 * server still decides what the run was.
 */
import type { TrackPoint } from './api';

export const PENDING_POINTS_KEY = 'dontstop.pendingPoints';

/**
 * A long run at one fix per second is a few thousand points. Keeping the
 * newest 5,000 bounds the 5 MB localStorage quota while covering well over an
 * hour of lost connectivity.
 */
export const MAX_BUFFERED_POINTS = 5000;

export interface BufferedBatch {
  runId: string;
  points: TrackPoint[];
}

function isTrackPoint(value: unknown): value is TrackPoint {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const point = value as Record<string, unknown>;

  return (
    typeof point.lat === 'number' &&
    typeof point.lon === 'number' &&
    typeof point.ts === 'number'
  );
}

/** Mirror the queue. An empty queue clears the buffer instead of storing `[]`. */
export function saveBuffer(runId: string, points: TrackPoint[]): void {
  if (points.length === 0) {
    clearBuffer();
    return;
  }

  const batch: BufferedBatch = {
    runId,
    points: points.slice(-MAX_BUFFERED_POINTS),
  };

  try {
    localStorage.setItem(PENDING_POINTS_KEY, JSON.stringify(batch));
  } catch {
    // A private window or a full quota must not end the run. The in-memory
    // queue still holds the points for this session.
  }
}

/** The buffered batch, or null when there is nothing usable to replay. */
export function readBuffer(): BufferedBatch | null {
  let raw: string | null = null;

  try {
    raw = localStorage.getItem(PENDING_POINTS_KEY);
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') {
      return null;
    }

    const { runId, points } = parsed as { runId?: unknown; points?: unknown };
    if (typeof runId !== 'string' || !Array.isArray(points)) {
      return null;
    }

    const usable = points.filter(isTrackPoint);

    return usable.length > 0 ? { runId, points: usable } : null;
  } catch {
    // Half-written JSON from a killed process is not worth recovering.
    return null;
  }
}

export function clearBuffer(): void {
  try {
    localStorage.removeItem(PENDING_POINTS_KEY);
  } catch {
    // Nothing to do: the buffer is best-effort on both ends.
  }
}
