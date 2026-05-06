import { describe, it, expect, vi, beforeEach } from 'vitest';
import notificationService from './notificationService.js';

describe('Notification Service (SSE)', () => {
  let mockRes1, mockRes2, mockRes3;

  beforeEach(() => {
    // Clear all clients before each test
    notificationService.clients.clear();

    // Mock response objects
    mockRes1 = {
      write: vi.fn(),
      on: vi.fn(),
      destroyed: false,
      writableEnded: false,
    };

    mockRes2 = {
      write: vi.fn(),
      on: vi.fn(),
      destroyed: false,
      writableEnded: false,
    };

    mockRes3 = {
      write: vi.fn(),
      on: vi.fn(),
      destroyed: false,
      writableEnded: false,
    };

    vi.clearAllMocks();
  });

  describe('addClient', () => {
    it('should add new client connection', () => {
      notificationService.addClient(1, mockRes1, 'user');

      expect(notificationService.clients.has(1)).toBe(true);
      expect(notificationService.clients.get(1).role).toBe('user');
      expect(notificationService.clients.get(1).connections.size).toBe(1);
    });

    it('should add multiple connections for same user', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(1, mockRes2, 'user');

      expect(notificationService.clients.get(1).connections.size).toBe(2);
    });

    it('should update role when adding existing user', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(1, mockRes2, 'admin');

      expect(notificationService.clients.get(1).role).toBe('admin');
    });

    it('should setup close event listener', () => {
      notificationService.addClient(1, mockRes1, 'user');

      expect(mockRes1.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle multiple users', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(2, mockRes2, 'admin');
      notificationService.addClient(3, mockRes3, 'superadmin');

      expect(notificationService.clients.size).toBe(3);
    });
  });

  describe('removeClient', () => {
    it('should remove client connection', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.removeClient(1, mockRes1);

      expect(notificationService.clients.has(1)).toBe(false);
    });

    it('should keep user if other connections exist', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(1, mockRes2, 'user');
      notificationService.removeClient(1, mockRes1);

      expect(notificationService.clients.has(1)).toBe(true);
      expect(notificationService.clients.get(1).connections.size).toBe(1);
    });

    it('should handle removing non-existent client', () => {
      expect(() => {
        notificationService.removeClient(999, mockRes1);
      }).not.toThrow();
    });
  });

  describe('sendToUser', () => {
    it('should send event to specific user', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(2, mockRes2, 'admin');

      notificationService.sendToUser(1, 'TEST_EVENT', { message: 'Hello User 1' });

      expect(mockRes1.write).toHaveBeenCalledWith(
        'event: TEST_EVENT\ndata: {"message":"Hello User 1"}\n\n'
      );
      expect(mockRes2.write).not.toHaveBeenCalled();
    });

    it('should send to all connections of same user', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(1, mockRes2, 'user');

      notificationService.sendToUser(1, 'TEST_EVENT', { message: 'Hello' });

      expect(mockRes1.write).toHaveBeenCalled();
      expect(mockRes2.write).toHaveBeenCalled();
    });

    it('should not throw if user not connected', () => {
      expect(() => {
        notificationService.sendToUser(999, 'TEST_EVENT', { message: 'Hello' });
      }).not.toThrow();
    });

    it('should handle complex payload', () => {
      notificationService.addClient(1, mockRes1, 'user');

      const payload = {
        id: 123,
        item: 'Pen',
        qty: 10,
        nested: { data: 'value' },
      };

      notificationService.sendToUser(1, 'REQUEST_APPROVED', payload);

      expect(mockRes1.write).toHaveBeenCalledWith(
        `event: REQUEST_APPROVED\ndata: ${JSON.stringify(payload)}\n\n`
      );
    });
  });

  describe('broadcastToAdmins', () => {
    it('should send to admin users only', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(2, mockRes2, 'admin');
      notificationService.addClient(3, mockRes3, 'superadmin');

      notificationService.broadcastToAdmins('NEW_REQUEST', { id: 123 });

      expect(mockRes1.write).not.toHaveBeenCalled();
      expect(mockRes2.write).toHaveBeenCalled();
      expect(mockRes3.write).toHaveBeenCalled();
    });

    it('should not send to regular users', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(2, mockRes2, 'user');

      notificationService.broadcastToAdmins('ADMIN_EVENT', { data: 'test' });

      expect(mockRes1.write).not.toHaveBeenCalled();
      expect(mockRes2.write).not.toHaveBeenCalled();
    });

    it('should handle no admin users connected', () => {
      notificationService.addClient(1, mockRes1, 'user');

      expect(() => {
        notificationService.broadcastToAdmins('ADMIN_EVENT', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('broadcast', () => {
    it('should send to all connected users', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(2, mockRes2, 'admin');
      notificationService.addClient(3, mockRes3, 'superadmin');

      notificationService.broadcast('ANNOUNCEMENT', { message: 'System maintenance' });

      expect(mockRes1.write).toHaveBeenCalled();
      expect(mockRes2.write).toHaveBeenCalled();
      expect(mockRes3.write).toHaveBeenCalled();
    });

    it('should handle no users connected', () => {
      expect(() => {
        notificationService.broadcast('TEST', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('writeEvent', () => {
    it('should write event to response', () => {
      notificationService.addClient(1, mockRes1, 'user');
      const dataString = 'event: TEST\ndata: {"test":true}\n\n';

      notificationService.writeEvent(1, mockRes1, dataString);

      expect(mockRes1.write).toHaveBeenCalledWith(dataString);
    });

    it('should remove client if response is destroyed', () => {
      notificationService.addClient(1, mockRes1, 'user');
      mockRes1.destroyed = true;

      notificationService.writeEvent(1, mockRes1, 'test');

      expect(notificationService.clients.has(1)).toBe(false);
    });

    it('should remove client if response is ended', () => {
      notificationService.addClient(1, mockRes1, 'user');
      mockRes1.writableEnded = true;

      notificationService.writeEvent(1, mockRes1, 'test');

      expect(notificationService.clients.has(1)).toBe(false);
    });

    it('should handle write errors gracefully', () => {
      notificationService.addClient(1, mockRes1, 'user');
      mockRes1.write.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => {
        notificationService.writeEvent(1, mockRes1, 'test');
      }).not.toThrow();

      expect(notificationService.clients.has(1)).toBe(false);
    });
  });

  describe('Connection lifecycle', () => {
    it('should cleanup on close event', () => {
      notificationService.addClient(1, mockRes1, 'user');

      // Simulate close event
      const closeHandler = mockRes1.on.mock.calls.find((call) => call[0] === 'close')[1];
      closeHandler();

      expect(notificationService.clients.has(1)).toBe(false);
    });

    it('should handle multiple connections closing', () => {
      notificationService.addClient(1, mockRes1, 'user');
      notificationService.addClient(1, mockRes2, 'user');

      const closeHandler1 = mockRes1.on.mock.calls.find((call) => call[0] === 'close')[1];
      closeHandler1();

      expect(notificationService.clients.has(1)).toBe(true);
      expect(notificationService.clients.get(1).connections.size).toBe(1);

      const closeHandler2 = mockRes2.on.mock.calls.find((call) => call[0] === 'close')[1];
      closeHandler2();

      expect(notificationService.clients.has(1)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty payload', () => {
      notificationService.addClient(1, mockRes1, 'user');

      notificationService.sendToUser(1, 'EMPTY', {});

      expect(mockRes1.write).toHaveBeenCalledWith('event: EMPTY\ndata: {}\n\n');
    });

    it('should handle null payload', () => {
      notificationService.addClient(1, mockRes1, 'user');

      notificationService.sendToUser(1, 'NULL', null);

      expect(mockRes1.write).toHaveBeenCalledWith('event: NULL\ndata: null\n\n');
    });

    it('should handle special characters in event name', () => {
      notificationService.addClient(1, mockRes1, 'user');

      notificationService.sendToUser(1, 'TEST:EVENT-123', { data: 'test' });

      expect(mockRes1.write).toHaveBeenCalledWith(
        'event: TEST:EVENT-123\ndata: {"data":"test"}\n\n'
      );
    });

    it('should handle large payload', () => {
      notificationService.addClient(1, mockRes1, 'user');

      const largePayload = {
        items: Array(100)
          .fill(null)
          .map((_, i) => ({ id: i, name: `Item ${i}` })),
      };

      notificationService.sendToUser(1, 'LARGE', largePayload);

      expect(mockRes1.write).toHaveBeenCalled();
    });
  });
});
