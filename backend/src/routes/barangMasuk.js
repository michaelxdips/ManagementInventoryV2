import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { getWIBDate } from '../utils/date.js';
import { writeAuditLog } from '../utils/auditLogger.js';

const router = Router();

// GET /api/barang-masuk - Get barang masuk history (same as history/masuk)
router.get('/', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { from, to } = req.query;

        let query = `
            SELECT 
                id,
                date,
                nama_barang as name,
                kode_barang as code,
                qty,
                satuan as unit,
                lokasi_simpan as location,
                pic
            FROM barang_masuk
        `;
        const params = [];

        // FIX-P2-3: Server-side pagination
        const wantsPagination = req.query.page !== undefined || req.query.perPage !== undefined;
        
        let whereSql = '';
        if (from || to) {
            const conditions = [];
            if (from) {
                conditions.push('date >= ?');
                params.push(from);
            }
            if (to) {
                conditions.push('date <= ?');
                params.push(to);
            }
            whereSql = ' WHERE ' + conditions.join(' AND ');
        }

        query += whereSql + ' ORDER BY date DESC, id DESC';

        if (!wantsPagination) {
            const [entries] = await pool.query(query, params);
            return res.json(entries);
        }

        // Pagination
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const perPage = Math.min(Math.max(1, Number.parseInt(req.query.perPage, 10) || 15), 500);
        const offset = (page - 1) * perPage;

        const countQuery = `SELECT COUNT(*) as total FROM barang_masuk ${whereSql}`;
        const [countRows] = await pool.query(countQuery, params);
        const total = Number(countRows[0]?.total || 0);

        query += ' LIMIT ? OFFSET ?';
        params.push(perPage, offset);

        const [entries] = await pool.query(query, params);
        
        res.json({
            items: entries,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.max(1, Math.ceil(total / perPage)),
            },
        });
    } catch (error) {
        console.error('Get barang masuk error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/barang-masuk - Add new stock (Barang Masuk)
router.post('/', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
    const connection = await pool.getConnection(); // Use transaction
    try {
        const { nama_barang, kode_barang, qty, satuan, lokasi_simpan, tanggal } = req.body;

        if (!nama_barang || !qty || !satuan) {
            connection.release();
            return res.status(400).json({ message: 'Nama barang, jumlah, dan satuan wajib diisi' });
        }

        if (qty <= 0) {
            connection.release();
            return res.status(400).json({ message: 'Jumlah harus lebih dari 0' });
        }

        await connection.beginTransaction();

        const date = tanggal || getWIBDate();

        // Find or create item in inventory
        // Use FOR UPDATE to lock row if exists
        const [itemRows] = await connection.query('SELECT * FROM atk_items WHERE LOWER(nama_barang) = LOWER(?) FOR UPDATE', [nama_barang]);
        let item = itemRows[0];
        let itemId;

        if (item) {
            // Update existing item - ADD stock
            await connection.execute(`
                UPDATE atk_items 
                SET qty = qty + ?, 
                    kode_barang = COALESCE(?, kode_barang), 
                    lokasi_simpan = COALESCE(?, lokasi_simpan)
                WHERE id = ?
            `, [qty, kode_barang, lokasi_simpan, item.id]);
            itemId = item.id;
        } else {
            // Create new item
            const [result] = await connection.execute(`
                INSERT INTO atk_items (nama_barang, kode_barang, qty, satuan, lokasi_simpan)
                VALUES (?, ?, ?, ?, ?)
            `, [nama_barang, kode_barang || null, qty, satuan, lokasi_simpan || null]);
            itemId = result.insertId;
        }

        const [barangMasukResult] = await connection.execute(`
            INSERT INTO barang_masuk (date, atk_item_id, nama_barang, kode_barang, qty, satuan, lokasi_simpan, pic)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [date, itemId, nama_barang, kode_barang || null, qty, satuan, lokasi_simpan || null, req.user.name]);

        const [barangMasukRows] = await connection.query('SELECT * FROM barang_masuk WHERE id = ?', [barangMasukResult.insertId]);
        await writeAuditLog({
            tableName: 'barang_masuk',
            recordId: barangMasukResult.insertId,
            action: 'CREATE',
            oldValues: null,
            newValues: barangMasukRows[0],
            userId: req.user.id,
            connection,
        });

        const [updatedItem] = await connection.query('SELECT * FROM atk_items WHERE id = ?', [itemId]);
        await writeAuditLog({
            tableName: 'atk_items',
            recordId: itemId,
            action: item ? 'UPDATE_STOCK_IN' : 'CREATE_FROM_STOCK_IN',
            oldValues: item || null,
            newValues: updatedItem[0],
            userId: req.user.id,
            connection,
        });

        await connection.commit();

        res.status(201).json({
            message: `Barang masuk berhasil dicatat: ${nama_barang} (+${qty} ${satuan})`,
            item: {
                nama_barang,
                kode_barang,
                qty,
                satuan,
                lokasi_simpan,
                date,
                pic: req.user.name
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create barang masuk error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

export default router;
