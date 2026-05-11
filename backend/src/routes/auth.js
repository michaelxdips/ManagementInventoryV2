import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { addToBlacklist, isBlacklisted } from '../utils/tokenBlacklist.js';

const router = Router();

// Stricter rate limit for login attempts
const loginLimiter = rateLimit({
    windowMs: config.authRateLimit.windowMs,
    max: config.authRateLimit.max,
    message: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password wajib diisi' });
        }

        // Find user by username
        let query = 'SELECT * FROM users WHERE username = ?';
        const params = [username];

        // If role specified, also filter by role
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        const [rows] = await pool.execute(query, params);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Return user data (without password) and token
        res.json({
            user: {
                id: String(user.id),
                name: user.name,
                username: user.username,
                role: user.role,
                email: user.email ?? null,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
    // FIX-P1-4: Implement server-side token blacklisting
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        addToBlacklist(token);
    }
    res.status(204).send();
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
    res.json({
        id: String(req.user.id),
        name: req.user.name,
        username: req.user.username,
        role: req.user.role,
        email: req.user.email ?? null,
    });
});

export default router;
