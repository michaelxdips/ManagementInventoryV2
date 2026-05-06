import 'dotenv/config';
import pool from './src/config/db.js';

async function updateDb() {
  console.log('🔄 Updating database schema...');
  try {
    // 1. Alter atk_items to add min_stock
    try {
      await pool.query('ALTER TABLE atk_items ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 10');
      console.log('✅ Added min_stock to atk_items');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ min_stock already exists');
      } else {
        throw e;
      }
    }

    // 2. Create stock_opname table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_opname (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        opname_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('DRAFT', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
        notes TEXT,
        created_by INTEGER UNSIGNED,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);
    console.log('✅ Created stock_opname table');

    // 3. Create stock_opname_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_opname_items (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        opname_id INTEGER NOT NULL,
        item_id INTEGER UNSIGNED NOT NULL,
        system_qty INTEGER NOT NULL,
        physical_qty INTEGER NOT NULL,
        difference INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (opname_id) REFERENCES stock_opname(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES atk_items(id)
      );
    `);
    console.log('✅ Created stock_opname_items table');

    // 4. Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        table_name VARCHAR(255) NOT NULL,
        record_id INTEGER NOT NULL,
        action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
        old_values JSON,
        new_values JSON,
        user_id INTEGER UNSIGNED,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log('✅ Created audit_logs table');

  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    await pool.end();
  }
}

updateDb();
