import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkDb() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM atk_items');
    console.log('Columns:', columns.map(c => c.Field));
    
    const [rows] = await pool.query('SELECT id, nama_barang, qty, min_stock FROM atk_items LIMIT 3');
    console.log('\nData:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
checkDb();
