import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as itemsController from '../controllers/itemsController.js';
import { bulkImport, bulkImportStream } from '../controllers/bulkImportController.js';
import {
    bulkImportLimiter,
    validateExcelUpload,
    sanitizeExcelMiddleware,
} from '../middleware/uploadSecurity.js';
import pool from '../config/db.js';
import multer from 'multer';
import XLSX from 'xlsx';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// GET /api/atk-items - List all items
router.get('/', authenticate, itemsController.getAllItems);

// GET /api/atk-items/:id - Get single item
router.get('/:id', authenticate, itemsController.getItemById);

// PUT /api/atk-items/:id - Update item (superadmin only)
router.put('/:id', authenticate, authorize('superadmin'), itemsController.updateItem);

// POST /api/atk-items - Create new item (superadmin only)
router.post('/', authenticate, authorize('superadmin'), itemsController.createItem);

// POST /api/atk-items/bulk - Bulk import from Excel (superadmin only)
router.post(
    '/bulk',
    authenticate,
    authorize('superadmin'),
    bulkImportLimiter,
    upload.single('file'),
    validateExcelUpload,
    (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'File tidak ditemukan' });
            }

            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);

            if (rows.length === 0) {
                return res.status(400).json({ message: 'File Excel kosong' });
            }

            // Map Excel columns to expected fields robustly
            req.body.items = rows.map((row) => {
                // Normalize keys to lowercase and replace spaces with underscores for easier matching
                const normalizedRow = {};
                for (const key in row) {
                    if (Object.prototype.hasOwnProperty.call(row, key)) {
                        const normKey = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
                        normalizedRow[normKey] = row[key];
                    }
                }

                return {
                    nama_barang:
                        normalizedRow['nama_barang'] ||
                        normalizedRow['nama'] ||
                        normalizedRow['barang'] ||
                        row['Nama Barang'] ||
                        row['nama_barang'] ||
                        '',
                    kode_barang:
                        normalizedRow['kode_barang'] ||
                        normalizedRow['kode'] ||
                        row['Kode Barang'] ||
                        row['kode_barang'] ||
                        '',
                    qty:
                        parseInt(
                            normalizedRow['qty'] ||
                                normalizedRow['jumlah'] ||
                                normalizedRow['quantity'] ||
                                row['Qty'] ||
                                row['Jumlah'] ||
                                row['qty'] ||
                                0,
                            10
                        ) || 0,
                    min_stock:
                        parseInt(
                            normalizedRow['min_stock'] ||
                                normalizedRow['minimal'] ||
                                normalizedRow['batas_bawah'] ||
                                row['Min Stock'] ||
                                row['min_stock'] ||
                                5,
                            10
                        ) || 5,
                    satuan:
                        normalizedRow['satuan'] ||
                        normalizedRow['unit'] ||
                        row['Satuan'] ||
                        row['satuan'] ||
                        '',
                    lokasi_simpan:
                        normalizedRow['lokasi_simpan'] ||
                        normalizedRow['lokasi'] ||
                        row['Lokasi Simpan'] ||
                        row['lokasi_simpan'] ||
                        '',
                };
            });

            next();
        } catch (err) {
            console.error('Excel parse error:', err);
            return res.status(400).json({ message: 'Gagal membaca file Excel: ' + err.message });
        }
    },
    sanitizeExcelMiddleware,
    bulkImport
);

// POST /api/atk-items/bulk-stream - SSE Streaming bulk import from Excel (superadmin only)
router.post(
    '/bulk-stream',
    authenticate,
    authorize('superadmin'),
    bulkImportLimiter,
    upload.single('file'),
    validateExcelUpload,
    (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'File tidak ditemukan' });
            }

            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);

            if (rows.length === 0) {
                return res.status(400).json({ message: 'File Excel kosong' });
            }

            // Map Excel columns to expected fields robustly
            req.body.items = rows.map((row) => {
                const normalizedRow = {};
                for (const key in row) {
                    if (Object.prototype.hasOwnProperty.call(row, key)) {
                        const normKey = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
                        normalizedRow[normKey] = row[key];
                    }
                }
                return {
                    nama_barang:
                        normalizedRow['nama_barang'] ||
                        normalizedRow['nama'] ||
                        normalizedRow['barang'] ||
                        row['Nama Barang'] ||
                        row['nama_barang'] ||
                        '',
                    kode_barang:
                        normalizedRow['kode_barang'] ||
                        normalizedRow['kode'] ||
                        row['Kode Barang'] ||
                        row['kode_barang'] ||
                        '',
                    qty:
                        parseInt(
                            normalizedRow['qty'] ||
                                normalizedRow['jumlah'] ||
                                normalizedRow['quantity'] ||
                                row['Qty'] ||
                                row['Jumlah'] ||
                                row['qty'] ||
                                0,
                            10
                        ) || 0,
                    min_stock:
                        parseInt(
                            normalizedRow['min_stock'] ||
                                normalizedRow['minimal'] ||
                                normalizedRow['batas_bawah'] ||
                                row['Min Stock'] ||
                                row['min_stock'] ||
                                5,
                            10
                        ) || 5,
                    satuan:
                        normalizedRow['satuan'] ||
                        normalizedRow['unit'] ||
                        row['Satuan'] ||
                        row['satuan'] ||
                        '',
                    lokasi_simpan:
                        normalizedRow['lokasi_simpan'] ||
                        normalizedRow['lokasi'] ||
                        row['Lokasi Simpan'] ||
                        row['lokasi_simpan'] ||
                        '',
                };
            });
            next();
        } catch (err) {
            console.error('Excel parse error:', err);
            return res.status(400).json({ message: 'Gagal membaca file Excel: ' + err.message });
        }
    },
    sanitizeExcelMiddleware,
    bulkImportStream
);

// DELETE /api/atk-items/:id - Delete item (superadmin only)
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        await connection.beginTransaction();

        // Check item exists
        const [rows] = await connection.query('SELECT * FROM atk_items WHERE id = ? FOR UPDATE', [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Item tidak ditemukan' });
        }

        // Check pending requests
        const [pendingRows] = await connection.query(
            "SELECT COUNT(*) as count FROM requests WHERE atk_item_id = ? AND status IN ('PENDING', 'APPROVAL_REVIEW')",
            [id]
        );
        if (pendingRows[0].count > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Tidak dapat menghapus item yang memiliki request aktif (PENDING/REVIEW)' });
        }

        // Check if item has transaction history (barang_keluar is NOT NULL FK)
        const [keluarRows] = await connection.query('SELECT COUNT(*) as count FROM barang_keluar WHERE atk_item_id = ?', [id]);
        if (keluarRows[0].count > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Tidak dapat menghapus item yang memiliki riwayat barang keluar. Set stok ke 0 sebagai gantinya.' });
        }

        // Clean up FK references (only nullable FKs)
        await connection.execute('DELETE FROM stock_opname_items WHERE item_id = ?', [id]);
        await connection.execute('UPDATE barang_masuk SET atk_item_id = NULL WHERE atk_item_id = ?', [id]);
        await connection.execute('UPDATE requests SET atk_item_id = NULL WHERE atk_item_id = ?', [id]);
        // Audit log
        await connection.query(
            'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            ['atk_items', id, 'DELETE', JSON.stringify(rows[0]), null, req.user.id]
        );

        await connection.execute('DELETE FROM atk_items WHERE id = ?', [id]);
        await connection.commit();

        res.json({ message: `Item "${rows[0].nama_barang}" berhasil dihapus` });
    } catch (error) {
        await connection.rollback();
        console.error('Delete item error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

export default router;

