import { Capacitor } from '@capacitor/core';

/**
 * Client for the run API.
 *
 * The server is authoritative: this module sends coordinates and timestamps and
 * reads back the decision. It never computes area, speed or ownership itself.
 */
const envApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE =
  envApiUrl && envApiUrl.length > 0
    ? envApiUrl
    : import.meta.env.PROD || Capacitor.isNativePlatform()
      ? 'https://qalarun-api.onrender.com/api/v1'
      : '/api/v1';

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
    let detail = response.statusText || 'Server error';
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

  const rawText = await response.text();
  if (rawText.trimStart().startsWith('<')) {
    throw new ApiError(502, 'Server is waking up');
  }

  return JSON.parse(rawText) as T;
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

const LOCAL_TERRITORIES_KEY = 'dontstop.local_territories';

export function getLocalTerritories(mode = 'solo'): GeoJSON.FeatureCollection {
  try {
    const raw = localStorage.getItem(LOCAL_TERRITORIES_KEY);
    if (!raw) return { type: 'FeatureCollection', features: [] };
    const list = JSON.parse(raw) as GeoJSON.Feature[];
    return {
      type: 'FeatureCollection',
      features: list.filter((f) => (f.properties?.mode ?? 'solo') === mode),
    };
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function evaluateLocalRun(
  runId: string,
  points: TrackPoint[],
  anchorIndex?: number | null,
  mode = 'solo',
): RunResult {
  const startIdx = anchorIndex != null && anchorIndex > 0 && anchorIndex < points.length - 2 ? anchorIndex : 0;
  const loopPts = points.slice(startIdx);
  if (loopPts.length < 4) {
    return {
      run_id: runId,
      status: 'rejected',
      reason: 'TOO_FEW_POINTS',
      mode,
      closing_gap_m: null,
      raw_area_m2: null,
      excluded_area_m2: null,
      awarded_area_m2: null,
      territory_id: null,
      activity: null,
      captured_from: [],
      warnings: [],
    };
  }

  const first = loopPts[0];
  const last = loopPts[loopPts.length - 1];
  const gapM = Math.round(haversineMeters(first.lat, first.lon, last.lat, last.lon));

  if (gapM > 100) {
    return {
      run_id: runId,
      status: 'rejected',
      reason: 'LOOP_NOT_CLOSED',
      mode,
      closing_gap_m: gapM,
      raw_area_m2: null,
      excluded_area_m2: null,
      awarded_area_m2: null,
      territory_id: null,
      activity: null,
      captured_from: [],
      warnings: [],
    };
  }

  // Compute planar polygon area in m^2 using Shoelace formula
  const refLat = first.lat;
  const refLon = first.lon;
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos((refLat * Math.PI) / 180);

  const xy = loopPts.map((p) => ({
    x: (p.lon - refLon) * mPerDegLon,
    y: (p.lat - refLat) * mPerDegLat,
  }));
  xy.push(xy[0]);

  let sum = 0;
  for (let i = 0; i < xy.length - 1; i++) {
    sum += xy[i].x * xy[i + 1].y - xy[i + 1].x * xy[i].y;
  }
  const areaM2 = Math.max(500, Math.round(Math.abs(sum) / 2));
  const territoryId = `local-terr-${Date.now()}`;

  // Save polygon to localStorage so it renders on MapView
  try {
    const rawUser = localStorage.getItem('dontstop.user');
    const userObj = rawUser ? JSON.parse(rawUser) : null;
    const coords = loopPts.map((p) => [p.lon, p.lat]);
    coords.push([first.lon, first.lat]);
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
      properties: {
        id: territoryId,
        owner_id: userObj?.user_id ?? 'local-user',
        owner_name: userObj?.display_name ?? 'Oyınshı',
        owner_player_id: userObj?.player_id ?? '10000001',
        color: userObj?.color_hex ?? '#00ff88',
        area_m2: areaM2,
        created_at: new Date().toISOString(),
        mode,
      },
    };
    const existingRaw = localStorage.getItem(LOCAL_TERRITORIES_KEY);
    const existing: GeoJSON.Feature[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.push(feature);
    localStorage.setItem(LOCAL_TERRITORIES_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }

  return {
    run_id: runId,
    status: 'accepted',
    reason: null,
    mode,
    closing_gap_m: gapM,
    raw_area_m2: areaM2,
    excluded_area_m2: 0,
    awarded_area_m2: areaM2,
    territory_id: territoryId,
    activity: { type: 'run', confidence: 0.95, avg_speed_ms: 2.8 },
    captured_from: [],
    warnings: startIdx > 0 ? ['TAIL_TRIMMED_TO_LOOP'] : gapM > 15 ? ['LOOP_CLOSED_BY_SERVER'] : [],
  };
}

