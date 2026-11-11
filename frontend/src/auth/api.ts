import { API_BASE } from '../run/api';

export interface AuthUser {
  token: string;
  user_id: string;
  player_id: string;
  display_name: string;
  email?: string | null;
  color_hex: string;
  city?: string;
  avatar_data?: string | null;
}

export interface SavedGoogleAccount {
  email: string;
  display_name: string;
  avatar_data?: string | null;
  color_hex?: string;
  city?: string;
}

const LOCAL_ACCOUNTS_KEY = 'dontstop.local_accounts';
const SAVED_GOOGLE_ACCOUNTS_KEY = 'dontstop.google_accounts';

interface StoredLocalAccount extends AuthUser {
  username: string;
  password?: string;
}

function loadLocalAccounts(): StoredLocalAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredLocalAccount[]) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: StoredLocalAccount[]): void {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage errors
  }
}

export function getSavedGoogleAccounts(): SavedGoogleAccount[] {
  try {
    const raw = localStorage.getItem(SAVED_GOOGLE_ACCOUNTS_KEY);
    const list: SavedGoogleAccount[] = raw ? JSON.parse(raw) : [];
    const currentRaw = localStorage.getItem('dontstop.user');
    if (currentRaw) {
      const cur = JSON.parse(currentRaw) as AuthUser;
      if (cur.email && cur.email.endsWith('@gmail.com') && !list.some((a) => a.email === cur.email)) {
        list.unshift({
          email: cur.email,
          display_name: cur.display_name,
          avatar_data: cur.avatar_data,
          color_hex: cur.color_hex,
          city: cur.city,
        });
      }
    }
    return list;
  } catch {
    return [];
  }
}

export function saveGoogleAccount(acct: SavedGoogleAccount): void {
  try {
    const list = getSavedGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== acct.email.toLowerCase(),
    );
    list.unshift(acct);
    localStorage.setItem(SAVED_GOOGLE_ACCOUNTS_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    // Ignore storage errors
  }
}

function generatePlayerId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const eightDigits = 10000000 + (hash % 90000000);
  return String(eightDigits);
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'detail' in err) {
    const detail = (err as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg.replace(/^Value error,\s*/i, '');
    }
  }
  return fallback;
}

async function parseJsonOrFallback(
  res: Response,
  fallbackFn: () => AuthUser,
  errorFallbackMsg: string,
): Promise<AuthUser> {
  const text = await res.text();
  // If static host returned HTML (<!doctype html>) or Render returned 502/503/504 hibernate error
  if (text.trimStart().startsWith('<') || res.status >= 500) {
    return fallbackFn();
  }

  if (!res.ok) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      return fallbackFn();
    }
    throw new Error(extractErrorMessage(parsed, errorFallbackMsg));
  }

  try {
    return JSON.parse(text) as AuthUser;
  } catch {
    return fallbackFn();
  }
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  display_name?: string,
  city?: string,
  avatar_data?: string | null,
  color_hex?: string,
): Promise<AuthUser> {
  const localFallback = (): AuthUser => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUser = username.trim();
    const accounts = loadLocalAccounts();
    const existing = accounts.find(
      (a) =>
        a.username.toLowerCase() === cleanUser.toLowerCase() ||
        (a.email && a.email.toLowerCase() === cleanEmail),
    );
    const userObj: StoredLocalAccount = {
      token: existing?.token ?? `local-jwt-${crypto.randomUUID()}`,
      user_id: existing?.user_id ?? `u-${crypto.randomUUID()}`,
      player_id: existing?.player_id ?? generatePlayerId(cleanEmail || cleanUser),
      username: cleanUser,
      password,
      display_name: display_name?.trim() || cleanUser,
      email: cleanEmail,
      color_hex: color_hex ?? '#00ff88',
      city: city ?? 'nukus',
      avatar_data: avatar_data ?? null,
    };
    const next = accounts.filter((a) => a.user_id !== userObj.user_id);
    next.unshift(userObj);
    saveLocalAccounts(next);
    if (cleanEmail.endsWith('@gmail.com')) {
      saveGoogleAccount({
        email: cleanEmail,
        display_name: userObj.display_name,
        avatar_data: userObj.avatar_data,
        color_hex: userObj.color_hex,
        city: userObj.city,
      });
    }
    return userObj;
  };

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        display_name: display_name ?? username,
        city: city ?? 'nukus',
        color_hex: color_hex ?? '#00ff88',
        avatar_data: avatar_data ?? null,
      }),
    });

    const user = await parseJsonOrFallback(res, localFallback, "Ro'yxatdan o'tib bo'lmadi");
    if (user.email?.endsWith('@gmail.com')) {
      saveGoogleAccount({
        email: user.email,
        display_name: user.display_name,
        avatar_data: user.avatar_data,
        color_hex: user.color_hex,
        city: user.city,
      });
    }
    return user;
  } catch (err) {
    if (err instanceof Error && !/fetch|network|json|doctype|unexpected/i.test(err.message)) {
      throw err;
    }
    return localFallback();
  }
}

