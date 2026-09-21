import { request } from '../run/api';

export interface ChatSender {
  user_id: string;
  player_id: string;
  display_name: string;
  color_hex: string;
  avatar_data?: string | null;
}

export interface ChatMessage {
  id: number;
  channel_type: 'global' | 'clan' | 'direct';
  channel_id: string;
  sender: ChatSender;
  recipient_id?: string | null;
  content: string;
  msg_type: 'text' | 'location';
  payload: {
    lat?: number;
    lon?: number;
    [key: string]: unknown;
  };
  created_at: string;
  read_at?: string | null;
}

export interface SendMessagePayload {
  channel_type: 'global' | 'clan' | 'direct';
  channel_id: string;
  recipient_id?: string | null;
  content: string;
  msg_type?: 'text' | 'location';
  payload?: Record<string, unknown>;
}

export function fetchChatMessages(channelType: string, channelId: string, limit = 50) {
  const query = new URLSearchParams({
    channel_type: channelType,
    channel_id: channelId,
    limit: limit.toString(),
  });
  return request<ChatMessage[]>(`/chat/messages?${query.toString()}`);
}

export function sendChatMessage(body: SendMessagePayload) {
  return request<ChatMessage>('/chat/messages', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function markChatRead(channelId: string) {
  return request<void>(`/chat/mark-read?channel_id=${encodeURIComponent(channelId)}`, {
    method: 'POST',
  });
}

export function fetchUnreadChatCount() {
  return request<{ unread: number }>('/chat/unread-count');
}

