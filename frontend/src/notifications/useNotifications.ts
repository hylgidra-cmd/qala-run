import { useCallback, useEffect, useRef, useState } from 'react';
import { type Notification, fetchNotifications, markNotificationsRead } from './api';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timer = useRef<number | null>(null);

  const poll = useCallback(async () => {
    try {
      const items = await fetchNotifications();
      if (items.length > 0) {
        setNotifications(items);
      }
    } catch {
      // API unreachable — silently skip
    }
  }, []);

  useEffect(() => {
    void poll();
    timer.current = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, [poll]);

  const dismiss = useCallback(async () => {
    setNotifications([]);
    try {
      await markNotificationsRead();
    } catch {
      // best-effort
    }
  }, []);

  return { notifications, dismiss };
}
