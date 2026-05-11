import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { writeAuditLog } from '../utils/auditLogger.js';

const router = Router();

// PUT /api/users/profile - Update current user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, username, email } = req.body;

        if (!name || !username) {
            return res.status(400).json({ message: 'Name dan username wajib diisi' });
        }

        let emailVal;
        if (email === undefined) {
            const [curRows] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
            emailVal = curRows[0]?.email ?? null;
        } else if (email === null) {
            emailVal = null;
        } else {
            const t = String(email).trim();
            if (t === '') {
                emailVal = null;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
                return res.status(400).json({ message: 'Format email tidak valid' });
            } else {
                emailVal = t;
            }
        }

        // Check if username is taken by another user
        const [existingRows] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
        if (existingRows.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }

        const [oldRows] = await pool.query('SELECT id, name, username, role, email FROM users WHERE id = ?', [req.user.id]);
        const oldUser = oldRows[0];

        await pool.execute('UPDATE users SET name = ?, username = ?, email = ? WHERE id = ?', [
            name,
            username,
            emailVal,
            req.user.id,
        ]);

        const [updatedRows] = await pool.query('SELECT id, name, username, role, email FROM users WHERE id = ?', [req.user.id]);
        const updated = updatedRows[0];
        await writeAuditLog({
            tableName: 'users',
            recordId: req.user.id,
            action: 'UPDATE_PROFILE',
            oldValues: oldUser,
            newValues: updated,
            userId: req.user.id,
            connection: pool,
        });

        res.json({
            id: String(updated.id),
            name: updated.name,
            username: updated.username,
            role: updated.role,
            email: updated.email ?? null,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/users/password - Update current user password
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
        }

        // Verify current password
        const [userRows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const user = userRows[0];
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
            return res.status(400).json({ message: 'Password lama salah' });
        }

        // Update password
        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
        await writeAuditLog({
            tableName: 'users',
            recordId: req.user.id,
            action: 'UPDATE_PASSWORD',
            oldValues: { password_changed: false },
            newValues: { password_changed: true },
            userId: req.user.id,
            connection: pool,
        });

        res.json({ message: 'Password berhasil diperbarui' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/users/account - Delete current user account
router.delete('/account', authenticate, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password konfirmasi diperlukan untuk menghapus akun' });
        }

        await connection.beginTransaction();

        // Verify password first
        const [userRows] = await connection.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const user = userRows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            await connection.rollback();
            return res.status(401).json({ message: 'Password salah. Gagal menghapus akun.' });
        }

        // Don't allow deleting superadmin accounts easily
        if (req.user.role === 'superadmin') {
            // Check if this is the last superadmin
            const [countRows] = await connection.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['superadmin']);
            if (countRows[0].count <= 1) {
                await connection.rollback();
                return res.status(400).json({ message: 'Tidak dapat menghapus superadmin terakhir' });
            }
        }

        // OPTIMIZATION: Orphan Data Protection
        // Check if user has associated requests
        const [reqRows] = await connection.query('SELECT 1 FROM requests WHERE user_id = ? LIMIT 1', [req.user.id]);
        if (reqRows.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Tidak dapat menghapus akun karena memiliki riwayat peminjaman. Hubungi admin untuk penonaktifan.'
            });
        }

        const [deleteRows] = await connection.query('SELECT id, name, username, role, email FROM users WHERE id = ?', [req.user.id]);
        const deletedUser = deleteRows[0];

        await connection.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
        await writeAuditLog({
            tableName: 'users',
            recordId: req.user.id,
            action: 'DELETE_ACCOUNT',
            oldValues: deletedUser,
            newValues: null,
            userId: req.user.id,
            connection,
        });

        await connection.commit();
        res.status(204).send();
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

export default router;
