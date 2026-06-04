import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { buildPagination, parsePagination, sendPaginated } from '../utils/pagination.js';

const router = Router();

const dateFilter = (query, params, alias = '') => {
    const { from, to } = query;
    const prefix = alias ? `${alias}.` : '';
    const conditions = [];
    if (from) {
        conditions.push(`${prefix}date >= ?`);
        params.push(from);
    }
    if (to) {
        conditions.push(`${prefix}date <= ?`);
        params.push(to);
    }
    return conditions;
};

const runPaginatedHistory = async ({ req, res, baseSelect, baseFrom, baseWhere = [], baseParams = [], orderBy, key = 'entries' }) => {
    const { page, perPage, offset } = parsePagination(req.query, { perPage: 15, maxPerPage: 500 });
    const params = [...baseParams];
    const where = [...baseWhere];

    const dateAlias = baseFrom.includes('requests r') ? 'r' : '';
    where.push(...dateFilter(req.query, params, dateAlias));

    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const countSql = `SELECT COUNT(*) as total ${baseFrom}${whereSql}`;
    const listSql = `${baseSelect} ${baseFrom}${whereSql} ${orderBy} LIMIT ? OFFSET ?`;

    const [countRows] = await pool.query(countSql, params);
    const total = Number(countRows[0]?.total || 0);
    const [rows] = await pool.query(listSql, [...params, perPage, offset]);

    sendPaginated(res, key, rows, buildPagination({ page, perPage, total }));
};

// GET /api/history/masuk - Get barang masuk history
router.get('/masuk', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        await runPaginatedHistory({
            req,
            res,
            baseSelect: `
                SELECT
                    id,
                    date,
                    nama_barang as name,
                    kode_barang as code,
                    qty,
                    satuan as unit,
                    pic
            `,
            baseFrom: 'FROM barang_masuk',
            orderBy: 'ORDER BY date DESC, id DESC',
        });
    } catch (error) {
        console.error('Get history masuk error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/history/keluar - Get barang keluar history (from approved requests)
router.get('/keluar', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const baseWhere = [];
        const baseParams = [];
        if (req.query.dept) {
            baseWhere.push('dept = ?');
            baseParams.push(req.query.dept);
        }

        await runPaginatedHistory({
            req,
            res,
            baseSelect: `
                SELECT
                    id,
                    date,
                    nama_barang as name,
                    kode_barang as code,
                    qty,
                    satuan as unit,
                    penerima as receiver,
                    dept
            `,
            baseFrom: 'FROM barang_keluar',
            baseWhere,
            baseParams,
            orderBy: 'ORDER BY date DESC, id DESC',
        });
    } catch (error) {
        console.error('Get history keluar error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/history/user - Get user's own request history (APPROVED + REJECTED)
router.get('/user', authenticate, async (req, res) => {
    try {
        await runPaginatedHistory({
            req,
            res,
            baseSelect: `
                SELECT
                    r.id,
                    r.date,
                    r.item as name,
                    COALESCE(a.kode_barang, '') as code,
                    r.qty,
                    r.unit,
                    r.receiver,
                    r.dept,
                    r.status,
                    r.reject_reason
            `,
            baseFrom: `
                FROM requests r
                LEFT JOIN atk_items a ON r.atk_item_id = a.id
            `,
            baseWhere: ["r.user_id = ?", "r.status IN ('APPROVED', 'REJECTED')"],
            baseParams: [req.user.id],
            orderBy: 'ORDER BY r.created_at DESC, r.id DESC',
        });
    } catch (error) {
        console.error('Get user history error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
