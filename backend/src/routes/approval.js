import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import emailService from '../utils/emailService.js';
import { notifyLowStockToAdmins, notifyUserRequestStatus } from '../utils/persistedNotifications.js';
import { writeAuditLog } from '../utils/auditLogger.js';

const router = Router();

// GET /api/approval - List PENDING requests only (for admin action)
router.get('/', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const [requests] = await pool.query(`
      SELECT 
        r.id,
        r.date,
        r.item as name,
        COALESCE(a.kode_barang, '') as code,
        r.qty,
        r.unit,
        r.receiver,
        r.dept,
        LOWER(r.status) as status
      FROM requests r
      LEFT JOIN atk_items a ON r.atk_item_id = a.id
      WHERE r.status IN ('PENDING', 'APPROVAL_REVIEW')
      ORDER BY r.created_at DESC
    `);

        res.json(requests);
    } catch (error) {
        console.error('Get approvals error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// GET /api/approval/:id/detail - Get request + item details for finalization page
router.get('/:id/detail', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                r.id,
                r.date,
                r.item as name,
                r.qty as requestQty,
                r.unit,
                r.receiver,
                r.dept,
                r.status,
                r.user_id,
                COALESCE(a.id, 0) as item_id,
                COALESCE(a.kode_barang, '') as kode_barang,
                COALESCE(a.lokasi_simpan, '') as lokasi_barang,
                COALESCE(a.qty, 0) as stok_tersedia,
                COALESCE(a.satuan, r.unit) as satuan
            FROM requests r
            LEFT JOIN atk_items a ON r.atk_item_id = a.id
            WHERE r.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request tidak ditemukan' });
        }

        const request = rows[0];

        // REMOVED STRICT CHECK to allow viewing details for PENDING/APPROVED requests
        // logic moved to frontend
        // if (request.status !== 'APPROVAL_REVIEW') {
        //     return res.status(400).json({ message: `Request tidak dalam status review. Status saat ini: ${request.status}` });
        // }

        res.json({
            ...request
        });
    } catch (error) {
        console.error('Get approval detail error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/approval/:id/review - Move request from PENDING to APPROVAL_REVIEW (no stock change)
router.post('/:id/review', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // Lock the row to prevent race conditions
        const [reqRows] = await connection.query('SELECT * FROM requests WHERE id = ? FOR UPDATE', [id]);
        const request = reqRows[0];

        if (!request) {
            await connection.rollback();
            return res.status(404).json({ message: 'Request tidak ditemukan' });
        }

        if (request.status !== 'PENDING') {
            await connection.rollback();
            return res.status(400).json({ message: 'Request sudah diproses sebelumnya' });
        }

        await connection.execute('UPDATE requests SET status = ? WHERE id = ?', ['APPROVAL_REVIEW', id]);
        const [updatedRequestRows] = await connection.query('SELECT * FROM requests WHERE id = ?', [id]);
        await writeAuditLog({
            tableName: 'requests',
            recordId: id,
            action: 'MARK_APPROVAL_REVIEW',
            oldValues: request,
            newValues: updatedRequestRows[0],
            userId: req.user.id,
            connection,
        });

        await connection.commit();

        res.json({ id: parseInt(id), status: 'APPROVAL_REVIEW', message: 'Request siap untuk direview dan difinalisasi' });
    } catch (error) {
        await connection.rollback();
        console.error('Review request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// POST /api/approval/:id/finalize - Finalize approval: validate qty, deduct stock, insert barang_keluar
router.post('/:id/finalize', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { finalQty } = req.body;

        // Validate finalQty exists and is a positive number
        const qty = parseInt(finalQty, 10);
        if (!qty || qty <= 0 || isNaN(qty)) {
            return res.status(400).json({ message: 'Jumlah harus lebih dari 0' });
        }

        await connection.beginTransaction();

        // Step 1: Lock and fetch request
        const [reqRows] = await connection.query('SELECT * FROM requests WHERE id = ? FOR UPDATE', [id]);
        const request = reqRows[0];

        if (!request) {
            await connection.rollback();
            return res.status(404).json({ message: 'Request tidak ditemukan' });
        }

        // Step 2: STRICT status check — only APPROVAL_REVIEW can be finalized
        if (request.status !== 'APPROVAL_REVIEW') {
            await connection.rollback();
            return res.status(400).json({ message: 'Request tidak dalam status review. Tidak bisa difinalisasi.' });
        }

        // Step 3: Validate finalQty <= request.qty
        if (qty > request.qty) {
            await connection.rollback();
            return res.status(400).json({ message: `Jumlah finalisasi (${qty}) melebihi jumlah permintaan (${request.qty})` });
        }

        // Step 4: Find and lock inventory item
        const [itemRows] = await connection.query('SELECT * FROM atk_items WHERE id = ? FOR UPDATE', [request.atk_item_id]);
        const item = itemRows[0];

        if (!item) {
            await connection.rollback();
            return res.status(400).json({ message: `Barang "${request.item}" tidak ditemukan di inventory` });
        }

        // Step 5: Validate finalQty <= current stock (R1)
        if (qty > item.qty) {
            await connection.rollback();
            return res.status(400).json({
                message: `Stok tidak cukup. Tersedia: ${item.qty}, Diminta: ${qty}`
            });
        }

        const newQty = item.qty - qty;

        // Step 6: Update request status to APPROVED
        await connection.execute('UPDATE requests SET status = ? WHERE id = ?', ['APPROVED', id]);

        // Step 7: REDUCE stock
        await connection.execute('UPDATE atk_items SET qty = ? WHERE id = ?', [newQty, item.id]);

        let finalizeLowStock = null;
        const minStockLimit = item.min_stock !== undefined && item.min_stock !== null ? item.min_stock : 5;
        if (newQty <= minStockLimit) {
            finalizeLowStock = {
                item: item.nama_barang,
                remaining: newQty,
                min: minStockLimit,
                message:
                    newQty === 0
                        ? `Stok ${item.nama_barang} HABIS! Segera restock.`
                        : `Stok ${item.nama_barang} menipis (sisa ${newQty} ${item.satuan}). Segera restock.`,
            };
        }

        const [barangKeluarResult] = await connection.execute(`
            INSERT INTO barang_keluar (date, atk_item_id, nama_barang, kode_barang, qty, satuan, penerima, dept, request_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [request.date, item.id, item.nama_barang, item.kode_barang, qty, item.satuan, request.receiver, request.dept, request.id]);

        const [updatedRequestRows] = await connection.query('SELECT * FROM requests WHERE id = ?', [id]);
        const [updatedItemRows] = await connection.query('SELECT * FROM atk_items WHERE id = ?', [item.id]);
        const [barangKeluarRows] = await connection.query('SELECT * FROM barang_keluar WHERE id = ?', [barangKeluarResult.insertId]);
        await writeAuditLog({ tableName: 'requests', recordId: id, action: 'FINALIZE_APPROVAL', oldValues: request, newValues: updatedRequestRows[0], userId: req.user.id, connection });
        await writeAuditLog({ tableName: 'atk_items', recordId: item.id, action: 'UPDATE_STOCK_OUT', oldValues: item, newValues: updatedItemRows[0], userId: req.user.id, connection });
        await writeAuditLog({ tableName: 'barang_keluar', recordId: barangKeluarResult.insertId, action: 'CREATE', oldValues: null, newValues: barangKeluarRows[0], userId: req.user.id, connection });

        await connection.commit();

        if (finalizeLowStock) {
            notifyLowStockToAdmins(finalizeLowStock).catch((err) =>
                console.error('Low stock persistence/SSE error:', err)
            );
            emailService
                .notifyLowStock({
                    itemName: item.nama_barang,
                    currentStock: newQty,
                    minStock: minStockLimit,
                    unit: item.satuan,
                })
                .catch((err) => console.error('Email low stock error:', err));
        }

        notifyUserRequestStatus(request.user_id, {
            requestId: request.id,
            itemName: item.nama_barang,
            status: 'APPROVED',
            message: `Permintaan ${item.nama_barang} disetujui sebanyak ${qty} ${item.satuan}`,
        }).catch((err) => console.error('Notify requester finalize error:', err));

        const responsePayload = {
            message: `Barang keluar dicatat. Stok ${item.nama_barang} berkurang ${qty} (sisa: ${newQty})`,
            finalQty: qty,
            newStock: newQty,
            requestId: request.id,
            itemName: item.nama_barang
        };

        res.json(responsePayload);
    } catch (error) {
        await connection.rollback();
        console.error('Finalize request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// POST /api/approval/:id/reject - Reject a request (no stock change)
router.post('/:id/reject', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // Lock and fetch request
        const [reqRows] = await connection.query('SELECT * FROM requests WHERE id = ? FOR UPDATE', [id]);
        const request = reqRows[0];

        if (!request) {
            await connection.rollback();
            return res.status(404).json({ message: 'Request tidak ditemukan' });
        }

        if (request.status !== 'PENDING' && request.status !== 'APPROVAL_REVIEW') {
            await connection.rollback();
            return res.status(400).json({ message: 'Request sudah diproses sebelumnya' });
        }

        // Update status to REJECTED with optional reason
        const { reason } = req.body;
        await connection.execute('UPDATE requests SET status = ?, reject_reason = ? WHERE id = ?', ['REJECTED', reason || null, id]);
        const [updatedRequestRows] = await connection.query('SELECT * FROM requests WHERE id = ?', [id]);
        await writeAuditLog({
            tableName: 'requests',
            recordId: id,
            action: 'REJECT',
            oldValues: request,
            newValues: updatedRequestRows[0],
            userId: req.user.id,
            connection,
        });

        await connection.commit();

        const [updatedRows] = await pool.query(`
            SELECT 
                r.id,
                r.date,
                r.item as name,
                COALESCE(a.kode_barang, '') as code,
                r.qty,
                r.unit,
                r.receiver,
                r.dept,
                'rejected' as status
            FROM requests r
            LEFT JOIN atk_items a ON r.atk_item_id = a.id
            WHERE r.id = ?
        `, [id]);

        const updatedRequest = updatedRows[0];

        const reasonText = typeof reason === 'string' ? reason.trim() : '';
        const rejectMsg = reasonText
            ? `Permintaan ${request.item} ditolak: ${reasonText}`
            : `Permintaan ${request.item} ditolak oleh admin`;

        notifyUserRequestStatus(request.user_id, {
            requestId: request.id,
            itemName: request.item,
            status: 'REJECTED',
            message: rejectMsg,
        }).catch((err) => console.error('Notify requester reject error:', err));

        res.json(updatedRequest);
    } catch (error) {
        await connection.rollback();
        console.error('Reject request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

export default router;
