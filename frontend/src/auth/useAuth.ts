/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useMemo, useState } from 'react';
import { type AuthUser, loginUser, registerUser } from './api';

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
    setUser(u);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const u = await loginUser(username, password);
      persist(u);
      return u;
    },
    [persist],
  );

  const register = useCallback(
    async (
      username: string,
      password: string,
      displayName?: string,
      city?: string,
      avatarData?: string | null,
    ) => {
      const u = await registerUser(username, password, displayName, city, avatarData);
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

  return { user, token, isAuthenticated, login, register, logout };
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


