import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import emailService from '../utils/emailService.js';
import { notifyAdminsWithPersistence } from '../utils/persistedNotifications.js';
import { writeAuditLog } from '../utils/auditLogger.js';

const router = Router();

// GET /api/requests - List requests
router.get('/', authenticate, async (req, res) => {
    try {
        const wantsPagination = req.query.page !== undefined || req.query.perPage !== undefined;
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const perPage = Math.min(Math.max(1, Number.parseInt(req.query.perPage, 10) || 15), 200);
        const offset = (page - 1) * perPage;

        let query = `
      SELECT 
        id,
        date,
        item,
        qty,
        unit,
        receiver,
        dept,
        status,
        reject_reason
      FROM requests
    `;
        let countQuery = 'SELECT COUNT(*) as total FROM requests';
        const params = [];

        if (req.user.role === 'user') {
            query += ' WHERE user_id = ?';
            countQuery += ' WHERE user_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY created_at DESC';

        if (!wantsPagination) {
            const [requests] = await pool.query(query, params);
            return res.json(requests);
        }

        const [countRows] = await pool.query(countQuery, params);
        const total = Number(countRows[0]?.total || 0);
        const [requests] = await pool.query(`${query} LIMIT ? OFFSET ?`, [...params, perPage, offset]);
        res.json({
            requests,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.max(1, Math.ceil(total / perPage)),
            },
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/requests - Create new request
router.post('/', authenticate, authorize('user', 'admin', 'superadmin'), async (req, res) => {
    try {
        const { date, item, qty, unit, receiver, dept } = req.body;

        if (!date || !item || qty === undefined || qty === null || qty === '' || !unit || !receiver || !dept) {
            return res.status(400).json({ message: 'Semua field wajib diisi' });
        }

        const parsedQty = Number(qty);

        if (!Number.isInteger(parsedQty)) {
            return res.status(400).json({ message: 'Jumlah permintaan harus berupa angka bulat' });
        }

        if (parsedQty <= 0) {
            return res.status(400).json({ message: 'Jumlah permintaan harus lebih dari 0' });
        }

        // FIX: Validate item exists in inventory (Case Insensitive) AND use correct name
        const [itemRows] = await pool.query('SELECT id, nama_barang, satuan FROM atk_items WHERE LOWER(nama_barang) = LOWER(?)', [item]);

        if (itemRows.length === 0) {
            return res.status(400).json({
                message: `Barang "${item}" tidak ditemukan di database. Pastikan nama barang sesuai katalog.`
            });
        }

        const validItemId = itemRows[0].id;
        const validItemName = itemRows[0].nama_barang;

        // Validate dept exists as a registered unit
        const [deptRows] = await pool.query('SELECT id FROM users WHERE name = ? AND role = ?', [dept, 'user']);
        if (deptRows.length === 0) {
            return res.status(400).json({
                message: `Unit "${dept}" tidak terdaftar di sistem.`
            });
        }

        const [result] = await pool.execute(`
      INSERT INTO requests (date, item, qty, unit, receiver, dept, status, user_id, atk_item_id)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `, [date, validItemName, parsedQty, unit, receiver, dept, req.user.id, validItemId]);

        const [newRows] = await pool.query('SELECT * FROM requests WHERE id = ?', [result.insertId]);
        const row = newRows[0];
        await writeAuditLog({
            tableName: 'requests',
            recordId: row.id,
            action: 'CREATE',
            oldValues: null,
            newValues: row,
            userId: req.user.id,
            connection: pool,
        });

        notifyAdminsWithPersistence('NEW_REQUEST', row, {
            title: 'Request baru masuk',
            message: `${row.dept} meminta ${row.qty} ${row.unit} ${row.item}`,
        }).catch((err) => console.error('Persist / SSE new request error:', err));

        // Send email notification
        emailService.notifyNewRequest({
            requester: receiver,
            dept,
            itemName: validItemName,
            qty,
            unit
        }).catch(err => console.error('Email new request error:', err));
        
        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/requests/:id - Get single request
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        let query = 'SELECT * FROM requests WHERE id = ?';
        const params = [id];

        // If user role, only allow viewing their own requests
        if (req.user.role === 'user') {
            query += ' AND user_id = ?';
            params.push(req.user.id);
        }

        const [rows] = await pool.query(query, params);
        const request = rows[0];

        if (!request) {
            return res.status(404).json({ message: 'Request tidak ditemukan' });
        }

        res.json(request);
    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
