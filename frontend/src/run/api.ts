/**
 * Client for the run API.
 *
 * The server is authoritative: this module sends coordinates and timestamps and
 * reads back the decision. It never computes area, speed or ownership itself.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const DEVICE_KEY_STORAGE = 'dontstop.device';
/** Pre-rename key. Read once so an existing browser keeps the territories it owns. */
const LEGACY_DEVICE_KEY_STORAGE = 'qalarun.device';

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
  /** Distance between the first and last fix; the runner decides when to stop. */
  closing_gap_m: number | null;
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

    const legacy = localStorage.getItem(LEGACY_DEVICE_KEY_STORAGE);
    if (legacy) {
      localStorage.setItem(DEVICE_KEY_STORAGE, legacy);
      return legacy;
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

/** Returns the correct auth header: Bearer JWT if logged in, X-Demo-User otherwise. */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('dontstop.token') ?? localStorage.getItem('qalarun.token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return { 'X-Demo-User': deviceKey() };
}

/** Shared by every client module: one place that carries the identity. */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
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

export function finishRun(runId: string, anchorIndex?: number | null) {
  const query = anchorIndex != null && anchorIndex > 0 ? `?anchor_index=${anchorIndex}` : '';
  return request<RunResult>(`/runs/${runId}/finish${query}`, { method: 'POST' });
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

/** The zone layer adds one foreign member: the view was capped (TZ section 11). */
export interface ExclusionCollection extends GeoJSON.FeatureCollection {
  truncated?: boolean;
}

export function fetchExclusions(
  bbox: [number, number, number, number],
  kinds: string[] = [],
): Promise<ExclusionCollection> {
  const query = new URLSearchParams({ bbox: bbox.join(',') });
  if (kinds.length > 0) {
    query.set('kind', kinds.join(','));
  }

  return request<ExclusionCollection>(`/zones/exclusions?${query.toString()}`);
}

/** Calculates territory TTL decay matching server rules (7 days solo, 14 days clan). */
export function getTerritoryDecayInfo(
  createdAtStr?: string,
  mode = 'solo',
): { daysLeft: number; percentRemaining: number; isDecayed: boolean } {
  const totalDays = mode === 'clan' ? 14 : 7;
  const createdTime = createdAtStr ? new Date(createdAtStr).getTime() : Date.now();
  const ageMs = Math.max(0, Date.now() - createdTime);
  const ageDays = Math.floor(ageMs / (86400 * 1000));

  const daysLeft = Math.max(0, totalDays - ageDays);
  const percentRemaining = Math.round((daysLeft / totalDays) * 100);
  const isDecayed = daysLeft <= 0;

  return { daysLeft, percentRemaining, isDecayed };
}
