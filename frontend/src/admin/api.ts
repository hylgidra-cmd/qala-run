import { request } from '../run/api';

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
  online_players: number;
  active_runs: number;
  total_runs: number;
  total_territories: number;
  total_area_m2: number;
}

export function fetchLiveRunners(): Promise<LiveRunner[]> {
  return request<LiveRunner[]>('/admin/runners');
}

export function fetchAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats');
}

export function resetMap(): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>('/admin/reset-map', { method: 'POST' });
}

