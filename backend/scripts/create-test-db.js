import 'dotenv/config';
import mysql from 'mysql2/promise';

const createTestDb = async () => {
  console.log('🔧 Creating test database...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS inventory_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Database inventory_test created');
    
    const [rows] = await connection.query("SHOW DATABASES LIKE 'inventory%'");
    console.log('📋 Inventory databases:', rows);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
};

createTestDb();
