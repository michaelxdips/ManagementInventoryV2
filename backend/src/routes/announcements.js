import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { writeAuditLog } from '../utils/auditLogger.js';

const router = Router();

// GET /api/announcements/active — active announcements for all authenticated users
router.get('/active', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, title, content, is_active, created_at, created_by
            FROM announcements
            WHERE is_active = 1
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('List active announcements error:', error);
        res.status(500).json({ message: 'Gagal memuat pengumuman aktif' });
    }
});

// GET /api/announcements — list all (admin/superadmin), for CMS
router.get('/', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, title, content, is_active, created_at, created_by
            FROM announcements
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('List announcements error:', error);
        res.status(500).json({ message: 'Gagal memuat pengumuman' });
    }
});

// POST /api/announcements — create
router.post('/', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { title, content, is_active } = req.body;
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: 'Judul wajib diisi' });
        }
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Isi pengumuman wajib diisi' });
        }
        const active = is_active === undefined ? true : Boolean(is_active);
        const [result] = await pool.execute(
            `INSERT INTO announcements (title, content, is_active, created_by) VALUES (?, ?, ?, ?)`,
            [title.trim(), content.trim(), active, req.user.id]
        );
        const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [result.insertId]);
        await writeAuditLog({
            tableName: 'announcements',
            recordId: result.insertId,
            action: 'CREATE',
            oldValues: null,
            newValues: rows[0],
            userId: req.user.id,
            connection: pool,
        });
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ message: 'Gagal membuat pengumuman' });
    }
});

// PATCH /api/announcements/:id — update fields
router.patch('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID tidak valid' });
        }
        const { title, content, is_active } = req.body;
        const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Pengumuman tidak ditemukan' });
        }

        const updates = [];
        const params = [];
        if (title !== undefined) {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({ message: 'Judul tidak valid' });
            }
            updates.push('title = ?');
            params.push(title.trim());
        }
        if (content !== undefined) {
            if (typeof content !== 'string' || !content.trim()) {
                return res.status(400).json({ message: 'Isi tidak valid' });
            }
            updates.push('content = ?');
            params.push(content.trim());
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }
        if (updates.length === 0) {
            return res.status(400).json({ message: 'Tidak ada field yang diubah' });
        }
        params.push(id);
        const oldAnnouncement = existing[0];
        await pool.execute(`UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`, params);
        const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
        await writeAuditLog({
            tableName: 'announcements',
            recordId: id,
            action: 'UPDATE',
            oldValues: oldAnnouncement,
            newValues: rows[0],
            userId: req.user.id,
            connection: pool,
        });
        res.json(rows[0]);
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ message: 'Gagal memperbarui pengumuman' });
    }
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'ID tidak valid' });
        }
        const [oldRows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
        const [result] = await pool.execute('DELETE FROM announcements WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengumuman tidak ditemukan' });
        }
        await writeAuditLog({
            tableName: 'announcements',
            recordId: id,
            action: 'DELETE',
            oldValues: oldRows[0] || null,
            newValues: null,
            userId: req.user.id,
            connection: pool,
        });
        res.status(204).send();
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ message: 'Gagal menghapus pengumuman' });
    }
});

export default router;
