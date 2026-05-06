import 'dotenv/config';
import pool from '../src/config/db.js';

const verifySchema = async () => {
  console.log('🔍 Verifying fresh migration schema...\n');
  
  try {
    // Get all tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('📋 Tables created:', tables.length);
    tables.forEach(row => console.log('  -', Object.values(row)[0]));
    
    console.log('\n🔍 Checking critical tables...');
    
    const criticalTables = [
      'users', 'atk_items', 'requests', 'barang_masuk', 'barang_keluar', 'barang_kosong',
      'announcements', 'stock_opname', 'stock_opname_items', 'audit_logs', 'user_notifications'
    ];
    
    for (const table of criticalTables) {
      const [rows] = await pool.query(`SHOW TABLES LIKE '${table}'`);
      const exists = rows.length > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }
    
    console.log('\n🔍 Checking migration tracking...');
    const [migrations] = await pool.query('SELECT name FROM knex_migrations ORDER BY id');
    console.log(`📋 Migrations applied: ${migrations.length}`);
    migrations.forEach(m => console.log('  -', m.name));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

verifySchema();
