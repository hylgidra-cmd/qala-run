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



