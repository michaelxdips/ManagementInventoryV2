import express from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import emailService from '../utils/emailService.js';
import { writeAuditLog } from '../utils/auditLogger.js';

const router = express.Router();

// 1. Get all stock opname sessions
router.get('/', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const [sessions] = await pool.query(`
            SELECT so.*, u.name as created_by_name 
            FROM stock_opname so
            LEFT JOIN users u ON so.created_by = u.id
            ORDER BY so.created_at DESC
        `);
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching stock opname:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// 2. Get specific session with items
router.get('/:id', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const [session] = await pool.query('SELECT * FROM stock_opname WHERE id = ?', [req.params.id]);
        if (session.length === 0) return res.status(404).json({ message: 'Sesi opname tidak ditemukan' });

        const [items] = await pool.query(`
            SELECT soi.*, a.nama_barang, a.kode_barang 
            FROM stock_opname_items soi
            JOIN atk_items a ON soi.item_id = a.id
            WHERE soi.opname_id = ?
        `, [req.params.id]);

        res.json({ ...session[0], items });
    } catch (error) {
        console.error('Error fetching opname details:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// 3. Create a new DRAFT opname session (snapshots current items)
router.post('/', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Check if there's an active draft
        const [drafts] = await connection.query("SELECT id FROM stock_opname WHERE status = 'DRAFT'");
        if (drafts.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Selesaikan atau batalkan sesi DRAFT yang sedang berjalan terlebih dahulu' });
        }

        const [result] = await connection.query(
            'INSERT INTO stock_opname (created_by, notes) VALUES (?, ?)',
            [req.user.id, req.body.notes || '']
        );
        const opnameId = result.insertId;

        // Snapshot all current items
        const [items] = await connection.query('SELECT id, qty FROM atk_items');
        if (items.length > 0) {
            const values = items.map(item => [opnameId, item.id, item.qty, item.qty, 0]);
            await connection.query(
                'INSERT INTO stock_opname_items (opname_id, item_id, system_qty, physical_qty, difference) VALUES ?',
                [values]
            );
        }

        const [sessionRows] = await connection.query('SELECT * FROM stock_opname WHERE id = ?', [opnameId]);
        await writeAuditLog({
            tableName: 'stock_opname',
            recordId: opnameId,
            action: 'CREATE_DRAFT',
            oldValues: null,
            newValues: { ...sessionRows[0], snapshot_count: items.length },
            userId: req.user.id,
            connection,
        });

        await connection.commit();
        res.status(201).json({ id: opnameId, message: 'Sesi Stock Opname berhasil dibuat' });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating opname:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    } finally {
        connection.release();
    }
});

// 4. Update physical quantity for an item in a draft session
router.put('/:id/items/:itemId', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const physicalQty = Number(req.body.physical_qty);
        const notes = req.body.notes || '';

        const [oldRows] = await pool.query('SELECT * FROM stock_opname_items WHERE opname_id = ? AND item_id = ?', [req.params.id, req.params.itemId]);

        await pool.query(`
            UPDATE stock_opname_items 
            SET physical_qty = ?, difference = (? - system_qty), notes = ?
            WHERE opname_id = ? AND item_id = ?
        `, [physicalQty, physicalQty, notes, req.params.id, req.params.itemId]);

        const [newRows] = await pool.query('SELECT * FROM stock_opname_items WHERE opname_id = ? AND item_id = ?', [req.params.id, req.params.itemId]);
        if (newRows.length > 0) {
            await writeAuditLog({
                tableName: 'stock_opname_items',
                recordId: newRows[0].id,
                action: 'UPDATE_PHYSICAL_QTY',
                oldValues: oldRows[0] || null,
                newValues: newRows[0],
                userId: req.user.id,
                connection: pool,
            });
        }

        res.json({ message: 'Item updated' });
    } catch (error) {
        console.error('Error updating opname item:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// 5. Finalize the opname session (Updates actual stock and writes to audit_logs)
router.post('/:id/finalize', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [sessionRows] = await connection.query('SELECT status FROM stock_opname WHERE id = ? FOR UPDATE', [req.params.id]);
        if (sessionRows.length === 0) throw new Error('Sesi opname tidak ditemukan');
        if (sessionRows[0].status === 'FINALIZED') {
            await connection.rollback();
            return res.status(400).json({ message: 'Sesi ini sudah difinalisasi' });
        }

        // Get all items that have a difference
        const [items] = await connection.query('SELECT * FROM stock_opname_items WHERE opname_id = ? AND difference != 0', [req.params.id]);

        for (const item of items) {
            const [oldItemRows] = await connection.query('SELECT * FROM atk_items WHERE id = ? FOR UPDATE', [item.item_id]);
            const oldItem = oldItemRows[0];
            await connection.query('UPDATE atk_items SET qty = ? WHERE id = ?', [item.physical_qty, item.item_id]);
            const [newItemRows] = await connection.query('SELECT * FROM atk_items WHERE id = ?', [item.item_id]);

            await writeAuditLog({
                tableName: 'atk_items',
                recordId: item.item_id,
                action: 'STOCK_OPNAME_ADJUSTMENT',
                oldValues: oldItem || { qty: item.system_qty },
                newValues: {
                    ...(newItemRows[0] || { qty: item.physical_qty }),
                    opname_id: Number(req.params.id),
                    difference: item.difference,
                    notes: item.notes || null,
                },
                userId: req.user.id,
                connection,
            });
        }

        const oldSession = sessionRows[0];
        await connection.query("UPDATE stock_opname SET status = 'FINALIZED' WHERE id = ?", [req.params.id]);
        const [finalSessionRows] = await connection.query('SELECT * FROM stock_opname WHERE id = ?', [req.params.id]);
        await writeAuditLog({
            tableName: 'stock_opname',
            recordId: req.params.id,
            action: 'FINALIZE',
            oldValues: oldSession,
            newValues: { ...finalSessionRows[0], adjusted_count: items.length },
            userId: req.user.id,
            connection,
        });

        await connection.commit();

        // Send email notification about finalized opname
        emailService.notifyOpnameFinalized({
            sessionId: req.params.id,
            adjustedCount: items.length,
            performedBy: req.user.name || req.user.username
        }).catch(err => console.error('Email opname finalized error:', err));

        res.json({ message: 'Stock Opname berhasil difinalisasi. Stok utama telah diperbarui.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error finalizing opname:', error);
        res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
    } finally {
        connection.release();
    }
});

// 6. Delete a draft session
router.delete('/:id', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const [session] = await pool.query('SELECT * FROM stock_opname WHERE id = ?', [req.params.id]);
        if (session.length > 0 && session[0].status === 'FINALIZED') {
            return res.status(400).json({ message: 'Tidak dapat menghapus sesi yang sudah difinalisasi' });
        }
        await pool.query('DELETE FROM stock_opname WHERE id = ?', [req.params.id]);
        if (session.length > 0) {
            await writeAuditLog({
                tableName: 'stock_opname',
                recordId: req.params.id,
                action: 'DELETE_DRAFT',
                oldValues: session[0],
                newValues: null,
                userId: req.user.id,
                connection: pool,
            });
        }
        res.json({ message: 'Sesi opname dihapus' });
    } catch (error) {
        console.error('Error deleting opname:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

export default router;
