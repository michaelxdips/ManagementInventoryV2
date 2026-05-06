import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticate, authorize, optionalAuth } from './auth.js';
import pool from '../config/db.js';
import { config } from '../config/env.js';

// Mock dependencies
vi.mock('../config/db.js', () => ({
  default: {
    execute: vi.fn(),
  },
}));

vi.mock('../config/env.js', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key-for-unit-testing-only',
      expiresIn: '7d',
    },
  },
}));

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should reject request without authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token tidak ditemukan' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token tidak ditemukan' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token tidak valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user not found in database', async () => {
      const token = jwt.sign({ userId: 999 }, config.jwt.secret);
      req.headers.authorization = `Bearer ${token}`;

      pool.execute.mockResolvedValueOnce([[]]);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User tidak ditemukan' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate valid token and set req.user', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        role: 'user',
        email: 'test@example.com',
      };

      const token = jwt.sign({ userId: mockUser.id }, config.jwt.secret);
      req.headers.authorization = `Bearer ${token}`;

      pool.execute.mockResolvedValueOnce([[mockUser]]);

      await authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle user with null email', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        role: 'user',
        email: null,
      };

      const token = jwt.sign({ userId: mockUser.id }, config.jwt.secret);
      req.headers.authorization = `Bearer ${token}`;

      pool.execute.mockResolvedValueOnce([[mockUser]]);

      await authenticate(req, res, next);

      expect(req.user.email).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should reject request without user', () => {
      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject user with insufficient role', () => {
      req.user = { id: 1, role: 'user' };
      const middleware = authorize('admin', 'superadmin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Akses ditolak. Role tidak diizinkan.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow user with correct role', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = authorize('admin', 'superadmin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow superadmin for admin-only routes', () => {
      req.user = { id: 1, role: 'superadmin' };
      const middleware = authorize('admin', 'superadmin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set req.user to null when no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should set req.user to null for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid.token';

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should set req.user for valid token', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        role: 'user',
        email: 'test@example.com',
      };

      const token = jwt.sign({ userId: mockUser.id }, config.jwt.secret);
      req.headers.authorization = `Bearer ${token}`;

      pool.execute.mockResolvedValueOnce([[mockUser]]);

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });
});

describe('JWT Token Generation', () => {
  it('should generate valid JWT token', () => {
    const payload = { userId: 1, role: 'admin' };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, config.jwt.secret);
    expect(decoded.userId).toBe(1);
    expect(decoded.role).toBe('admin');
  });

  it('should reject expired token', () => {
    const payload = { userId: 1, role: 'admin' };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '0s' });

    expect(() => {
      jwt.verify(token, config.jwt.secret);
    }).toThrow();
  });

  it('should reject token with wrong secret', () => {
    const payload = { userId: 1, role: 'admin' };
    const token = jwt.sign(payload, 'wrong-secret');

    expect(() => {
      jwt.verify(token, config.jwt.secret);
    }).toThrow();
  });
});

describe('Password Hashing', () => {
  it('should hash password correctly', () => {
    const password = 'testPassword123';
    const hash = bcrypt.hashSync(password, 10);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('should verify correct password', () => {
    const password = 'testPassword123';
    const hash = bcrypt.hashSync(password, 10);

    const isValid = bcrypt.compareSync(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', () => {
    const password = 'testPassword123';
    const hash = bcrypt.hashSync(password, 10);

    const isValid = bcrypt.compareSync('wrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for same password', () => {
    const password = 'testPassword123';
    const hash1 = bcrypt.hashSync(password, 10);
    const hash2 = bcrypt.hashSync(password, 10);

    expect(hash1).not.toBe(hash2);
    expect(bcrypt.compareSync(password, hash1)).toBe(true);
    expect(bcrypt.compareSync(password, hash2)).toBe(true);
  });
});
