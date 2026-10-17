import { request } from '../run/api';

const ADMIN_KEY_STORAGE = 'dontstop.adminKey';

export function getAdminKey(): string {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setAdminKey(key: string): void {
  try {
    if (key) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    } else {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    }
  } catch {
    // ignore storage errors
  }
}

function adminHeaders(explicitKey?: string): Record<string, string> {
  const key = explicitKey ?? getAdminKey();
  return key ? { 'X-Admin-Key': key } : {};
}

export interface LiveRunner {
  user_id: string;
  player_id: string;
  display_name: string;
  last_seen_at: string;
  is_online: boolean;
  status: 'running' | 'idle';
  run_id: string | null;
  started_at: string | null;
  points_count: number;
  location: { lat: number; lon: number } | null;
  track: [number, number][]; // [lon, lat][]
  color: string;
}

export interface AdminStats {
  total_players: number;
  online_players: int_or_num;
  active_runs: number;
  total_runs: number;
  total_territories: number;
  total_area_m2: number;
}
type int_or_num = number;

export function fetchLiveRunners(adminKey?: string): Promise<LiveRunner[]> {
  return request<LiveRunner[]>('/admin/runners', {
    headers: adminHeaders(adminKey),
  });
}

export function fetchAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats');
}

export function resetMap(adminKey?: string): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>('/admin/reset-map', {
    method: 'POST',
    headers: adminHeaders(adminKey),
  });
}

