import bcrypt from 'bcryptjs';
import pool from './config/db.js';

/**
 * ⚠️ DEPRECATION NOTICE (May 2026)
 * 
 * The CREATE TABLE statements in this seed file are DEPRECATED.
 * 
 * For fresh database setup, use Knex migrations instead:
 *   npm run migrate
 * 
 * This seed file should ONLY be used for inserting initial data (users, sample items),
 * NOT for creating schema. Schema is now managed by migrations in src/migrations/.
 * 
 * The CREATE TABLE IF NOT EXISTS statements below are kept for backward compatibility
 * with legacy databases, but will be removed in a future version.
 */

const seed = async () => {
  console.log('🌱 Seeding database...');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Create tables
    console.log('Creating tables...');

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'superadmin', 'user') NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ATK Items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS atk_items (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        nama_barang VARCHAR(255) NOT NULL UNIQUE,
        kode_barang VARCHAR(255),
        qty INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        satuan VARCHAR(50) NOT NULL,
        lokasi_simpan VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        item VARCHAR(255) NOT NULL,
        qty INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL,
        receiver VARCHAR(255) NOT NULL,
        dept VARCHAR(255) NOT NULL,
        status ENUM('PENDING', 'APPROVAL_REVIEW', 'APPROVED', 'REJECTED', 'FINISHED') NOT NULL DEFAULT 'PENDING',
        user_id INTEGER,
        atk_item_id INTEGER,
        reject_reason VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (atk_item_id) REFERENCES atk_items(id)
      );
    `);

    // Barang Masuk (Incoming Items) table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS barang_masuk (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        atk_item_id INTEGER,
        nama_barang VARCHAR(255) NOT NULL,
        kode_barang VARCHAR(255),
        qty INTEGER NOT NULL,
        satuan VARCHAR(50) NOT NULL,
        lokasi_simpan VARCHAR(255),
        pic VARCHAR(255),
        request_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (atk_item_id) REFERENCES atk_items(id),
        FOREIGN KEY (request_id) REFERENCES requests(id)
      );
    `);

    // Barang Keluar (Outgoing Items) table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS barang_keluar (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        atk_item_id INTEGER NOT NULL,
        nama_barang VARCHAR(255) NOT NULL,
        kode_barang VARCHAR(255),
        qty INTEGER NOT NULL,
        satuan VARCHAR(50) NOT NULL,
        penerima VARCHAR(255) NOT NULL,
        dept VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (atk_item_id) REFERENCES atk_items(id)
      );
    `);

    // Item Requests New (Request Barang Baru) table
    // DOMAIN: Inventory Creation — completely separate from requests (Ambil Barang)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS item_requests_new (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        requested_by INTEGER NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        description TEXT,
        satuan VARCHAR(50),
        category VARCHAR(255),
        reason TEXT,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
        approved_by INTEGER,
        approved_quantity INTEGER,
        reject_reason VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      );
    `);

    // Barang Kosong (Empty Items) table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS barang_kosong (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(255),
        location VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Announcements table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // Stock Opname table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_opname (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        opname_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('DRAFT', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // Stock Opname Items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_opname_items (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        opname_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        system_qty INTEGER NOT NULL,
        physical_qty INTEGER NOT NULL,
        difference INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (opname_id) REFERENCES stock_opname(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES atk_items(id)
      );
    `);

    // Audit Logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        table_name VARCHAR(255) NOT NULL,
        record_id INTEGER NOT NULL,
        action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
        old_values JSON,
        new_values JSON,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Clear existing data (in reverse order of dependencies)
    console.log('Clearing existing data...');
    await connection.query('DELETE FROM audit_logs');
    await connection.query('DELETE FROM stock_opname_items');
    await connection.query('DELETE FROM stock_opname');
    await connection.query('DELETE FROM barang_keluar');
    await connection.query('DELETE FROM barang_masuk');
    await connection.query('DELETE FROM requests');
    await connection.query('DELETE FROM item_requests_new');
    await connection.query('DELETE FROM barang_kosong');
    try {
      await connection.query('DELETE FROM unit_quota');
    } catch {
      /* tabel unit_quota sudah di-drop di migrasi */
    }
    await connection.query('DELETE FROM atk_items');
    await connection.query('DELETE FROM announcements');
    await connection.query('DELETE FROM users');

    // ========== SEED USERS ==========
    console.log('Seeding users...');
    const users = [
      { name: 'Super Admin', username: 'superadmin', password: 'admin123', role: 'superadmin', email: 'superadmin@demo.local' },
      { name: 'Admin 1', username: 'admin1', password: 'admin123', role: 'admin', email: 'admin@demo.local' },
      { name: 'Share Service & General Support', username: 'ssgs', password: 'user123', role: 'user', email: 'ssgs@demo.local' },
      { name: 'Performance, Risk & QOS', username: 'prq', password: 'user123', role: 'user', email: 'prq@demo.local' },
      { name: 'Lgs', username: 'lgs', password: 'user123', role: 'user', email: null },
      { name: 'bs', username: 'bs', password: 'user123', role: 'user', email: null },
      { name: 'pai', username: 'pai', password: 'user123', role: 'user', email: null },

    ];

    for (const user of users) {
      const hash = bcrypt.hashSync(user.password, 10);
      await connection.execute(
        `INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
        [user.name, user.username, user.email ?? null, hash, user.role]
      );
    }
    console.log(`✅ Created ${users.length} users`);

    // ========== SEED ATK ITEMS ==========
    console.log('Seeding ATK items...');
    const items = [
      { nama: '3M Double Tape Abu-Abu', kode: '3M-DTP-GRY', qty: 15, satuan: 'pcs', lokasi: 'Lemari A1' },
      { nama: 'Amplop Coklat 110x240', kode: 'APP-BRW-110', qty: 200, satuan: 'pack', lokasi: 'Lemari A1' },
      { nama: 'Amplop Coklat 140x270', kode: 'APP-BRW-140', qty: 1001, satuan: 'pack', lokasi: 'Lemari A1' },
      { nama: 'Amplop Polos Coklat', kode: 'APP-PLS-BRW', qty: 190, satuan: 'pcs', lokasi: 'Lemari A2' },
      { nama: 'Amplop Telkom Polos', kode: 'APP-TLM-CLS', qty: 20, satuan: 'bungkus', lokasi: 'Lemari A2' },
      { nama: 'Amplop Telkom Jendela', kode: 'APP-TLM-JDL', qty: 11, satuan: 'bundle', lokasi: 'Lemari A2' },
      { nama: 'Bola Golf', kode: 'BAL-GLF', qty: 3, satuan: 'kotak', lokasi: 'Lemari B1' },
      { nama: 'Ball Liner Biru', kode: 'BAL-LNR-BLU', qty: 109, satuan: 'pcs', lokasi: 'Lemari B1' },
      { nama: 'Ball Liner Hijau', kode: 'BAL-LNR-HJU', qty: 2, satuan: 'pcs', lokasi: 'Lemari B1' },
      { nama: 'Ball Liner Hitam', kode: 'BAL-LNR-HTM', qty: 19, satuan: 'pcs', lokasi: 'Lemari B1' },
      { nama: 'Baterai AA', kode: 'BTR-A2', qty: 48, satuan: 'pcs', lokasi: 'Lemari B2' },
      { nama: 'Baterai AAA', kode: 'BTR-A3', qty: 36, satuan: 'pcs', lokasi: 'Lemari B2' },
      { nama: 'kertas paper one A4', kode: 'PPR-ONE-A4', qty: 50, satuan: 'rim', lokasi: 'Gudang' },
      { nama: 'Map Bening Dataflex', kode: 'MAP-CLS-DTX', qty: 0, satuan: 'pcs', lokasi: 'Lemari C1' },
      { nama: 'Folder One Transparent', kode: 'FDR-ONE-TPR', qty: 120, satuan: 'pcs', lokasi: 'Lemari C1' },
      { nama: 'Gunting Besar Joyko', kode: 'GTG-BIG-JYO', qty: 5, satuan: 'pcs', lokasi: 'Lemari C2' },
      { nama: 'Gunting Kecil', kode: 'GK01', qty: 8, satuan: 'pcs', lokasi: 'Lemari C2' },
      { nama: 'Pilot Hitam', kode: 'PLT-HTM', qty: 45, satuan: 'pcs', lokasi: 'Lemari D1' },
      { nama: 'Pilot Biru', kode: 'PLT-BLU', qty: 38, satuan: 'pcs', lokasi: 'Lemari D1' },
      { nama: 'Lakban Hijau Besar', kode: 'SLS-HJU-BIG', qty: 0, satuan: 'pcs', lokasi: 'Lemari D2' },
      { nama: 'Label Tom & Jerry No.121', kode: 'LBL-TNJ-121', qty: 25, satuan: 'bungkus', lokasi: 'Lemari D2' },
      { nama: 'Snowman Whiteboard Marker Non Permanent Merah', kode: 'SNO-NON-RED', qty: 12, satuan: 'pcs', lokasi: 'Lemari E1' },
      { nama: 'Staples Kecil', kode: 'STP-KCL', qty: 0, satuan: 'kotak', lokasi: 'Lemari E1' },
      { nama: 'Lem Kertas UHU', kode: 'LEM-UHU', qty: 18, satuan: 'pcs', lokasi: 'Lemari E2' },
    ];

    const itemIdMap = {};
    for (const item of items) {
      const [result] = await connection.execute(
        `INSERT INTO atk_items (nama_barang, kode_barang, qty, satuan, lokasi_simpan) VALUES (?, ?, ?, ?, ?)`,
        [item.nama, item.kode, item.qty, item.satuan, item.lokasi]
      );
      itemIdMap[item.nama] = result.insertId;

      if (item.qty === 0) {
        await connection.execute(
          `INSERT INTO barang_kosong (name, code, location) VALUES (?, ?, ?)`,
          [item.nama, item.kode, item.lokasi]
        );
      }
    }
    console.log(`✅ Created ${items.length} ATK items`);

    // ========== SEED REQUESTS ==========
    console.log('Seeding requests...');
    // We need to fetch user IDs to map them first, but since we just inserted them in order...
    // Let's just lookup by username quickly
    const [userRows] = await connection.query('SELECT id, username FROM users');
    const userMap = {};
    userRows.forEach(u => userMap[u.username] = u.id);

    // Helper to get userId by role/name approximation (or just hardcode based on known index from seed)
    // The original seed had hardcoded IDs 4, 5. Let's map them properly.
    // users array: 0=superadmin, 1=admin1, 2=admin2, 3=ssgs, 4=prq, 5=finance, 6=itsupport
    // Original: userId 4 -> Likely 'ssgs' or 'prq'?
    // Let's assume:
    // User 'ssgs' (index 3) is likely the requester for SSGS dept.
    // User 'prq' (index 4) for PRQ dept.

    const reqData = [
      { date: '2026-01-15', item: 'Map Bening Dataflex', qty: 1, unit: 'pcs', receiver: 'Wulan', dept: 'Share Service & General Support', status: 'PENDING', username: 'ssgs' },
      { date: '2026-01-15', item: 'kertas paper one A4', qty: 1, unit: 'rim', receiver: 'Wulan', dept: 'Share Service & General Support', status: 'PENDING', username: 'ssgs' },
      { date: '2026-01-05', item: 'Map Bening Dataflex', qty: 2, unit: 'pcs', receiver: 'Alma', dept: 'Performance, Risk & QOS', status: 'PENDING', username: 'prq' },
      { date: '2026-01-06', item: 'kertas paper one A4', qty: 1, unit: 'rim', receiver: 'wulan', dept: 'Share Service & General Support', status: 'PENDING', username: 'ssgs' },
      { date: '2026-01-07', item: 'Baterai AAA', qty: 2, unit: 'pcs', receiver: 'Akbar', dept: 'Share Service & General Support', status: 'PENDING', username: 'ssgs' },
      { date: '2026-01-07', item: 'Pilot Hitam', qty: 1, unit: 'pcs', receiver: 'eti', dept: 'Share Service & General Support', status: 'APPROVED', username: 'ssgs' },
      { date: '2026-01-07', item: 'Pilot Biru', qty: 1, unit: 'pcs', receiver: 'Eti', dept: 'Share Service & General Support', status: 'APPROVED', username: 'ssgs' },
    ];

    for (const req of reqData) {
      const uId = userMap[req.username];
      await connection.execute(
        `INSERT INTO requests (date, item, qty, unit, receiver, dept, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.date, req.item, req.qty, req.unit, req.receiver, req.dept, req.status, uId]
      );
    }
    console.log(`✅ Created ${reqData.length} requests`);

    // ========== SEED HISTORY (Barang Masuk) ==========
    console.log('Seeding Barang Masuk...');
    const barangMasuk = [
      { date: '2026-01-15', nama: 'Snowman Whiteboard Marker Non Permanent Merah', kode: 'SNO-NON-RED', qty: 10, satuan: 'pcs', pic: 'Super Admin' },
      { date: '2026-01-02', nama: 'Map Bening Dataflex', kode: 'MAP-CLS-DTX', qty: 120, satuan: 'pcs', pic: 'Admin 1' },
      { date: '2026-01-02', nama: 'Folder One Transparent', kode: 'FDR-ONE-TPR', qty: 240, satuan: 'pcs', pic: 'Admin 1' },
      { date: '2026-01-02', nama: 'Amplop Coklat 140x270', kode: 'APP-BRW-140', qty: 1000, satuan: 'pcs', pic: 'Admin 1' },
      { date: '2025-12-02', nama: 'Baterai AA', kode: 'BTR-A2', qty: 70, satuan: 'pcs', pic: 'Admin 1' },
      { date: '2025-12-01', nama: 'kertas paper one A4', kode: 'PPR-ONE-A4', qty: 29, satuan: 'rim', pic: 'Admin 2' },
    ];

    for (const bm of barangMasuk) {
      const itemId = itemIdMap[bm.nama] || null;
      await connection.execute(
        `INSERT INTO barang_masuk (date, atk_item_id, nama_barang, kode_barang, qty, satuan, pic) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bm.date, itemId, bm.nama, bm.kode, bm.qty, bm.satuan, bm.pic]
      );
    }
    console.log(`✅ Created ${barangMasuk.length} barang masuk records`);

    // ========== SEED HISTORY (Barang Keluar) ==========
    console.log('Seeding Barang Keluar...');
    const barangKeluar = [
      { date: '2026-01-20', nama: 'Pilot Hitam', kode: 'PLT-HTM', qty: 2, satuan: 'pcs', penerima: 'Eti', dept: 'Share Service & General Support' },
      { date: '2026-01-18', nama: 'kertas paper one A4', kode: 'PPR-ONE-A4', qty: 3, satuan: 'rim', penerima: 'Wulan', dept: 'Share Service & General Support' },
      { date: '2026-01-15', nama: 'Baterai AA', kode: 'BTR-A2', qty: 4, satuan: 'pcs', penerima: 'Akbar', dept: 'IT Support' },
    ];

    for (const bk of barangKeluar) {
      const itemId = itemIdMap[bk.nama];
      if (itemId) {
        await connection.execute(
          `INSERT INTO barang_keluar (date, atk_item_id, nama_barang, kode_barang, qty, satuan, penerima, dept) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [bk.date, itemId, bk.nama, bk.kode, bk.qty, bk.satuan, bk.penerima, bk.dept]
        );
      }
    }
    console.log(`✅ Created ${barangKeluar.length} barang keluar records`);

    await connection.commit();
    console.log('');
    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('📋 Default credentials:');
    console.log('   Superadmin: superadmin / admin123');
    console.log('   Admin:      admin1 / admin123');
    console.log('   User:       ssgs / user123');


  } catch (error) {
    await connection.rollback();
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
};

seed();
