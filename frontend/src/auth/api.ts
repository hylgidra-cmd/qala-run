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

export async function registerUser(
  username: string,
  email: string,
  password: string,
  display_name?: string,
  city?: string,
  avatar_data?: string | null,
  color_hex?: string,
): Promise<AuthUser> {
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Xatolik' }));
    throw new Error(extractErrorMessage(err, "Ro'yxatdan o'tib bo'lmadi"));
  }

  return res.json() as Promise<AuthUser>;
}

export async function loginUser(usernameOrEmail: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameOrEmail, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Xatolik' }));
    throw new Error(extractErrorMessage(err, 'Kirish amalga oshmadi'));
  }

  return res.json() as Promise<AuthUser>;
}

export async function googleAuthUser(input: {
  id_token?: string;
  email?: string;
  display_name?: string;
  city?: string;
  color_hex?: string;
  avatar_data?: string | null;
}): Promise<AuthUser> {
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Xatolik' }));
    throw new Error(extractErrorMessage(err, 'Google orqali kirish amalga oshmadi'));
  }

  return res.json() as Promise<AuthUser>;
}


