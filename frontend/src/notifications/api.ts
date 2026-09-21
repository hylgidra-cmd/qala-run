import { request } from '../run/api';

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
  try {
    return await request<Notification[]>('/me/notifications');
  } catch {
    return [];
  }
}

export async function markNotificationsRead(): Promise<void> {
  await request<void>('/me/notifications/read', { method: 'POST' });
}
