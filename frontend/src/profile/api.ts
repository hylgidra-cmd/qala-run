/**
 * Profile and clan client.
 *
 * The 8-digit player id, the clan roster and every area figure come from the
 * server; nothing here is computed in the browser.
 */
import { request } from '../run/api';

export interface ClanBrief {
  id: string;
  name: string;
  tag: string;
  color_hex: string;
  role: string;
  member_count: number;
}

export interface ClanMember {
  user_id: string;
  player_id: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface Clan {
  id: string;
  name: string;
  tag: string;
  color_hex: string;
  created_at: string;
  member_count: number;
  area_m2: number;
  members: ClanMember[];
  /** Only ever sent to a member of the clan. */
  invite_code: string | null;
}

export interface Me {
  user_id: string;
  player_id: string;
  display_name: string;
  color_hex: string;
  city?: string;
  avatar_data?: string | null;
  joined_at: string;
  stats: {
    runs_accepted: number;
    solo_area_m2: number;
    clan_area_m2: number;
  };
  clan: ClanBrief | null;
}

export function fetchMe() {
  return request<Me>('/me');
}

export function updateMe(input: {
  display_name?: string;
  color_hex?: string;
  city?: string;
  avatar_data?: string | null;
}) {
  return request<Me>('/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function renameMe(displayName: string) {
  return updateMe({ display_name: displayName });
}

export function fetchClan(clanId: string) {
  return request<Clan>(`/clans/${clanId}`);
}

export function createClan(input: { name: string; tag: string; color_hex: string }) {
  return request<Clan>('/clans', { method: 'POST', body: JSON.stringify(input) });
}

export function joinClan(inviteCode: string) {
  return request<Clan>('/clans/join', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode.toUpperCase() }),
  });
}

export function leaveClan(clanId: string) {
  return request<void>(`/clans/${clanId}/leave`, { method: 'POST' });
}

export function removeMember(clanId: string, memberId: string) {
  return request<void>(`/clans/${clanId}/members/${memberId}`, { method: 'DELETE' });
}

export interface PlayerStanding {
  user_id: string;
  player_id: string;
  display_name: string;
  color_hex: string;
  city: string;
  avatar_data?: string | null;
  runs_count: number;
  total_area_m2: number;
}

export interface ClanStanding {
  id: string;
  name: string;
  tag: string;
  color_hex: string;
  member_count: number;
  area_m2: number;
}

export interface RunHistoryItem {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  mode: string;
  avg_speed_ms: number | null;
  distance_m: number | null;
  awarded_area_m2: number | null;
  activity_type: string | null;
}

export function fetchPlayerLeaderboard(city?: string | null) {
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  return request<PlayerStanding[]>(`/players/leaderboard${query}`);
}

export function fetchClanLeaderboard() {
  return request<ClanStanding[]>('/clans/leaderboard');
}

export function fetchMyRuns() {
  return request<RunHistoryItem[]>('/me/runs');
}

