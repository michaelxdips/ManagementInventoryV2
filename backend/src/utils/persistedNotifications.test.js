import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  notifyAdminsWithPersistence,
  notifyUserRequestStatus,
  notifyLowStockToAdmins,
} from './persistedNotifications.js';
import pool from '../config/db.js';
import notificationService from './notificationService.js';
import emailService from './emailService.js';
import { createUserNotification } from './userNotifications.js';

vi.mock('../config/db.js', () => ({
  default: {
    query: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock('./notificationService.js', () => ({
  default: {
    sendToUser: vi.fn(),
  },
}));

vi.mock('./emailService.js', () => ({
  default: {
    notifyUserRequestStatus: vi.fn(),
  },
}));

vi.mock('./userNotifications.js', () => ({
  createUserNotification: vi.fn(),
}));

describe('persisted notification utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifyAdminsWithPersistence', () => {
    it('creates one notification per admin and sends SSE with object payload', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }, { id: '2' }]]);
      createUserNotification.mockResolvedValueOnce(101).mockResolvedValueOnce(102);

      await notifyAdminsWithPersistence(
        'LOW_STOCK',
        { item: 'Pulpen', remaining: 1 },
        { title: 'Low stock', message: 'Restock' }
      );

      expect(createUserNotification).toHaveBeenCalledTimes(2);
      expect(createUserNotification).toHaveBeenNthCalledWith(1, 1, {
        type: 'LOW_STOCK',
        title: 'Low stock',
        message: 'Restock',
        payload: { item: 'Pulpen', remaining: 1 },
      });
      expect(notificationService.sendToUser).toHaveBeenNthCalledWith(1, 1, 'LOW_STOCK', {
        item: 'Pulpen',
        remaining: 1,
        notificationId: 101,
      });
      expect(notificationService.sendToUser).toHaveBeenNthCalledWith(2, 2, 'LOW_STOCK', {
        item: 'Pulpen',
        remaining: 1,
        notificationId: 102,
      });
    });

    it('wraps primitive SSE payloads in data field', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      createUserNotification.mockResolvedValueOnce(201);

      await notifyAdminsWithPersistence('ANNOUNCE', 'hello', { title: 'T', message: 'M' });

      expect(notificationService.sendToUser).toHaveBeenCalledWith(1, 'ANNOUNCE', {
        data: 'hello',
        notificationId: 201,
      });
    });
  });

  describe('notifyUserRequestStatus', () => {
    it('returns null for invalid user ids', async () => {
      await expect(
        notifyUserRequestStatus('bad', { requestId: 1, itemName: 'Pulpen', status: 'APPROVED', message: 'OK' })
      ).resolves.toBeNull();
      expect(createUserNotification).not.toHaveBeenCalled();
    });

    it('creates status notification, sends SSE, and emails user when email exists', async () => {
      createUserNotification.mockResolvedValueOnce(301);
      pool.execute.mockResolvedValueOnce([[{ email: ' user@example.com ' }]]);
      emailService.notifyUserRequestStatus.mockResolvedValueOnce({ ok: true });

      const id = await notifyUserRequestStatus('5', {
        requestId: '9',
        itemName: 'Pulpen',
        status: 'approved',
        message: 'Disetujui',
      });

      expect(id).toBe(301);
      expect(createUserNotification).toHaveBeenCalledWith(5, {
        type: 'STATUS_UPDATE',
        title: 'Barang disetujui',
        message: 'Disetujui',
        payload: { id: 9, status: 'APPROVED', item: 'Pulpen', message: 'Disetujui' },
      });
      expect(notificationService.sendToUser).toHaveBeenCalledWith(5, 'STATUS_UPDATE', {
        id: 9,
        status: 'APPROVED',
        item: 'Pulpen',
        message: 'Disetujui',
        notificationId: 301,
      });
      expect(emailService.notifyUserRequestStatus).toHaveBeenCalledWith({
        to: 'user@example.com',
        itemName: 'Pulpen',
        status: 'APPROVED',
        message: 'Disetujui',
      });
    });

    it('uses finished and rejected titles and skips email without address', async () => {
      createUserNotification.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
      pool.execute.mockResolvedValue([[{}]]);

      await notifyUserRequestStatus(5, { requestId: 1, itemName: 'A', status: 'FINISHED', message: 'Done' });
      await notifyUserRequestStatus(5, { requestId: 2, itemName: 'B', status: 'REJECTED', message: 'No' });

      expect(createUserNotification.mock.calls[0][1].title).toBe('Permintaan selesai');
      expect(createUserNotification.mock.calls[1][1].title).toBe('Permintaan ditolak');
      expect(emailService.notifyUserRequestStatus).not.toHaveBeenCalled();
    });

    it('swallows email delivery errors after persisting notification', async () => {
      createUserNotification.mockResolvedValueOnce(401);
      pool.execute.mockResolvedValueOnce([[{ email: 'user@example.com' }]]);
      emailService.notifyUserRequestStatus.mockRejectedValueOnce(new Error('SMTP down'));

      await expect(
        notifyUserRequestStatus(5, { requestId: 1, itemName: 'Pulpen', status: 'PENDING', message: 'Update' })
      ).resolves.toBe(401);
    });
  });

  describe('notifyLowStockToAdmins', () => {
    it('uses stock empty title when remaining is zero', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      createUserNotification.mockResolvedValueOnce(501);

      await notifyLowStockToAdmins({ item: 'Pulpen', remaining: 0, message: 'Habis' });

      expect(createUserNotification).toHaveBeenCalledWith(1, expect.objectContaining({
        type: 'LOW_STOCK',
        title: 'Stok habis',
        message: 'Habis',
      }));
    });

    it('uses low stock title and empty default message otherwise', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      createUserNotification.mockResolvedValueOnce(502);

      await notifyLowStockToAdmins({ item: 'Pulpen', remaining: 2 });

      expect(createUserNotification).toHaveBeenCalledWith(1, expect.objectContaining({
        title: 'Peringatan stok minimum',
        message: '',
      }));
    });
  });
});