export async function loginUser(usernameOrEmail: string, password: string): Promise<AuthUser> {
  const localFallback = (): AuthUser => {
    const clean = usernameOrEmail.trim().toLowerCase();
    const accounts = loadLocalAccounts();
    const found = accounts.find(
      (a) => a.username.toLowerCase() === clean || (a.email && a.email.toLowerCase() === clean),
    );
    if (found) {
      return found;
    }
    const isEmail = clean.includes('@');
    const displayName = isEmail ? clean.split('@')[0] : usernameOrEmail.trim();
    const created: StoredLocalAccount = {
      token: `local-jwt-${crypto.randomUUID()}`,
      user_id: `u-${crypto.randomUUID()}`,
      player_id: generatePlayerId(clean),
      username: isEmail ? clean.split('@')[0] : usernameOrEmail.trim(),
      password,
      display_name: displayName,
      email: isEmail ? clean : `${clean}@gmail.com`,
      color_hex: '#00ff88',
      city: 'nukus',
      avatar_data: null,
    };
    accounts.unshift(created);
    saveLocalAccounts(accounts);
    return created;
  };

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrEmail, password }),
    });

    return await parseJsonOrFallback(res, localFallback, 'Kirish amalga oshmadi');
  } catch (err) {
    if (err instanceof Error && !/fetch|network|json|doctype|unexpected/i.test(err.message)) {
      throw err;
    }
    return localFallback();
  }
}

export async function googleAuthUser(input: {
  id_token?: string;
  email?: string;
  display_name?: string;
  city?: string;
  color_hex?: string;
  avatar_data?: string | null;
}): Promise<AuthUser> {
  const localFallback = (): AuthUser => {
    const cleanEmail = (input.email ?? 'player@gmail.com').trim().toLowerCase();
    const accounts = loadLocalAccounts();
    const existing = accounts.find((a) => a.email && a.email.toLowerCase() === cleanEmail);
    const displayName =
      input.display_name?.trim() || existing?.display_name || cleanEmail.split('@')[0];
    const userObj: StoredLocalAccount = {
      token: existing?.token ?? `local-jwt-${crypto.randomUUID()}`,
      user_id: existing?.user_id ?? `u-${crypto.randomUUID()}`,
      player_id: existing?.player_id ?? generatePlayerId(cleanEmail),
      username: existing?.username ?? cleanEmail.split('@')[0].replace(/[^A-Za-z0-9_]/g, '_'),
      display_name: displayName,
      email: cleanEmail,
      color_hex: input.color_hex ?? existing?.color_hex ?? '#00ff88',
      city: input.city ?? existing?.city ?? 'nukus',
      avatar_data: input.avatar_data ?? existing?.avatar_data ?? null,
    };
    const next = accounts.filter((a) => a.user_id !== userObj.user_id);
    next.unshift(userObj);
    saveLocalAccounts(next);
    saveGoogleAccount({
      email: cleanEmail,
      display_name: userObj.display_name,
      avatar_data: userObj.avatar_data,
      color_hex: userObj.color_hex,
      city: userObj.city,
    });
    return userObj;
  };

  try {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_token: input.id_token ?? null,
        email: input.email ?? null,
        display_name: input.display_name ?? '',
        city: input.city ?? 'nukus',
        color_hex: input.color_hex ?? '#00ff88',
        avatar_data: input.avatar_data ?? null,
      }),
    });

    const user = await parseJsonOrFallback(
      res,
      localFallback,
      'Google orqali kirish amalga oshmadi',
    );
    saveGoogleAccount({
      email: user.email || input.email || '',
      display_name: user.display_name,
      avatar_data: user.avatar_data,
      color_hex: user.color_hex,
      city: user.city,
    });
    return user;
  } catch (err) {
    if (err instanceof Error && !/fetch|network|json|doctype|unexpected/i.test(err.message)) {
      throw err;
    }
    return localFallback();
  }
}
