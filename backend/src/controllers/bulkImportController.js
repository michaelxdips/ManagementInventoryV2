import pool from '../config/db.js';
import { notifyLowStockToAdmins } from '../utils/persistedNotifications.js';
import { getWIBDate } from '../utils/date.js';

// Original non-streaming bulk import (kept for backwards compatibility)
export const bulkImport = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const items = req.body.items;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Data items kosong atau tidak valid' });
        }

        const errors = [];
        items.forEach((item, idx) => {
            if (!item.nama_barang || !item.satuan) {
                errors.push(`Baris ${idx + 1}: nama_barang dan satuan wajib diisi`);
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Validasi gagal', errors });
        }

        await connection.beginTransaction();

        let insertedCount = 0;
        let updatedCount = 0;
        const lowStockItems = [];

        const [allItems] = await connection.query('SELECT * FROM atk_items');
        const itemsMap = new Map();
        for (const row of allItems) {
            itemsMap.set(row.nama_barang.toLowerCase(), row);
        }

        for (const item of items) {
            const safeQty = (typeof item.qty === 'number' && !isNaN(item.qty) && item.qty >= 0) ? item.qty : 0;
            const safeMinStock = (typeof item.min_stock === 'number' && !isNaN(item.min_stock) && item.min_stock >= 0) ? item.min_stock : 5;
            const itemName = String(item.nama_barang || '').trim();
            const itemCode = item.kode_barang ? String(item.kode_barang).trim() : null;
            const itemUnit = String(item.satuan || '').trim();
            const itemLocation = item.lokasi_simpan ? String(item.lokasi_simpan).trim() : null;
            const today = getWIBDate();

            if (!itemName) continue;

            const existing = itemsMap.get(itemName.toLowerCase());

            if (existing) {
                await connection.execute(
                    `UPDATE atk_items SET qty = qty + ?, min_stock = ?, satuan = ?, lokasi_simpan = COALESCE(?, lokasi_simpan), kode_barang = COALESCE(?, kode_barang) WHERE id = ?`,
                    [safeQty, safeMinStock, itemUnit, itemLocation, itemCode, existing.id]
                );

                const newState = { ...existing, qty: existing.qty + safeQty, min_stock: safeMinStock, satuan: itemUnit, lokasi_simpan: itemLocation || existing.lokasi_simpan, kode_barang: itemCode || existing.kode_barang };

                await connection.query(
                    'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                    ['atk_items', existing.id, 'UPDATE', JSON.stringify(existing), JSON.stringify(newState), req.user.id]
                );

                if (safeQty > 0) {
                    await connection.execute(
                        `INSERT INTO barang_masuk (date, nama_barang, kode_barang, qty, satuan, pic, atk_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [today, itemName, itemCode || existing.kode_barang, safeQty, itemUnit, req.user.name || 'Bulk Import', existing.id]
                    );
                }
                updatedCount++;
                itemsMap.set(itemName.toLowerCase(), newState);
                if (newState.qty <= newState.min_stock) {
                    lowStockItems.push({ name: itemName, remaining: newState.qty, min: newState.min_stock, unit: newState.satuan });
                }
            } else {
                const [result] = await connection.execute(
                    `INSERT INTO atk_items (nama_barang, kode_barang, qty, satuan, lokasi_simpan, min_stock) VALUES (?, ?, ?, ?, ?, ?)`,
                    [itemName, itemCode, safeQty, itemUnit, itemLocation, safeMinStock]
                );
                const newId = result.insertId;
                const newState = { id: newId, nama_barang: itemName, kode_barang: itemCode, qty: safeQty, satuan: itemUnit, lokasi_simpan: itemLocation, min_stock: safeMinStock };

                await connection.query(
                    'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                    ['atk_items', newId, 'CREATE', null, JSON.stringify(newState), req.user.id]
                );

                if (safeQty > 0) {
                    await connection.execute(
                        `INSERT INTO barang_masuk (date, nama_barang, kode_barang, qty, satuan, pic, atk_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [today, itemName, itemCode, safeQty, itemUnit, req.user.name || 'Bulk Import', newId]
                    );
                }
                insertedCount++;
                itemsMap.set(itemName.toLowerCase(), newState);
                if (newState.qty <= newState.min_stock) {
                    lowStockItems.push({ name: itemName, remaining: newState.qty, min: newState.min_stock, unit: newState.satuan });
                }
            }
        }

        await connection.commit();
        for (const low of lowStockItems) {
            notifyLowStockToAdmins({
                item: low.name,
                remaining: low.remaining,
                min: low.min,
                message: `Stok ${low.name} berada di bawah minimum setelah bulk import (sisa ${low.remaining} ${low.unit}).`,
            }).catch((err) => console.error('Bulk import low stock notification error:', err));
        }
        let message = `Berhasil memproses Excel. Ditambahkan: ${insertedCount} barang baru. Diperbarui: ${updatedCount} barang.`;
        res.status(201).json({ message, insertedCount, updatedCount, lowStockCount: lowStockItems.length });
    } catch (error) {
        await connection.rollback();
        console.error('Bulk import error:', error);
        res.status(500).json({ message: 'Gagal import data: ' + error.message });
    } finally {
        connection.release();
    }
};

// SSE Streaming bulk import with real-time progress
export const bulkImportStream = async (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });

    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const connection = await pool.getConnection();
    try {
        const items = req.body.items;
        const totalRows = items.length;

        if (!items || !Array.isArray(items) || totalRows === 0) {
            sendEvent('error', { message: 'Data items kosong atau tidak valid' });
            res.end();
            return;
        }

        // Phase 1: Validation
        sendEvent('phase', { phase: 'validating', message: 'Memvalidasi data...' });

        const errors = [];
        items.forEach((item, idx) => {
            if (!item.nama_barang || !item.satuan) {
                errors.push(`Baris ${idx + 1}: nama_barang dan satuan wajib diisi`);
            }
        });

        if (errors.length > 0) {
            sendEvent('error', { message: 'Validasi gagal', errors });
            res.end();
            return;
        }

        sendEvent('phase', { phase: 'validated', message: `${totalRows} baris siap diproses`, totalRows });

        // Phase 2: Processing
        sendEvent('phase', { phase: 'processing', message: 'Mulai import data...' });

        await connection.beginTransaction();

        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const lowStockItems = [];

        // Pre-fetch all items
        const [allItems] = await connection.query('SELECT * FROM atk_items');
        const itemsMap = new Map();
        for (const row of allItems) {
            itemsMap.set(row.nama_barang.toLowerCase(), row);
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const safeQty = (typeof item.qty === 'number' && !isNaN(item.qty) && item.qty >= 0) ? item.qty : 0;
            const safeMinStock = (typeof item.min_stock === 'number' && !isNaN(item.min_stock) && item.min_stock >= 0) ? item.min_stock : 5;
            const itemName = String(item.nama_barang || '').trim();
            const itemCode = item.kode_barang ? String(item.kode_barang).trim() : null;
            const itemUnit = String(item.satuan || '').trim();
            const itemLocation = item.lokasi_simpan ? String(item.lokasi_simpan).trim() : null;
            const today = getWIBDate();

            if (!itemName) {
                skippedCount++;
                sendEvent('progress', {
                    current: i + 1,
                    total: totalRows,
                    percent: Math.round(((i + 1) / totalRows) * 100),
                    itemName: '(kosong)',
                    action: 'skipped',
                    insertedCount, updatedCount, skippedCount,
                });
                continue;
            }

            const existing = itemsMap.get(itemName.toLowerCase());
            let action = 'inserted';

            if (existing) {
                await connection.execute(
                    `UPDATE atk_items SET qty = qty + ?, min_stock = ?, satuan = ?, lokasi_simpan = COALESCE(?, lokasi_simpan), kode_barang = COALESCE(?, kode_barang) WHERE id = ?`,
                    [safeQty, safeMinStock, itemUnit, itemLocation, itemCode, existing.id]
                );
                const newState = { ...existing, qty: existing.qty + safeQty, min_stock: safeMinStock, satuan: itemUnit, lokasi_simpan: itemLocation || existing.lokasi_simpan, kode_barang: itemCode || existing.kode_barang };

                await connection.query(
                    'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                    ['atk_items', existing.id, 'UPDATE', JSON.stringify(existing), JSON.stringify(newState), req.user.id]
                );

                if (safeQty > 0) {
                    await connection.execute(
                        `INSERT INTO barang_masuk (date, nama_barang, kode_barang, qty, satuan, pic, atk_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [today, itemName, itemCode || existing.kode_barang, safeQty, itemUnit, req.user.name || 'Bulk Import', existing.id]
                    );
                }
                updatedCount++;
                action = 'updated';
                itemsMap.set(itemName.toLowerCase(), newState);
                if (newState.qty <= newState.min_stock) {
                    lowStockItems.push({ name: itemName, remaining: newState.qty, min: newState.min_stock, unit: newState.satuan });
                }
            } else {
                const [result] = await connection.execute(
                    `INSERT INTO atk_items (nama_barang, kode_barang, qty, satuan, lokasi_simpan, min_stock) VALUES (?, ?, ?, ?, ?, ?)`,
                    [itemName, itemCode, safeQty, itemUnit, itemLocation, safeMinStock]
                );
                const newId = result.insertId;
                const newState = { id: newId, nama_barang: itemName, kode_barang: itemCode, qty: safeQty, satuan: itemUnit, lokasi_simpan: itemLocation, min_stock: safeMinStock };

                await connection.query(
                    'INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                    ['atk_items', newId, 'CREATE', null, JSON.stringify(newState), req.user.id]
                );

                if (safeQty > 0) {
                    await connection.execute(
                        `INSERT INTO barang_masuk (date, nama_barang, kode_barang, qty, satuan, pic, atk_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [today, itemName, itemCode, safeQty, itemUnit, req.user.name || 'Bulk Import', newId]
                    );
                }
                insertedCount++;
                action = 'inserted';
                itemsMap.set(itemName.toLowerCase(), newState);
                if (newState.qty <= newState.min_stock) {
                    lowStockItems.push({ name: itemName, remaining: newState.qty, min: newState.min_stock, unit: newState.satuan });
                }
            }

            // Send progress event for each row
            sendEvent('progress', {
                current: i + 1,
                total: totalRows,
                percent: Math.round(((i + 1) / totalRows) * 100),
                itemName,
                action,
                insertedCount, updatedCount, skippedCount,
            });
        }

        await connection.commit();
        for (const low of lowStockItems) {
            notifyLowStockToAdmins({
                item: low.name,
                remaining: low.remaining,
                min: low.min,
                message: `Stok ${low.name} berada di bawah minimum setelah bulk import (sisa ${low.remaining} ${low.unit}).`,
            }).catch((err) => console.error('Bulk import stream low stock notification error:', err));
        }

        // Phase 3: Complete
        sendEvent('complete', {
            message: `Berhasil memproses ${totalRows} baris Excel.`,
            insertedCount,
            updatedCount,
            skippedCount,
            lowStockCount: lowStockItems.length,
            totalRows,
        });

        res.end();
    } catch (error) {
        await connection.rollback();
        console.error('Bulk import stream error:', error);
        sendEvent('error', { message: 'Gagal import data: ' + error.message });
        res.end();
    } finally {
        connection.release();
    }
};
