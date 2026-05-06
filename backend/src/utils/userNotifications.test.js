import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUserNotification,
  mapNotificationRow,
  listNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteAllNotificationsForUser,
} from './userNotifications.js';
import pool from '../config/db.js';

vi.mock('../config/db.js', () => ({
  default: {
    execute: vi.fn(),
    query: vi.fn(),
  },
}));

describe('user notification utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserNotification', () => {
    it('inserts a notification row and returns insert id', async () => {
      pool.execute.mockResolvedValueOnce([{ insertId: 123 }]);

      const id = await createUserNotification('5', {
        type: 'LOW_STOCK',
        title: 'Low',
        message: 'Stock low',
        payload: { item: 'Pulpen' },
      });

      expect(id).toBe(123);
      expect(pool.execute).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user_notifications'), [
        5,
        'LOW_STOCK',
        'Low',
        'Stock low',
        JSON.stringify({ item: 'Pulpen' }),
      ]);
    });

    it('stores null payload as null', async () => {
      pool.execute.mockResolvedValueOnce([{ insertId: 124 }]);

      await createUserNotification(5, {
        type: 'STATUS_UPDATE',
        title: 'Status',
        message: 'Updated',
        payload: null,
      });

      expect(pool.execute.mock.calls[0][1][4]).toBeNull();
    });

    it('throws for invalid user ids', async () => {
      await expect(
        createUserNotification('invalid', { type: 'X', title: 'T', message: 'M', payload: {} })
      ).rejects.toThrow('Invalid user id for notification');
      expect(pool.execute).not.toHaveBeenCalled();
    });
  });

  describe('mapNotificationRow', () => {
    it('maps database row and parses JSON payload', () => {
      const created = new Date('2026-05-05T10:00:00.000Z');

      expect(
        mapNotificationRow({
          id: '10',
          type: 'LOW_STOCK',
          title: 'Title',
          message: 'Message',
          payload: '{"item":"Pulpen"}',
          is_read: 1,
          created_at: created,
        })
      ).toEqual({
        id: 10,
        type: 'LOW_STOCK',
        title: 'Title',
        message: 'Message',
        payload: { item: 'Pulpen' },
        is_read: true,
        created_at: '2026-05-05 17:00:00',
      });
    });

    it('sets invalid JSON payload to null', () => {
      expect(mapNotificationRow({ id: 1, payload: '{bad', is_read: 0, created_at: 'today' }).payload).toBeNull();
    });

    it('preserves object payloads and stringifies non-Date created_at', () => {
      const row = {
        id: 1,
        type: 'X',
        title: 'T',
        message: 'M',
        payload: { ok: true },
        is_read: false,
        created_at: '2026-05-05',
      };

      expect(mapNotificationRow(row)).toMatchObject({ payload: { ok: true }, created_at: '2026-05-05' });
    });
  });

  describe('list and mark helpers', () => {
    it('lists notifications with bounded limit', async () => {
      pool.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            type: 'X',
            title: 'T',
            message: 'M',
            payload: null,
            is_read: 0,
            created_at: '2026-05-05',
          },
        ],
      ]);

      const rows = await listNotificationsForUser('7', 999);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('FROM user_notifications'), [7, 200]);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(1);
    });

    it('uses default limit for invalid limit values', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      await listNotificationsForUser(7, 'bad');

      expect(pool.query.mock.calls[0][1]).toEqual([7, 100]);
    });

    it('marks a single notification as read', async () => {
      pool.execute.mockResolvedValueOnce([{}]);

      await markNotificationRead('7', '9');

      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?'),
        [9, 7]
      );
    });

    it('marks all notifications as read for a user', async () => {
      pool.execute.mockResolvedValueOnce([{}]);

      await markAllNotificationsRead('7');

      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_notifications SET is_read = 1 WHERE user_id = ?'),
        [7]
      );
    });

    it('deletes all notifications for a user', async () => {
      pool.execute.mockResolvedValueOnce([{}]);

      await deleteAllNotificationsForUser('7');

      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_notifications WHERE user_id = ?'),
        [7]
      );
    });
  });
});
