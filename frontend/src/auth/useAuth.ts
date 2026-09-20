import { useCallback, useMemo, useState } from 'react';
import { type AuthUser, loginUser, registerUser } from './api';

const TOKEN_KEY = 'qalarun.token';
const USER_KEY = 'qalarun.user';

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
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
    async (username: string, password: string, displayName?: string) => {
      const u = await registerUser(username, password, displayName);
      persist(u);
      return u;
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const token = useMemo(() => localStorage.getItem(TOKEN_KEY), [user]);
  const isAuthenticated = user !== null;

  return { user, token, isAuthenticated, login, register, logout };
}

/** Returns the Authorization header value for API calls.
 *  Falls back to X-Demo-User device key for backward compat. */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  // Legacy device-key fallback
  const key = localStorage.getItem('dontstop.deviceKey') ?? '';
  return { 'X-Demo-User': key };
}

