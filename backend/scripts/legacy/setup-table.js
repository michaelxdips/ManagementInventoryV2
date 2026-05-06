import 'dotenv/config';
import pool from './src/config/db.js';

async function setup() {

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER UNSIGNED,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    await pool.execute(
      `DELETE FROM announcements WHERE title = ? AND content = ?`,
      [
        'Sistem Versi Baru',
        'Selamat datang di dashboard baru! Silakan nikmati fitur-fitur seperti pelacakan status dan order instan.',
      ]
    );

    console.log('Announcements table ready.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

setup();
