import pool from '../config/db.js';
import emailService from '../utils/emailService.js';
import { notifyLowStockToAdmins } from '../utils/persistedNotifications.js';
import { writeAuditLog } from '../utils/auditLogger.js';

export const getAllItems = async (req, res) => {
    try {
        const wantsPagination = req.query.page !== undefined || req.query.perPage !== undefined;
        if (!wantsPagination) {
            const [items] = await pool.query('SELECT * FROM atk_items ORDER BY nama_barang ASC');
            return res.json(items);
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const perPage = Math.min(Math.max(1, Number.parseInt(req.query.perPage, 10) || 15), 500);
        const offset = (page - 1) * perPage;
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const params = [];
        let whereSql = '';
        if (search) {
            whereSql = ' WHERE nama_barang LIKE ? OR kode_barang LIKE ? OR satuan LIKE ? OR lokasi_simpan LIKE ?';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM atk_items${whereSql}`, params);
        const total = Number(countRows[0]?.total || 0);
        const [items] = await pool.query(
            `SELECT * FROM atk_items${whereSql} ORDER BY nama_barang ASC LIMIT ? OFFSET ?`,
            [...params, perPage, offset]
        );
        res.json({
            items,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.max(1, Math.ceil(total / perPage)),
            },
        });
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM atk_items WHERE id = ?', [id]);
        const item = rows[0];

        if (!item) {
            return res.status(404).json({ message: 'Item tidak ditemukan' });
        }

        res.json(item);
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateItem = async (req, res) => {
    // FIX-P1-2: Wrap in transaction + FOR UPDATE to prevent race conditions.
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { nama_barang, kode_barang, qty, satuan, lokasi_simpan, min_stock } = req.body;

        await connection.beginTransaction();

        // Check if item exists — lock row to prevent concurrent modifications
        const [rows] = await connection.query('SELECT * FROM atk_items WHERE id = ? FOR UPDATE', [id]);
        const existing = rows[0];

        if (!existing) {
            await connection.rollback();
            return res.status(404).json({ message: 'Item tidak ditemukan' });
        }

        // Prevent negative stock
        if (typeof qty === 'number' && qty < 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Quantity cannot be negative' });
        }

        // Lock edit qty OR NAME saat ada pending request
        if ((typeof qty === 'number' && qty !== existing.qty) || (nama_barang && nama_barang !== existing.nama_barang)) {
            const [countRows] = await connection.query(`
                SELECT COUNT(*) as count 
                FROM requests 
                WHERE (atk_item_id = ? OR (atk_item_id IS NULL AND LOWER(item) = LOWER(?)))
                AND status IN ('PENDING', 'APPROVAL_REVIEW')
            `, [id, existing.nama_barang]);

            const pendingCount = countRows[0];

            if (pendingCount && pendingCount.count > 0) {
                await connection.rollback();
                return res.status(409).json({
                    message: 'Item cannot be edited (qty/name) while there are pending or in-review requests. Reject/Approve them first.'
                });
            }
        }

        // Update item
        await connection.execute(`
            UPDATE atk_items 
            SET nama_barang = ?, kode_barang = ?, qty = ?, satuan = ?, lokasi_simpan = ?, min_stock = ?
            WHERE id = ?
        `, [nama_barang, kode_barang, qty, satuan, lokasi_simpan, min_stock !== undefined ? min_stock : existing.min_stock, id]);

        // Trigger LOW_STOCK warning if quantity drops below minimum
        const minStockLimit = min_stock !== undefined && min_stock !== null ? min_stock : (existing.min_stock !== null ? existing.min_stock : 5);
        if (typeof qty === 'number' && qty <= minStockLimit && existing.qty > minStockLimit) {
            const finalName = nama_barang || existing.nama_barang;
            const finalSatuan = satuan || existing.satuan;
            const lowStockPayload = {
                item: finalName,
                remaining: qty,
                min: minStockLimit,
                message:
                    qty === 0
                        ? `Stok ${finalName} HABIS! Segera restock.`
                        : `Stok ${finalName} menipis (sisa ${qty} ${finalSatuan}). Segera restock.`,
            };
            notifyLowStockToAdmins(lowStockPayload).catch((err) =>
                console.error('Low stock persistence/SSE error:', err)
            );

            // Send email notification
            emailService.notifyLowStock({
                itemName: finalName,
                currentStock: qty,
                minStock: minStockLimit,
                unit: finalSatuan
            }).catch(err => console.error('Email low stock error:', err));
        }

        // Get updated item
        const [updatedRows] = await connection.query('SELECT * FROM atk_items WHERE id = ?', [id]);
        
        await writeAuditLog({
            tableName: 'atk_items',
            recordId: id,
            action: 'UPDATE',
            oldValues: existing,
            newValues: updatedRows[0],
            userId: req.user.id,
            connection,
        });

        await connection.commit();
        res.json(updatedRows[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Update item error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

export const createItem = async (req, res) => {
    try {
        const { nama_barang, kode_barang, qty, satuan, lokasi_simpan, min_stock } = req.body;

        if (!nama_barang || !satuan) {
            return res.status(400).json({ message: 'Nama barang dan satuan wajib diisi' });
        }

        // FIX #1: Prevent negative stock on create
        const safeQty = (typeof qty === 'number' && qty >= 0) ? qty : 0;

        const [result] = await pool.execute(`
            INSERT INTO atk_items (nama_barang, kode_barang, qty, satuan, lokasi_simpan, min_stock)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [nama_barang, kode_barang || null, safeQty, satuan, lokasi_simpan || null, min_stock !== undefined ? min_stock : 5]);

        const [newRows] = await pool.query('SELECT * FROM atk_items WHERE id = ?', [result.insertId]);
        
        await writeAuditLog({
            tableName: 'atk_items',
            recordId: result.insertId,
            action: 'CREATE',
            oldValues: null,
            newValues: newRows[0],
            userId: req.user.id,
            connection: pool,
        });

        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
