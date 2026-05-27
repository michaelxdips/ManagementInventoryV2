import { useEffect, useState, useCallback } from 'react';
import { getApiBaseUrl } from '../api/http';
import {
  fetchNotificationInbox,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  clearNotificationInboxApi,
  InboxNotification,
} from '../api/notifications.api';

export interface AppNotification {
  id: string;
  type: 'NEW_REQUEST' | 'STATUS_UPDATE' | 'LOW_STOCK';
  data: Record<string, unknown>;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

function inboxToApp(n: InboxNotification): AppNotification {
  return {
    id: String(n.id),
    type: n.type,
    data: (n.payload && typeof n.payload === 'object' ? n.payload : {}) as Record<string, unknown>,
    title: n.title,
    message: n.message,
    read: n.is_read,
    timestamp: new Date(n.created_at),
  };
}

function mergeById(prev: AppNotification[], incoming: AppNotification): AppNotification[] {
  if (prev.some((x) => x.id === incoming.id)) return prev;
  return [incoming, ...prev];
}

function normalizeValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function buildSseFallbackId(type: AppNotification['type'], data: Record<string, unknown>): string {
  const nowBucket = Math.floor(Date.now() / 10000);
  const idCandidate =
    normalizeValue(data.notificationId) ||
    normalizeValue(data.id) ||
    normalizeValue(data.requestId) ||
    normalizeValue(data.item) ||
    normalizeValue(data.message);
  const status = normalizeValue(data.status).toUpperCase();
  return `sse_${type}_${idCandidate || 'unknown'}_${status || 'na'}_${nowBucket}`;
}

export const useNotifications = (token: string | null) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const refreshInbox = useCallback(async () => {
    if (!token) return;
    try {
      const rows = await fetchNotificationInbox(100);
      setNotifications(rows.map(inboxToApp));
    } catch (err) {
      console.error('Gagal memuat inbox notifikasi:', err);
    }
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read API error:', err);
    }
  }, [token]);

  const markOneAsRead = useCallback(async (notificationId: string) => {
    if (!token || !notificationId) return;
    try {
      await markNotificationReadApi(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Mark one read API error:', err);
    }
  }, [token]);

  const clearAll = useCallback(async () => {
    if (!token) return;
    try {
      await clearNotificationInboxApi();
      setNotifications([]);
    } catch (err) {
      console.error('Clear inbox API error:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      setNotifications([]);
      return;
    }

    void refreshInbox();

    const API_URL = getApiBaseUrl();
    const eventSource = new EventSource(`${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      setTimeout(() => {
        setReconnectTrigger((prev) => prev + 1);
      }, 10000);
    };

    eventSource.addEventListener('NEW_REQUEST', (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown> & { notificationId?: number };
        const id =
          data.notificationId != null
            ? String(data.notificationId)
            : buildSseFallbackId('NEW_REQUEST', data);
        const newNotif: AppNotification = {
          id,
          type: 'NEW_REQUEST',
          data,
          title: 'Request baru masuk',
          message: `${data.dept ?? ''} meminta ${data.qty ?? ''} ${data.unit ?? ''} ${data.item ?? ''}`,
          read: false,
          timestamp: new Date(),
        };

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.title, { body: newNotif.message });
        }

        setNotifications((prev) => mergeById(prev, newNotif));
      } catch (err) {
        console.error('Error parsing NEW_REQUEST', err);
      }
    });

    eventSource.addEventListener('LOW_STOCK', (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown> & {
          notificationId?: number;
          remaining?: number;
          message?: string;
        };
        const id =
          data.notificationId != null
            ? String(data.notificationId)
            : buildSseFallbackId('LOW_STOCK', data);
        const rem = typeof data.remaining === 'number' ? data.remaining : 0;
        const newNotif: AppNotification = {
          id,
          type: 'LOW_STOCK',
          data,
          title: rem === 0 ? 'Stok habis' : 'Peringatan stok minimum',
          message: typeof data.message === 'string' ? data.message : '',
          read: false,
          timestamp: new Date(),
        };

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.title, { body: newNotif.message });
        }

        setNotifications((prev) => mergeById(prev, newNotif));
      } catch (err) {
        console.error('Error parsing LOW_STOCK', err);
      }
    });

    eventSource.addEventListener('STATUS_UPDATE', (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown> & { notificationId?: number };
        const id =
          data.notificationId != null
            ? String(data.notificationId)
            : buildSseFallbackId('STATUS_UPDATE', data);
        const st = String(data.status || '').toUpperCase();
        let title = 'Update status permintaan';
        if (st === 'APPROVED') title = 'Barang disetujui';
        else if (st === 'FINISHED') title = 'Permintaan selesai';
        else if (st === 'REJECTED') title = 'Permintaan ditolak';
        const newNotif: AppNotification = {
          id,
          type: 'STATUS_UPDATE',
          data,
          title,
          message: typeof data.message === 'string' ? data.message : '',
          read: false,
          timestamp: new Date(),
        };

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotif.title, { body: newNotif.message });
        }

        setNotifications((prev) => mergeById(prev, newNotif));
      } catch (err) {
        console.error('Error parsing STATUS_UPDATE', err);
      }
    });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [token, refreshInbox, reconnectTrigger]);

  useEffect(() => {
    if (!token || isConnected) return;
    const intervalId = window.setInterval(() => {
      void refreshInbox();
    }, 45000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token, isConnected, refreshInbox]);

  return { notifications, isConnected, markAllAsRead, markOneAsRead, clearAll, refreshInbox };
};
