import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../index.js';
import pool from '../../config/db.js';
import { getWIBDate } from '../../utils/date.js';

/**
 * Integration tests for items CRUD endpoints
 * Tests inventory management with stock validation
 */

describe('Items Integration Tests', () => {
  let superadminToken;
  let adminToken;
  let userToken;
  let testItemId;
  let testUserId;

  beforeAll(async () => {
    // Cleanup any leftover test data from previous runs
    await pool.execute('DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE username LIKE ?)', ['%_items_test']);
    await pool.execute("DELETE FROM requests WHERE item LIKE '%Test%' OR receiver LIKE 'Test %'");
    await pool.execute("DELETE FROM atk_items WHERE nama_barang LIKE '%Test%' OR nama_barang = 'Should Fail' OR nama_barang = 'Not Found'");
    await pool.execute('DELETE FROM users WHERE username LIKE ?', ['%_items_test']);

    // Create test users
    const hashedPassword = bcrypt.hashSync('password123', 10);

    const [superadminResult] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role, email) VALUES (?, ?, ?, ?, ?)',
      ['Superadmin Test', 'superadmin_items_test', hashedPassword, 'superadmin', 'superadmin@test.com']
    );

    const [adminResult] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role, email) VALUES (?, ?, ?, ?, ?)',
      ['Admin Test', 'admin_items_test', hashedPassword, 'admin', 'admin@test.com']
    );

    const [userResult] = await pool.execute(
      'INSERT INTO users (name, username, password_hash, role, email) VALUES (?, ?, ?, ?, ?)',
      ['User Test', 'user_items_test', hashedPassword, 'user', 'user@test.com']
    );

    testUserId = userResult.insertId;

    // Get tokens
    const superadminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'superadmin_items_test', password: 'password123' });
    superadminToken = superadminLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_items_test', password: 'password123' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user_items_test', password: 'password123' });
    userToken = userLogin.body.token;
  });

  afterAll(async () => {
    // Cleanup in correct order (FK constraints)
    if (testItemId) {
      await pool.execute('DELETE FROM audit_logs WHERE table_name = ? AND record_id = ?', ['atk_items', testItemId]);
      await pool.execute('DELETE FROM atk_items WHERE id = ?', [testItemId]);
    }
    await pool.execute('DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE username LIKE ?)', ['%_items_test']);
    await pool.execute("DELETE FROM requests WHERE item LIKE '%Test%' OR receiver LIKE 'Test %'");
    await pool.execute("DELETE FROM atk_items WHERE nama_barang LIKE '%Test%' OR nama_barang = 'Should Fail' OR nama_barang = 'Not Found'");
    await pool.execute('DELETE FROM users WHERE username LIKE ?', ['%_items_test']);
  });

  describe('GET /api/atk-items', () => {
    it('should list all items for authenticated user', async () => {
      const response = await request(app)
        .get('/api/atk-items')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/atk-items?page=1&perPage=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.perPage).toBe(5);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/atk-items?search=pulpen')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Without pagination params, returns array directly
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/atk-items')
        .expect(401);
    });
  });

  describe('POST /api/atk-items', () => {
    it('should create new item as superadmin', async () => {
      const response = await request(app)
        .post('/api/atk-items')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          nama_barang: 'Test Item Integration',
          kode_barang: 'TEST-INT-001',
          qty: 100,
          satuan: 'pcs',
          lokasi_simpan: 'Rak Test',
          min_stock: 10,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nama_barang).toBe('Test Item Integration');
      testItemId = response.body.id;
    });

    it('should prevent negative stock on create', async () => {
      const response = await request(app)
        .post('/api/atk-items')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          nama_barang: 'Negative Test',
          qty: -10,
          satuan: 'pcs',
        })
        .expect(201);

      // Should default to 0
      expect(response.body.qty).toBe(0);
    });

    it('should reject non-superadmin users', async () => {
      await request(app)
        .post('/api/atk-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama_barang: 'Should Fail',
          satuan: 'pcs',
        })
        .expect(403);
    });

    it('should require nama_barang and satuan', async () => {
      await request(app)
        .post('/api/atk-items')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          qty: 10,
        })
        .expect(400);
    });
  });

  describe('GET /api/atk-items/:id', () => {
    it('should get item by id', async () => {
      const response = await request(app)
        .get(`/api/atk-items/${testItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(testItemId);
      expect(response.body.nama_barang).toBe('Test Item Integration');
    });

    it('should return 404 for non-existent item', async () => {
      await request(app)
        .get('/api/atk-items/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/atk-items/:id', () => {
    it('should update item as superadmin', async () => {
      const response = await request(app)
        .put(`/api/atk-items/${testItemId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          nama_barang: 'Test Item Updated',
          kode_barang: 'TEST-INT-001',
          qty: 150,
          satuan: 'pcs',
          lokasi_simpan: 'Rak Test',
          min_stock: 15,
        })
        .expect(200);

      expect(response.body.nama_barang).toBe('Test Item Updated');
      expect(response.body.qty).toBe(150);
    });

    it('should prevent negative stock on update', async () => {
      await request(app)
        .put(`/api/atk-items/${testItemId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          nama_barang: 'Test Item',
          qty: -5,
          satuan: 'pcs',
        })
        .expect(400);
    });

    it('should block edit when pending requests exist', async () => {
      // Create a pending request
      const today = getWIBDate();
      const [requestResult] = await pool.execute(
        'INSERT INTO requests (user_id, item, qty, unit, status, atk_item_id, date, receiver, dept) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [testUserId, 'Test Item Updated', 5, 'pcs', 'PENDING', testItemId, today, 'Test Receiver', 'IT']
      );
      const requestId = requestResult.insertId;

      // Try to update qty
      await request(app)
        .put(`/api/atk-items/${testItemId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          nama_barang: 'Test Item Updated',
          qty: 200,
          satuan: 'pcs',
        })
        .expect(409);

      // Cleanup
      await pool.execute('DELETE FROM requests WHERE id = ?', [requestId]);
    });

    it('should reject non-superadmin users', async () => {
      await request(app)
        .put(`/api/atk-items/${testItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama_barang: 'Should Fail',
          satuan: 'pcs',
        })
        .expect(403);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app)
        .put('/api/atk-items/999999')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          nama_barang: 'Not Found',
          satuan: 'pcs',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/atk-items/:id', () => {
    let deleteTestItemId;
    let deleteTestCounter = 0;

    beforeEach(async () => {
      // Create item to delete with unique name
      deleteTestCounter++;
      const [result] = await pool.execute(
        'INSERT INTO atk_items (nama_barang, kode_barang, qty, satuan, min_stock) VALUES (?, ?, ?, ?, ?)',
        [`Delete Test Item ${deleteTestCounter}`, `DEL-${deleteTestCounter}`, 10, 'pcs', 5]
      );
      deleteTestItemId = result.insertId;
    });

    afterEach(async () => {
      if (deleteTestItemId) {
        await pool.execute('DELETE FROM requests WHERE atk_item_id = ?', [deleteTestItemId]);
        await pool.execute('DELETE FROM atk_items WHERE id = ?', [deleteTestItemId]);
      }
    });

    it('should delete item as superadmin', async () => {
      const response = await request(app)
        .delete(`/api/atk-items/${deleteTestItemId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.message).toContain('berhasil dihapus');

      // Verify deleted
      const [rows] = await pool.execute('SELECT * FROM atk_items WHERE id = ?', [deleteTestItemId]);
      expect(rows.length).toBe(0);
    });

    it('should block delete when pending requests exist', async () => {
      const today = getWIBDate();
      const [requestResult] = await pool.execute(
        'INSERT INTO requests (user_id, item, qty, unit, status, atk_item_id, date, receiver, dept) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [testUserId, `Delete Test Item ${deleteTestCounter}`, 2, 'pcs', 'PENDING', deleteTestItemId, today, 'Test Receiver', 'IT']
      );

      await request(app)
        .delete(`/api/atk-items/${deleteTestItemId}`)
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(409);

      // Cleanup
      await pool.execute('DELETE FROM requests WHERE id = ?', [requestResult.insertId]);
    });

    it('should reject non-superadmin users', async () => {
      await request(app)
        .delete(`/api/atk-items/${deleteTestItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});
