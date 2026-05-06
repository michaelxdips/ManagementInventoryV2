import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAuditLog } from './auditLogger.js';
import notificationService from './notificationService.js';

// Mock notification service
vi.mock('./notificationService.js', () => ({
  default: {
    broadcastToAdmins: vi.fn(),
  },
}));

describe('Audit Logger', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      query: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('writeAuditLog', () => {
    it('should write audit log with all parameters', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 123,
        action: 'UPDATE',
        oldValues: { qty: 10, name: 'Pen' },
        newValues: { qty: 5, name: 'Pen' },
        userId: 1,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 456 }]);

      await writeAuditLog(auditData);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [
          'atk_items',
          123,
          'UPDATE',
          JSON.stringify({ qty: 10, name: 'Pen' }),
          JSON.stringify({ qty: 5, name: 'Pen' }),
          1,
        ]
      );

      expect(notificationService.broadcastToAdmins).toHaveBeenCalledWith('AUDIT_LOG', {
        id: 456,
        table_name: 'atk_items',
        record_id: 123,
        action: 'UPDATE',
        user_id: 1,
        created_at: expect.any(String),
      });
    });

    it('should handle null oldValues for CREATE action', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 123,
        action: 'CREATE',
        oldValues: null,
        newValues: { qty: 10, name: 'Pen' },
        userId: 1,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 456 }]);

      await writeAuditLog(auditData);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        ['atk_items', 123, 'CREATE', null, JSON.stringify({ qty: 10, name: 'Pen' }), 1]
      );
    });

    it('should handle null newValues for DELETE action', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 123,
        action: 'DELETE',
        oldValues: { qty: 10, name: 'Pen' },
        newValues: null,
        userId: 1,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 456 }]);

      await writeAuditLog(auditData);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        ['atk_items', 123, 'DELETE', JSON.stringify({ qty: 10, name: 'Pen' }), null, 1]
      );
    });

    it('should handle undefined values gracefully', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 123,
        action: 'UPDATE',
        oldValues: { qty: undefined, name: 'Pen' },
        newValues: { qty: 5, name: 'Pen' },
        userId: 1,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 456 }]);

      await writeAuditLog(auditData);

      // Should convert undefined to null in JSON
      expect(mockConnection.query).toHaveBeenCalled();
    });

    it('should skip logging if required fields are missing', async () => {
      await writeAuditLog({
        tableName: null,
        recordId: 123,
        action: 'UPDATE',
        connection: mockConnection,
      });

      expect(mockConnection.query).not.toHaveBeenCalled();
      expect(notificationService.broadcastToAdmins).not.toHaveBeenCalled();
    });

    it('should throw error if connection is invalid', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 123,
        action: 'UPDATE',
        oldValues: { qty: 10 },
        newValues: { qty: 5 },
        userId: 1,
        connection: null,
      };

      await expect(writeAuditLog(auditData)).rejects.toThrow(
        'writeAuditLog requires a pool or transaction connection'
      );
    });

    it('should handle circular references in values', async () => {
      const circular = { name: 'Test' };
      circular.self = circular;

      const auditData = {
        tableName: 'atk_items',
        recordId: 123,
        action: 'UPDATE',
        oldValues: circular,
        newValues: { qty: 5 },
        userId: 1,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 456 }]);

      await writeAuditLog(auditData);

      // Should handle circular reference gracefully
      expect(mockConnection.query).toHaveBeenCalled();
      const callArgs = mockConnection.query.mock.calls[0][1];
      expect(callArgs[3]).toContain('unserializable');
    });

    it('should broadcast to admins after successful insert', async () => {
      const auditData = {
        tableName: 'requests',
        recordId: 999,
        action: 'CREATE',
        oldValues: null,
        newValues: { item: 'Pen', qty: 10 },
        userId: 5,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 777 }]);

      await writeAuditLog(auditData);

      expect(notificationService.broadcastToAdmins).toHaveBeenCalledWith('AUDIT_LOG', {
        id: 777,
        table_name: 'requests',
        record_id: 999,
        action: 'CREATE',
        user_id: 5,
        created_at: expect.any(String),
      });
    });

    it('should handle userId as null for system actions', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 123,
        action: 'UPDATE',
        oldValues: { qty: 10 },
        newValues: { qty: 5 },
        userId: null,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 456 }]);

      await writeAuditLog(auditData);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        ['atk_items', 123, 'UPDATE', expect.any(String), expect.any(String), null]
      );
    });
  });

  describe('safeJson helper', () => {
    it('should handle normal objects', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 1,
        action: 'UPDATE',
        oldValues: { name: 'Test', qty: 10 },
        newValues: { name: 'Test', qty: 5 },
        userId: 1,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 1 }]);

      await writeAuditLog(auditData);

      const callArgs = mockConnection.query.mock.calls[0][1];
      expect(callArgs[3]).toBe(JSON.stringify({ name: 'Test', qty: 10 }));
      expect(callArgs[4]).toBe(JSON.stringify({ name: 'Test', qty: 5 }));
    });

    it('should handle null values', async () => {
      const auditData = {
        tableName: 'atk_items',
        recordId: 1,
        action: 'CREATE',
        oldValues: null,
        newValues: null,
        userId: 1,
        connection: mockConnection,
      };

      mockConnection.query.mockResolvedValueOnce([{ insertId: 1 }]);

      await writeAuditLog(auditData);

      const callArgs = mockConnection.query.mock.calls[0][1];
      expect(callArgs[3]).toBeNull();
      expect(callArgs[4]).toBeNull();
    });
  });
});
