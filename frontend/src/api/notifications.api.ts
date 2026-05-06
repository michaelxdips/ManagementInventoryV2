import { http } from './http';

export type InboxNotification = {
  id: number;
  type: 'NEW_REQUEST' | 'STATUS_UPDATE' | 'LOW_STOCK';
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export const fetchNotificationInbox = async (limit = 80): Promise<InboxNotification[]> => {
  const data = await http.get<{ notifications: InboxNotification[] }>(
    `/notifications/inbox?limit=${encodeURIComponent(String(limit))}`
  );
  return data.notifications ?? [];
};

export const markAllNotificationsReadApi = async (): Promise<void> => {
  await http.patch('/notifications/read-all');
};

export const markNotificationReadApi = async (notificationId: string | number): Promise<void> => {
  await http.patch(`/notifications/inbox/${encodeURIComponent(String(notificationId))}/read`);
};

export const clearNotificationInboxApi = async (): Promise<void> => {
  await http.delete('/notifications/inbox');
};
