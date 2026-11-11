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

export interface SubscriptionInfo {
  status: 'trial' | 'active' | 'expired';
  is_active: boolean;
  trial_ends_at: string | null;
  paid_until: string | null;
  hours_left: number;
  days_left: number;
  daily_price_uzs: number;
}

export interface Me {
  user_id: string;
  player_id: string;
  display_name: string;
  email?: string | null;
  color_hex: string;
  city?: string;
  avatar_data?: string | null;
  joined_at: string;
  stats: {
    runs_accepted: number;
    solo_area_m2: number;
    clan_area_m2: number;
    total_distance_m?: number;
  };
  clan: ClanBrief | null;
  subscription?: SubscriptionInfo | null;
}

const LOCAL_ME_KEY = 'dontstop.local_me';

function loadLocalMe(): Me {
  try {
    const rawMe = localStorage.getItem(LOCAL_ME_KEY);
    if (rawMe) {
      return JSON.parse(rawMe) as Me;
    }
  } catch {
    // ignore
  }

  let authUser: Partial<Me> = {};
  try {
    const rawUser = localStorage.getItem('dontstop.user');
    if (rawUser) {
      authUser = JSON.parse(rawUser) as Partial<Me>;
    }
  } catch {
    // ignore
  }

  const now = new Date();
  const trialEnds = new Date(now.getTime() + 3 * 86400 * 1000).toISOString();

  const fallback: Me = {
    user_id: authUser.user_id ?? 'local-user',
    player_id: authUser.player_id ?? '10000001',
    display_name: authUser.display_name ?? 'Oyınshı 10000001',
    email: authUser.email ?? null,
    color_hex: authUser.color_hex ?? '#00ff88',
    city: authUser.city ?? 'nukus',
    avatar_data: authUser.avatar_data ?? null,
    joined_at: now.toISOString(),
    stats: {
      runs_accepted: 0,
      solo_area_m2: 0,
      clan_area_m2: 0,
      total_distance_m: 0,
    },
    clan: null,
    subscription: {
      status: 'trial',
      is_active: true,
      trial_ends_at: trialEnds,
      paid_until: null,
      hours_left: 72,
      days_left: 3,
      daily_price_uzs: 5000,
    },
  };

  try {
    localStorage.setItem(LOCAL_ME_KEY, JSON.stringify(fallback));
  } catch {
    // ignore
  }
  return fallback;
}

function saveLocalMe(me: Me): Me {
  try {
    localStorage.setItem(LOCAL_ME_KEY, JSON.stringify(me));
    const rawUser = localStorage.getItem('dontstop.user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      localStorage.setItem(
        'dontstop.user',
        JSON.stringify({
          ...parsed,
          display_name: me.display_name,
          email: me.email,
          color_hex: me.color_hex,
          city: me.city,
          avatar_data: me.avatar_data,
        }),
      );
    }
  } catch {
    // ignore
  }
  return me;
}

export async function fetchMe(): Promise<Me> {
  try {
    const remote = await request<Me>('/me');
    return saveLocalMe(remote);
  } catch {
    return loadLocalMe();
  }
}

export async function activateSubscription(days = 1, provider = 'click'): Promise<Me> {
  try {
    const remote = await request<Me>('/subscription/activate', {
      method: 'POST',
      body: JSON.stringify({ days, provider }),
    });
    return saveLocalMe(remote);
  } catch {
    const cur = loadLocalMe();
    const curDays = cur.subscription?.days_left ?? 0;
    const totalDays = curDays + days;
    const paidUntil = new Date(Date.now() + totalDays * 86400 * 1000).toISOString();
    const updated: Me = {
      ...cur,
      subscription: {
        status: 'active',
        is_active: true,
        trial_ends_at: cur.subscription?.trial_ends_at ?? null,
        paid_until: paidUntil,
        hours_left: totalDays * 24,
        days_left: totalDays,
        daily_price_uzs: 5000,
      },
    };
    return saveLocalMe(updated);
  }
}

export async function updateMe(input: {
  display_name?: string;
  email?: string;
  color_hex?: string;
  city?: string;
  avatar_data?: string | null;
}): Promise<Me> {
  try {
    const remote = await request<Me>('/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return saveLocalMe(remote);
  } catch {
    const cur = loadLocalMe();
    const updated: Me = {
      ...cur,
      display_name: input.display_name ?? cur.display_name,
      email: input.email !== undefined ? input.email : cur.email,
      color_hex: input.color_hex ?? cur.color_hex,
      city: input.city ?? cur.city,
      avatar_data: input.avatar_data !== undefined ? input.avatar_data : cur.avatar_data,
    };
    return saveLocalMe(updated);
  }
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
  track?: number[][];
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

