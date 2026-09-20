import { API_BASE, deviceKey } from '../run/api';

export interface Notification {
  id: number;
  type: string;
  payload: {
    invader?: string;
    area_m2?: number;
    [key: string]: unknown;
  };
  created_at: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API_BASE}/me/notifications`, {
    headers: { 'X-Demo-User': deviceKey() },
  });
  if (!res.ok) return [];
  return res.json() as Promise<Notification[]>;
}

export async function markNotificationsRead(): Promise<void> {
  await fetch(`${API_BASE}/me/notifications/read`, {
    method: 'POST',
    headers: { 'X-Demo-User': deviceKey() },
  });
}

