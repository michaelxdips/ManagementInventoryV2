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
        const passwordHash = await bcrypt.hash(password, 10);

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

// PUT /api/units/:id - Update unit (name and username) - SUPERADMIN ONLY
router.put('/:id', authenticate, authorize('superadmin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { name, username } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Nama unit wajib diisi' });
        }

        if (!username || typeof username !== 'string' || username.trim() === '') {
            return res.status(400).json({ message: 'Username wajib diisi' });
        }

        const formattedUsername = username.trim().toLowerCase();
        
        // Regex validation: lowercase a-z, 0-9, underscore, 3-50 chars, no space
        const usernameRegex = /^[a-z0-9_]{3,50}$/;
        if (!usernameRegex.test(formattedUsername)) {
            return res.status(400).json({ message: 'Format username tidak valid. Hanya huruf kecil, angka, dan underscore, tanpa spasi (3-50 karakter).' });
        }

        await connection.beginTransaction();

        // Check if unit exists and is actually a unit (role = 'user')
        const [unitRows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        if (unitRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Unit tidak ditemukan' });
        }
        
        const unit = unitRows[0];
        if (unit.role !== 'user') {
            await connection.rollback();
            return res.status(403).json({ message: 'Akses ditolak: Tidak dapat mengedit admin atau superadmin melalui endpoint unit' });
        }

        // Check duplicate username (excluding self)
        const [existingRows] = await connection.query('SELECT id FROM users WHERE username = ? AND id != ?', [formattedUsername, id]);
        if (existingRows.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Username sudah digunakan oleh akun lain' });
        }

        // Update database (only name and username)
        await connection.execute(
            'UPDATE users SET name = ?, username = ? WHERE id = ?',
            [name.trim(), formattedUsername, id]
        );

        const [updatedRows] = await connection.query('SELECT id, name, username FROM users WHERE id = ?', [id]);
        
        await writeAuditLog({
            tableName: 'users',
            recordId: id,
            action: 'UPDATE_UNIT',
            oldValues: unit,
            newValues: updatedRows[0], // Omitting password in returned newValues is fine for audit log logic
            userId: req.user.id,
            connection,
        });

        await connection.commit();
        res.json(updatedRows[0]);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Update unit error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

// PATCH /api/units/:id/password - Reset unit password - SUPERADMIN ONLY
router.patch('/:id/password', authenticate, authorize('superadmin'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ message: 'Password baru minimal 8 karakter' });
        }

        await connection.beginTransaction();

        // Check if unit exists and is actually a unit (role = 'user')
        const [unitRows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        if (unitRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Unit tidak ditemukan' });
        }
        
        const unit = unitRows[0];
        if (unit.role !== 'user') {
            await connection.rollback();
            return res.status(403).json({ message: 'Akses ditolak: Tidak dapat mereset password admin atau superadmin melalui endpoint unit' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update database
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, id]
        );

        // Audit Log (Do not store password)
        const dummyUnitValues = { ...unit };
        delete dummyUnitValues.password_hash;
        
        await writeAuditLog({
            tableName: 'users',
            recordId: id,
            action: 'RESET_UNIT_PASSWORD',
            oldValues: dummyUnitValues,
            newValues: dummyUnitValues, 
            userId: req.user.id,
            connection,
        });

        await connection.commit();
        res.json({ message: 'Password unit berhasil direset.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Reset unit password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

export default router;
