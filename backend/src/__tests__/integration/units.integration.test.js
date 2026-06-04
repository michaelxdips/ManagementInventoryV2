import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../index.js';
import pool from '../../config/db.js';

describe('Units Integration Tests', () => {
  let superadminToken;
  let adminToken;
  let userToken;
  let testUnitId;
  let otherUnitId;
  let testAdminId;
  let testSuperadminId;

  beforeAll(async () => {
    // Cleanup any leftover test data
    await pool.execute('DELETE FROM audit_logs WHERE record_id IN (SELECT id FROM users WHERE username LIKE ?)', ['%_units_test']);
    await pool.execute('DELETE FROM users WHERE username LIKE ?', ['%_units_test']);

    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    // Create test superadmin
    const [saResult] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
      ['SA Unit Test', 'sa_units_test', hashedPassword, 'superadmin']
    );
    testSuperadminId = saResult.insertId;

    // Create test admin
    const [adResult] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin Unit Test', 'admin_units_test', hashedPassword, 'admin']
    );
    testAdminId = adResult.insertId;

    // Create test unit 1
    const [u1Result] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Test Unit 1', 'u1_units_test', hashedPassword, 'user']
    );
    testUnitId = u1Result.insertId;

    // Create test unit 2
    const [u2Result] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Test Unit 2', 'u2_units_test', hashedPassword, 'user']
    );
    otherUnitId = u2Result.insertId;

    // Get tokens
    const saLogin = await request(app).post('/api/auth/login').send({ username: 'sa_units_test', password: 'password123' });
    superadminToken = saLogin.body.token;

    const adLogin = await request(app).post('/api/auth/login').send({ username: 'admin_units_test', password: 'password123' });
    adminToken = adLogin.body.token;

    const uLogin = await request(app).post('/api/auth/login').send({ username: 'u1_units_test', password: 'password123' });
    userToken = uLogin.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await pool.execute("DELETE FROM audit_logs WHERE record_id IN (?, ?) AND table_name = 'users'", [testUnitId, otherUnitId]);
    await pool.execute('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [testSuperadminId, testAdminId, testUnitId, otherUnitId]);
  });

  describe('PUT /api/units/:id', () => {
    it('should edit unit with valid data as superadmin', async () => {
      const res = await request(app)
        .put(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Updated Unit 1',
          username: 'updated_u1_test'
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Unit 1');
      expect(res.body.username).toBe('updated_u1_test');
    });

    it('should return 400 for invalid username format', async () => {
      const res = await request(app)
        .put(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Updated Unit 1',
          username: 'Invalid User!'
        });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate username', async () => {
      const res = await request(app)
        .put(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Updated Unit 1',
          username: 'u2_units_test'
        });

      expect(res.status).toBe(409);
    });

    it('should return 403 if trying to edit admin', async () => {
      const res = await request(app)
        .put(`/api/units/${testAdminId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          name: 'Hacked Admin',
          username: 'hacked_admin_test'
        });

      expect(res.status).toBe(403);
    });

    it('should return 403 for non-superadmin users', async () => {
      const res = await request(app)
        .put(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Hacked by Admin',
          username: 'hacked_u1_test'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/units/:id/password', () => {
    it('should reset password for unit as superadmin', async () => {
      const res = await request(app)
        .patch(`/api/units/${testUnitId}/password`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password unit berhasil direset.');

      // Try logging in with the new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'updated_u1_test', // it was changed in the first PUT test
          password: 'newpassword123'
        });
      
      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      
      // Try logging in with the old password
      const oldLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'updated_u1_test',
          password: 'password123'
        });
      
      expect(oldLoginRes.status).toBe(401);
    });

    it('should return 400 for password less than 8 characters', async () => {
      const res = await request(app)
        .patch(`/api/units/${testUnitId}/password`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          newPassword: 'short'
        });

      expect(res.status).toBe(400);
    });

    it('should return 403 if trying to reset password of admin', async () => {
      const res = await request(app)
        .patch(`/api/units/${testAdminId}/password`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(403);
    });

    it('should return 403 for non-superadmin users', async () => {
      const res = await request(app)
        .patch(`/api/units/${testUnitId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(403);
    });
  });
});
