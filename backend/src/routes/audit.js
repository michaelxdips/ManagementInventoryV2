import express from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const ALLOWED_ACTIONS = new Set(['CREATE', 'UPDATE', 'DELETE']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseBoundedInt = (value, fallback, min, max) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
};

router.get('/', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
    try {
        const page = parseBoundedInt(req.query.page, 1, 1, 100000);
        const perPage = parseBoundedInt(req.query.perPage, 15, 1, 100);

        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const actionRaw = typeof req.query.action === 'string' ? req.query.action.trim().toUpperCase() : '';
        const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom.trim() : '';
        const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo.trim() : '';

        if (actionRaw && !ALLOWED_ACTIONS.has(actionRaw)) {
            return res.status(400).json({ message: 'Filter aksi tidak valid' });
        }

        if (dateFrom && !DATE_REGEX.test(dateFrom)) {
            return res.status(400).json({ message: 'Format dateFrom tidak valid (YYYY-MM-DD)' });
        }

        if (dateTo && !DATE_REGEX.test(dateTo)) {
            return res.status(400).json({ message: 'Format dateTo tidak valid (YYYY-MM-DD)' });
        }

        if (dateFrom && dateTo && dateFrom > dateTo) {
            return res.status(400).json({ message: 'dateFrom tidak boleh lebih besar dari dateTo' });
        }

        const where = [];
        const whereParams = [];

        if (search) {
            const like = `%${search}%`;
            where.push('(a.table_name LIKE ? OR COALESCE(u.name, \'\') LIKE ? OR CAST(a.record_id AS CHAR) LIKE ?)');
            whereParams.push(like, like, like);
        }

        if (actionRaw) {
            where.push('a.action = ?');
            whereParams.push(actionRaw);
        }

        if (dateFrom) {
            where.push('DATE(a.created_at) >= ?');
            whereParams.push(dateFrom);
        }

        if (dateTo) {
            where.push('DATE(a.created_at) <= ?');
            whereParams.push(dateTo);
        }

        const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const [countRows] = await pool.query(
            `
            SELECT COUNT(*) as total
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ${whereSql}
        `,
            whereParams
        );

        const total = Number(countRows[0]?.total ?? 0);
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const safePage = Math.min(page, totalPages);
        const offset = (safePage - 1) * perPage;

        const [logs] = await pool.query(
            `
            SELECT a.*, u.name as user_name
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ${whereSql}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `,
            [...whereParams, perPage, offset]
        );

        res.json({
            logs,
            pagination: {
                page: safePage,
                perPage,
                total,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

export default router;
