import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/barang-kosong - List empty items (qty = 0)
router.get('/', authenticate, async (req, res) => {
  try {
    // Single source of truth: get items with qty = 0 from atk_items
    const [emptyItems] = await pool.query(`
      SELECT 
        id, 
        nama_barang as name, 
        kode_barang as code, 
        lokasi_simpan as location
      FROM atk_items 
      WHERE qty = 0
      ORDER BY nama_barang ASC
    `);

    res.json(emptyItems);
  } catch (error) {
    console.error('Get barang kosong error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
