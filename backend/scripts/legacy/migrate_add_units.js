import pool from './config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Migration: Add default units (Lgs, bs, pai) if they don't exist already.
 * These are user accounts with role='user' representing organizational units.
 */
const migrate = async () => {
    console.log('🔧 Adding default units (Lgs, bs, pai)...');

    const units = [
        { name: 'Lgs', username: 'lgs', password: 'user123' },
        { name: 'bs', username: 'bs', password: 'user123' },
        { name: 'pai', username: 'pai', password: 'user123' },
    ];

    for (const unit of units) {
        // Check if already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [unit.username]);
        if (existing.length > 0) {
            console.log(`  ⏭️  Unit "${unit.name}" (${unit.username}) sudah ada, skip.`);
            continue;
        }

        const hash = bcrypt.hashSync(unit.password, 10);
        await pool.execute(
            'INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [unit.name, unit.username, hash, 'user']
        );
        console.log(`  ✅ Unit "${unit.name}" (${unit.username}) berhasil ditambahkan.`);
    }

    console.log('✅ Migration selesai.');
    process.exit(0);
};

migrate().catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
});
