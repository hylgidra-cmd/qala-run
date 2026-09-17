/**
 * Client for the run API.
 *
 * The server is authoritative: this module sends coordinates and timestamps and
 * reads back the decision. It never computes area, speed or ownership itself.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const DEVICE_KEY_STORAGE = 'qalarun.device';

export interface TrackPoint {
  lat: number;
  lon: number;
  ts: number;
  accuracy: number | null;
  speed: number | null;
  mocked: boolean;
}

export interface ActivityOut {
  type: string;
  confidence: number;
  avg_speed_ms: number;
}

export interface CapturedFrom {
  user_id: string;
  username: string;
  area_lost_m2: number;
}

export interface RunResult {
  run_id: string;
  status: 'accepted' | 'rejected';
  reason: string | null;
  mode: string;
  raw_area_m2: number | null;
  excluded_area_m2: number | null;
  awarded_area_m2: number | null;
  territory_id: string | null;
  activity: ActivityOut | null;
  captured_from: CapturedFrom[];
  warnings: string[];
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** A random per-browser id. DEMO ONLY - it replaces authentication. */
export function deviceKey(): string {
  try {
    const stored = localStorage.getItem(DEVICE_KEY_STORAGE);
    if (stored) {
      return stored;
    }

    const created = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(DEVICE_KEY_STORAGE, created);

    return created;
  } catch {
    // Private windows can refuse storage; a per-session id still works.
    return crypto.randomUUID().replace(/-/g, '');
  }
}

/** Browser fix -> API point. `speed` is sent for audit only. */
export function toTrackPoint(position: GeolocationPosition): TrackPoint {
  return {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    ts: position.timestamp / 1000,
    accuracy: position.coords.accuracy ?? null,
    speed: position.coords.speed ?? null,
    mocked: false,
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-User': deviceKey(),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // A non-JSON error body is still an error.
    }

    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function startRun(mode = 'solo') {
  return request<{ run_id: string; mode: string; started_at: string }>(
    `/runs/start?mode=${encodeURIComponent(mode)}`,
    { method: 'POST' },
  );
}

export function sendPoints(runId: string, points: TrackPoint[]) {
  return request<{ run_id: string; stored: number; total: number }>(`/runs/${runId}/points`, {
    method: 'POST',
    body: JSON.stringify({ points }),
  });
}

export function finishRun(runId: string) {
  return request<RunResult>(`/runs/${runId}/finish`, { method: 'POST' });
}

export function abandonRun(runId: string) {
  return request<void>(`/runs/${runId}/abandon`, { method: 'POST' });
}

export function fetchTerritories(
  bbox: [number, number, number, number],
  mode = 'solo',
): Promise<GeoJSON.FeatureCollection> {
  const query = new URLSearchParams({ bbox: bbox.join(','), mode });

  return request<GeoJSON.FeatureCollection>(`/territories?${query.toString()}`);
}
