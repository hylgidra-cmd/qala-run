/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useMemo, useState } from 'react';
import { type AuthUser, googleAuthUser, loginUser, registerUser } from './api';

const TOKEN_KEY = 'dontstop.token';
const USER_KEY = 'dontstop.user';
const LEGACY_TOKEN_KEY = 'qalarun.token';
const LEGACY_USER_KEY = 'qalarun.user';

function loadStored(): AuthUser | null {
  try {
    let raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_USER_KEY);
      if (raw) {
        localStorage.setItem(USER_KEY, raw);
      }
    }
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
    }
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadStored);

  const persist = useCallback((u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, u.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.setItem('dontstop.registered', 'true');
    try {
      const now = new Date();
      const trialEnds = new Date(now.getTime() + 3 * 86400 * 1000).toISOString();
      localStorage.setItem(
        'dontstop.local_me',
        JSON.stringify({
          user_id: u.user_id,
          player_id: u.player_id,
          display_name: u.display_name,
          email: u.email ?? null,
          color_hex: u.color_hex || '#00ff88',
          city: u.city ?? 'nukus',
          avatar_data: u.avatar_data ?? null,
          joined_at: now.toISOString(),
          stats: { runs_accepted: 0, solo_area_m2: 0, clan_area_m2: 0, total_distance_m: 0 },
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
        }),
      );
    } catch {
      // ignore
    }
    setUser(u);
  }, []);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const u = await loginUser(usernameOrEmail, password);
      persist(u);
      return u;
    },
    [persist],
  );

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      displayName?: string,
      city?: string,
      avatarData?: string | null,
      colorHex?: string,
    ) => {
      const u = await registerUser(
        username,
        email,
        password,
        displayName,
        city,
        avatarData,
        colorHex,
      );
      persist(u);
      return u;
    },
    [persist],
  );

  const loginWithGoogle = useCallback(
    async (input: {
      id_token?: string;
      email?: string;
      display_name?: string;
      city?: string;
      color_hex?: string;
      avatar_data?: string | null;
    }) => {
      const u = await googleAuthUser(input);
      persist(u);
      return u;
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setUser(null);
  }, []);

  const token = useMemo(
    () => localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY),
    [user],
  );
  const isAuthenticated = user !== null;

  return { user, token, isAuthenticated, login, register, loginWithGoogle, logout };
}

/** Returns the Authorization header value for API calls.
 *  Falls back to X-Demo-User device key for backward compat. */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  // Legacy device-key fallback
  const key = localStorage.getItem('dontstop.device') ?? '';
  return { 'X-Demo-User': key };
}



