import { API_BASE } from '../run/api';

export interface AuthUser {
  token: string;
  user_id: string;
  player_id: string;
  display_name: string;
  color_hex: string;
  city?: string;
  avatar_data?: string | null;
}

export async function registerUser(
  username: string,
  password: string,
  display_name?: string,
  city?: string,
  avatar_data?: string | null,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      display_name: display_name ?? username,
      city: city ?? 'nukus',
      avatar_data: avatar_data ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Xatolik' }));
    throw new Error(err.detail ?? 'Ro\'yxatdan o\'tib bo\'lmadi');
  }

  return res.json() as Promise<AuthUser>;
}

export async function loginUser(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Xatolik' }));
    throw new Error(err.detail ?? 'Kirish amalga oshmadi');
  }

  return res.json() as Promise<AuthUser>;
}

