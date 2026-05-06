import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { writeAuditLog } from '../utils/auditLogger.js';

const router = Router();

// GET /api/units/names - List unit names only (for dropdown in request form) - ALL AUTHENTICATED USERS
router.get('/names', authenticate, async (req, res) => {
    try {
        const [units] = await pool.query(`
      SELECT name FROM users WHERE role = 'user' ORDER BY name ASC
    `);
        res.json(units.map((u) => u.name));
    } catch (error) {
        console.error('Get unit names error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/units - List all units (users with role 'user') - SUPERADMIN ONLY
router.get('/', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const [units] = await pool.query(`
      SELECT id, name, username 
      FROM users 
      WHERE role = 'user'
      ORDER BY name ASC
    `);

        res.json(units);
    } catch (error) {
        console.error('Get units error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/units - Create new unit (user account) - SUPERADMIN ONLY
router.post('/', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const { unitName, username, password } = req.body;

        if (!unitName || !username || !password) {
            return res.status(400).json({ message: 'Unit name, username, dan password wajib diisi' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password minimal 6 karakter' });
        }

        // Check if username already exists
        const [existingRows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingRows.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }

        // Hash password
        const passwordHash = bcrypt.hashSync(password, 10);

        // Create user with role 'user'
        const [result] = await pool.execute(`
      INSERT INTO users (name, username, password_hash, role)
      VALUES (?, ?, ?, 'user')
    `, [unitName, username, passwordHash]);

        const [newUnitRows] = await pool.query('SELECT id, name, username FROM users WHERE id = ?', [result.insertId]);
        await writeAuditLog({
            tableName: 'users',
            recordId: result.insertId,
            action: 'CREATE_UNIT',
            oldValues: null,
            newValues: newUnitRows[0],
            userId: req.user.id,
            connection: pool,
        });

        res.status(201).json(newUnitRows[0]);
    } catch (error) {
        console.error('Create unit error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/units/:id - Delete a unit - SUPERADMIN ONLY
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // Check if unit exists
        const [unitRows] = await connection.query('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'user']);
        if (unitRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Unit tidak ditemukan' });
        }

        // OPTIMIZATION: Orphan Data Protection
        // Check if user has associated requests
        const [reqRows] = await connection.query('SELECT 1 FROM requests WHERE user_id = ? LIMIT 1', [id]);
        if (reqRows.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Tidak dapat menghapus unit ini karena memiliki riwayat request. Nonaktifkan akun jika perlu.'
            });
        }

        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        await writeAuditLog({
            tableName: 'users',
            recordId: id,
            action: 'DELETE_UNIT',
            oldValues: unitRows[0],
            newValues: null,
            userId: req.user.id,
            connection,
        });

        await connection.commit();
        res.status(204).send();
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Delete unit error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

export default router;
