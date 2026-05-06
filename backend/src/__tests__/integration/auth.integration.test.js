import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../index.js';
import pool from '../../config/db.js';

/**
 * Integration tests for authentication endpoints
 * Tests actual HTTP requests against running Express app
 */

describe('Auth Integration Tests', () => {
  let testUserId;
  let validToken;

  beforeAll(async () => {
    // Create a test user for authentication tests
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role, email) VALUES (?, ?, ?, ?, ?)',
      ['Test User', 'testuser_integration', hashedPassword, 'user', 'test@integration.com']
    );
    testUserId = result.insertId;
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUserId) {
      await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    }
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser_integration',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser_integration');
      expect(response.body.user.role).toBe('user');
      expect(response.body.user).not.toHaveProperty('password_hash');

      validToken = response.body.token;
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser_integration',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('salah');
    });

    it('should reject login with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent_user',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.message).toContain('salah');
    });

    it('should reject login without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('wajib');
    });

    it('should filter by role if provided', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser_integration',
          password: 'password123',
          role: 'admin', // User has 'user' role, not 'admin'
        })
        .expect(401);

      expect(response.body.message).toContain('salah');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.username).toBe('testuser_integration');
      expect(response.body.role).toBe('user');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject request with malformed authorization header', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(204);
    });

    it('should reject logout without token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login endpoint', async () => {
      // Make 11 rapid login attempts (limit is 10)
      const attempts = [];
      for (let i = 0; i < 11; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({ username: 'test', password: 'test' })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.some((res) => res.status === 429);

      expect(rateLimited).toBe(true);
    }, 15000); // Longer timeout for rate limit test
  });
});
