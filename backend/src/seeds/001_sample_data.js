/**
 * Seed: Sample Data Realistis (Clean DB Reset Mode)
 * DEMO ONLY — do not use in production
 * Run with: npm run seed:data
 */

import bcrypt from 'bcryptjs';

export async function seed(knex) {
    console.log('🌱 Seeding realistic mock data...');

    const tablesToCount = ['users', 'atk_items', 'requests', 'barang_masuk', 'barang_keluar', 'item_requests_new', 'audit_logs', 'user_notifications', 'announcements', 'stock_opname', 'stock_opname_items'];
    
    console.log('\n--- ROW COUNT BEFORE SEED ---');
    for (const table of tablesToCount) {
        const result = await knex(table).count('* as count');
        console.log(`${table.padEnd(20)} : ${result[0].count}`);
    }
    console.log('-----------------------------\n');

    // Disable foreign key checks for clean truncation
    await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
    try {
        await knex('audit_logs').truncate();
        await knex('user_notifications').truncate();
        await knex('announcements').truncate();
        await knex('stock_opname_items').truncate();
        await knex('stock_opname').truncate();
        await knex('barang_keluar').truncate();
        await knex('barang_masuk').truncate();
        await knex('requests').truncate();
        await knex('item_requests_new').truncate();
        await knex('atk_items').truncate();
        await knex('users').truncate();
    } finally {
        await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
    }

    const now = new Date();
    const dateStr = (daysOffset) => {
        const d = new Date(now);
        d.setDate(d.getDate() + daysOffset);
        return d.toISOString().split('T')[0];
    };

    // ========== USERS ==========
    const users = [
        { name: 'Super Administrator', username: 'superadmin', password: 'password_demo', role: 'superadmin', email: 'superadmin@example.com' },
        { name: 'Admin Gudang ATK', username: 'admin_gudang', password: 'password_demo', role: 'admin', email: 'admin_gudang@example.com' },
        { name: 'Admin General Support', username: 'admin_general_support', password: 'password_demo', role: 'admin', email: 'admin_gs@example.com' },
        { name: 'Sales & Operation (Consumer/Enterprise)', username: 'sales_operation', password: 'password_demo', role: 'user', email: 'sales@example.com' },
        { name: 'Network Area / Access Network Operation', username: 'network_area', password: 'password_demo', role: 'user', email: 'network@example.com' },
        { name: 'Service Assurance', username: 'service_assurance', password: 'password_demo', role: 'user', email: 'sa@example.com' },
        { name: 'Shared Service & General Support', username: 'shared_service_general_support', password: 'password_demo', role: 'user', email: 'ssgs@example.com' },
        { name: 'Finance & Payment Collection', username: 'finance_payment_collection', password: 'password_demo', role: 'user', email: 'finance@example.com' },
        { name: 'Customer Care / Plasa Telkom', username: 'customer_care_plasa', password: 'password_demo', role: 'user', email: 'plasa@example.com' },
        { name: 'Performance Quality Management & Administration (PQMA)', username: 'pqma', password: 'password_demo', role: 'user', email: 'pqma@example.com' },
    ];

    for (const u of users) {
        const hash = bcrypt.hashSync(u.password, 10);
        await knex('users').insert({
            name: u.name,
            username: u.username,
            password_hash: hash,
            role: u.role,
            email: u.email
        });
    }
    console.log(`✅ Created ${users.length} users`);

    const userRows = await knex('users').select('id', 'username', 'name');
    const userMap = {};
    const userIdMap = {};
    userRows.forEach(u => {
        userMap[u.username] = u.id;
        userIdMap[u.username] = u;
    });

    // ========== ATK ITEMS ==========
    const itemData = [
        // Stok Melimpah (5)
        { nama_barang: 'Kertas A4 70gsm PaperOne', kode_barang: 'PPR-A4-70', qty: 250, min_stock: 20, satuan: 'rim', lokasi_simpan: 'Gudang Utama' },
        { nama_barang: 'Amplop Coklat Folio', kode_barang: 'AMP-CKL-FL', qty: 1200, min_stock: 100, satuan: 'lembar', lokasi_simpan: 'Rak B2' },
        { nama_barang: 'Pulpen Hitam Standard', kode_barang: 'PEN-BLK-01', qty: 500, min_stock: 50, satuan: 'pcs', lokasi_simpan: 'Rak A1' },
        { nama_barang: 'Sticky Notes 3x3 Kuning', kode_barang: 'STK-3X3-YLW', qty: 300, min_stock: 15, satuan: 'pack', lokasi_simpan: 'Laci Admin' },
        { nama_barang: 'Paper Clip Sedang', kode_barang: 'CLP-MD-01', qty: 450, min_stock: 40, satuan: 'kotak', lokasi_simpan: 'Laci Admin' },
        
        // Stok Normal (15)
        { nama_barang: 'Pulpen Biru Standard', kode_barang: 'PEN-BLU-01', qty: 150, min_stock: 30, satuan: 'pcs', lokasi_simpan: 'Rak A1' },
        { nama_barang: 'Pensil 2B Faber Castell', kode_barang: 'PNS-2B-FC', qty: 80, min_stock: 20, satuan: 'pcs', lokasi_simpan: 'Rak A1' },
        { nama_barang: 'Spidol Board Marker Hitam', kode_barang: 'SPD-BM-BLK', qty: 65, min_stock: 15, satuan: 'pcs', lokasi_simpan: 'Rak A2' },
        { nama_barang: 'Stabilo Kuning', kode_barang: 'STB-YLW', qty: 45, min_stock: 10, satuan: 'pcs', lokasi_simpan: 'Rak A2' },
        { nama_barang: 'Penghapus Joyko', kode_barang: 'ERS-JYK', qty: 90, min_stock: 20, satuan: 'pcs', lokasi_simpan: 'Rak A2' },
        { nama_barang: 'Kertas A4 80gsm Sinar Dunia', kode_barang: 'PPR-A4-80', qty: 120, min_stock: 20, satuan: 'rim', lokasi_simpan: 'Gudang Utama' },
        { nama_barang: 'Map Snelhecter Plastik', kode_barang: 'MAP-SNL-PLS', qty: 110, min_stock: 30, satuan: 'pcs', lokasi_simpan: 'Rak B1' },
        { nama_barang: 'Map Binder B5', kode_barang: 'MAP-BND-B5', qty: 55, min_stock: 15, satuan: 'pcs', lokasi_simpan: 'Rak B1' },
        { nama_barang: 'Stapler Sedang Joyko', kode_barang: 'STP-MD-JYK', qty: 35, min_stock: 10, satuan: 'pcs', lokasi_simpan: 'Laci Admin' },
        { nama_barang: 'Gunting Sedang', kode_barang: 'GNT-MD-01', qty: 40, min_stock: 10, satuan: 'pcs', lokasi_simpan: 'Laci Admin' },
        { nama_barang: 'Cutter Kenko', kode_barang: 'CTR-KNK', qty: 25, min_stock: 5, satuan: 'pcs', lokasi_simpan: 'Laci Admin' },
        { nama_barang: 'Lem Kertas Cair', kode_barang: 'GLU-LIQ-01', qty: 45, min_stock: 10, satuan: 'botol', lokasi_simpan: 'Rak C1' },
        { nama_barang: 'Lakban Bening 2 Inch', kode_barang: 'LKB-BNG-2IN', qty: 60, min_stock: 15, satuan: 'roll', lokasi_simpan: 'Rak C1' },
        { nama_barang: 'Tisu Wajah 250s', kode_barang: 'TSU-WJH-250', qty: 85, min_stock: 20, satuan: 'pack', lokasi_simpan: 'Gudang Belakang' },
        { nama_barang: 'Isi Staples Kecil', kode_barang: 'STP-KCL-01', qty: 80, min_stock: 30, satuan: 'kotak', lokasi_simpan: 'Laci Admin' },

        // Stok Mendekati min_stock (5)
        { nama_barang: 'Double Tape 1 Inch', kode_barang: 'DBT-1IN-01', qty: 12, min_stock: 10, satuan: 'roll', lokasi_simpan: 'Rak C1' },
        { nama_barang: 'Spidol Board Marker Merah', kode_barang: 'SPD-BM-RED', qty: 16, min_stock: 15, satuan: 'pcs', lokasi_simpan: 'Rak A2' },
        { nama_barang: 'Ordner Besar Bantex', kode_barang: 'ORD-BIG-BNT', qty: 22, min_stock: 20, satuan: 'pcs', lokasi_simpan: 'Rak B2' },
        { nama_barang: 'Baterai AA Alkaline', kode_barang: 'BTR-AA-ALK', qty: 25, min_stock: 20, satuan: 'pcs', lokasi_simpan: 'Rak C2' },
        { nama_barang: 'Tinta Printer Epson Hitam', kode_barang: 'TNK-EPS-BLK', qty: 6, min_stock: 5, satuan: 'botol', lokasi_simpan: 'Ruang IT' },

        // Stok Tepat min_stock (5)
        { nama_barang: 'Tinta Printer Epson Warna', kode_barang: 'TNK-EPS-CLR', qty: 5, min_stock: 5, satuan: 'set', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Baterai AAA Alkaline', kode_barang: 'BTR-AAA-ALK', qty: 20, min_stock: 20, satuan: 'pcs', lokasi_simpan: 'Rak C2' },
        { nama_barang: 'Kalkulator Citizen 12 Digit', kode_barang: 'CAL-CTZ-12', qty: 3, min_stock: 3, satuan: 'pcs', lokasi_simpan: 'Laci Admin' },
        { nama_barang: 'Binder Clip 105', kode_barang: 'BCL-105', qty: 15, min_stock: 15, satuan: 'kotak', lokasi_simpan: 'Rak C1' },
        { nama_barang: 'Correction Tape Joyko', kode_barang: 'CRT-JYK', qty: 10, min_stock: 10, satuan: 'pcs', lokasi_simpan: 'Laci Admin' },

        // Stok Kosong (5)
        { nama_barang: 'Toner Printer HP Laserjet', kode_barang: 'TNR-HP-LSJ', qty: 0, min_stock: 2, satuan: 'cartridge', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Flashdisk 32GB Sandisk', kode_barang: 'FLD-32G-SND', qty: 0, min_stock: 5, satuan: 'pcs', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Mouse Wireless Logitech', kode_barang: 'MSW-LGT-01', qty: 0, min_stock: 3, satuan: 'pcs', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Kertas F4 70gsm Sinar Dunia', kode_barang: 'PPR-F4-70', qty: 0, min_stock: 10, satuan: 'rim', lokasi_simpan: 'Gudang Utama' },
        { nama_barang: 'Hand Sanitizer 500ml', kode_barang: 'HND-SNT-500', qty: 0, min_stock: 10, satuan: 'botol', lokasi_simpan: 'Gudang Belakang' },

        // Tambahan IT/Mahal (5)
        { nama_barang: 'Keyboard USB Logitech', kode_barang: 'KBD-USB-LGT', qty: 8, min_stock: 2, satuan: 'pcs', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Kabel HDMI 2 Meter', kode_barang: 'CBL-HDM-2M', qty: 15, min_stock: 5, satuan: 'pcs', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Kabel LAN Cat6 5 Meter', kode_barang: 'CBL-LAN-5M', qty: 12, min_stock: 5, satuan: 'pcs', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Toner Printer Brother', kode_barang: 'TNR-BRT-01', qty: 4, min_stock: 2, satuan: 'cartridge', lokasi_simpan: 'Ruang IT' },
        { nama_barang: 'Headset Logitech H111', kode_barang: 'HDS-LGT-H1', qty: 5, min_stock: 2, satuan: 'pcs', lokasi_simpan: 'Ruang IT' },
    ];

    for (const item of itemData) {
        await knex('atk_items').insert(item);
    }
    console.log(`✅ Created ${itemData.length} ATK items`);

    const itemRows = await knex('atk_items').select('*');
    const itemMap = {};
    itemRows.forEach(i => (itemMap[i.nama_barang] = i));

    // ========== BARANG MASUK ==========
    const barangMasukData = [];
    for (let i = 0; i < 30; i++) {
        const item = itemRows[i % itemRows.length];
        const bmQty = item.qty === 0 ? (i+1)*5 : Math.floor(item.qty / 2) || 10;
        barangMasukData.push({
            date: dateStr(-(Math.floor(Math.random() * 60))),
            atk_item_id: item.id,
            nama_barang: item.nama_barang,
            kode_barang: item.kode_barang,
            qty: bmQty,
            satuan: item.satuan,
            pic: i % 2 === 0 ? 'Admin Gudang ATK' : 'Admin General Support',
        });
    }

    for (const bm of barangMasukData) {
        await knex('barang_masuk').insert(bm);
    }
    console.log(`✅ Created ${barangMasukData.length} Barang Masuk records`);

    // ========== REQUESTS (AMBIL BARANG) ==========
    const requestsData = [
        // 12 PENDING
        { item_name: 'Pulpen Hitam Standard', qty: 10, username: 'sales_operation', status: 'PENDING', offset: 0 },
        { item_name: 'Sticky Notes 3x3 Kuning', qty: 5, username: 'sales_operation', status: 'PENDING', offset: 0 },
        { item_name: 'Kabel LAN Cat6 5 Meter', qty: 2, username: 'network_area', status: 'PENDING', offset: -1 },
        { item_name: 'Lakban Bening 2 Inch', qty: 5, username: 'network_area', status: 'PENDING', offset: -1 },
        { item_name: 'Kertas A4 70gsm PaperOne', qty: 5, username: 'service_assurance', status: 'PENDING', offset: -1 },
        { item_name: 'Map Snelhecter Plastik', qty: 10, username: 'shared_service_general_support', status: 'PENDING', offset: -2 },
        { item_name: 'Ordner Besar Bantex', qty: 5, username: 'shared_service_general_support', status: 'PENDING', offset: -2 },
        { item_name: 'Kalkulator Citizen 12 Digit', qty: 2, username: 'finance_payment_collection', status: 'PENDING', offset: -3 },
        { item_name: 'Tisu Wajah 250s', qty: 5, username: 'customer_care_plasa', status: 'PENDING', offset: -3 },
        { item_name: 'Toner Printer HP Laserjet', qty: 1, username: 'pqma', status: 'PENDING', offset: -3 }, // Stok kosong!
        { item_name: 'Flashdisk 32GB Sandisk', qty: 2, username: 'pqma', status: 'PENDING', offset: -4 }, // Stok kosong!
        { item_name: 'Tinta Printer Epson Hitam', qty: 2, username: 'pqma', status: 'PENDING', offset: -4 },

        // 7 APPROVAL_REVIEW
        { item_name: 'Map Snelhecter Plastik', qty: 15, username: 'sales_operation', status: 'APPROVAL_REVIEW', offset: -1 },
        { item_name: 'Baterai AA Alkaline', qty: 10, username: 'network_area', status: 'APPROVAL_REVIEW', offset: -2 },
        { item_name: 'Spidol Board Marker Hitam', qty: 3, username: 'service_assurance', status: 'APPROVAL_REVIEW', offset: -2 },
        { item_name: 'Paper Clip Sedang', qty: 10, username: 'shared_service_general_support', status: 'APPROVAL_REVIEW', offset: -3 },
        { item_name: 'Binder Clip 105', qty: 5, username: 'finance_payment_collection', status: 'APPROVAL_REVIEW', offset: -4 },
        { item_name: 'Hand Sanitizer 500ml', qty: 2, username: 'customer_care_plasa', status: 'APPROVAL_REVIEW', offset: -5 }, // Stok kosong
        { item_name: 'Kertas A4 80gsm Sinar Dunia', qty: 10, username: 'pqma', status: 'APPROVAL_REVIEW', offset: -5 },

        // 18 APPROVED
        { item_name: 'Amplop Coklat Folio', qty: 50, username: 'sales_operation', status: 'APPROVED', offset: -3 },
        { item_name: 'Pulpen Hitam Standard', qty: 20, username: 'sales_operation', status: 'APPROVED', offset: -4 },
        { item_name: 'Cutter Kenko', qty: 3, username: 'network_area', status: 'APPROVED', offset: -5 },
        { item_name: 'Kabel HDMI 2 Meter', qty: 1, username: 'network_area', status: 'APPROVED', offset: -6 },
        { item_name: 'Sticky Notes 3x3 Kuning', qty: 10, username: 'service_assurance', status: 'APPROVED', offset: -7 },
        { item_name: 'Mouse Wireless Logitech', qty: 1, username: 'service_assurance', status: 'APPROVED', offset: -8 }, // Item mahal
        { item_name: 'Stapler Sedang Joyko', qty: 2, username: 'shared_service_general_support', status: 'APPROVED', offset: -10 },
        { item_name: 'Lem Kertas Cair', qty: 5, username: 'shared_service_general_support', status: 'APPROVED', offset: -11 },
        { item_name: 'Kertas A4 70gsm PaperOne', qty: 10, username: 'finance_payment_collection', status: 'APPROVED', offset: -12 },
        { item_name: 'Pulpen Biru Standard', qty: 15, username: 'finance_payment_collection', status: 'APPROVED', offset: -12 },
        { item_name: 'Map Snelhecter Plastik', qty: 20, username: 'customer_care_plasa', status: 'APPROVED', offset: -14 },
        { item_name: 'Pulpen Hitam Standard', qty: 15, username: 'customer_care_plasa', status: 'APPROVED', offset: -15 },
        { item_name: 'Tinta Printer Epson Warna', qty: 1, username: 'pqma', status: 'APPROVED', offset: -18 },
        { item_name: 'Toner Printer Brother', qty: 1, username: 'pqma', status: 'APPROVED', offset: -21 },
        { item_name: 'Isi Staples Kecil', qty: 10, username: 'shared_service_general_support', status: 'APPROVED', offset: -22 },
        { item_name: 'Baterai AAA Alkaline', qty: 15, username: 'network_area', status: 'APPROVED', offset: -25 },
        { item_name: 'Spidol Board Marker Merah', qty: 5, username: 'service_assurance', status: 'APPROVED', offset: -26 },
        { item_name: 'Ordner Besar Bantex', qty: 10, username: 'finance_payment_collection', status: 'APPROVED', offset: -28 },

        // 8 REJECTED
        { item_name: 'Mouse Wireless Logitech', qty: 5, username: 'pqma', status: 'REJECTED', reject_reason: 'Permintaan berlebihan. Stok dialokasikan untuk direksi.', offset: -5 },
        { item_name: 'Kertas A4 80gsm Sinar Dunia', qty: 50, username: 'sales_operation', status: 'REJECTED', reject_reason: 'Melebihi batas kuota bulanan unit Sales.', offset: -10 },
        { item_name: 'Ordner Besar Bantex', qty: 20, username: 'shared_service_general_support', status: 'REJECTED', reject_reason: 'Stok terbatas, mohon kurangi jumlah request.', offset: -12 },
        { item_name: 'Toner Printer Brother', qty: 3, username: 'network_area', status: 'REJECTED', reject_reason: 'Sedang menunggu pengadaan bulan depan.', offset: -15 },
        { item_name: 'Pulpen Hitam Standard', qty: 100, username: 'customer_care_plasa', status: 'REJECTED', reject_reason: 'Duplikasi request dengan nomor sebelumnya.', offset: -20 },
        { item_name: 'Headset Logitech H111', qty: 10, username: 'service_assurance', status: 'REJECTED', reject_reason: 'Hanya bisa direquest maksimal 2 unit.', offset: -22 },
        { item_name: 'Tisu Wajah 250s', qty: 20, username: 'finance_payment_collection', status: 'REJECTED', reject_reason: 'Stok tisu sedang kosong dari vendor.', offset: -24 },
        { item_name: 'Kabel LAN Cat6 5 Meter', qty: 10, username: 'network_area', status: 'REJECTED', reject_reason: 'Harap gunakan kabel rol yang sudah disediakan.', offset: -25 },
    ];

    const insertedRequests = [];
    for (const req of requestsData) {
        const item = itemMap[req.item_name];
        const user = userIdMap[req.username];
        const dept = user.name.split(' ')[0] || user.name;
        
        const [id] = await knex('requests').insert({
            date: dateStr(req.offset),
            item: req.item_name,
            atk_item_id: item.id,
            qty: req.qty,
            unit: item.satuan,
            receiver: user.name,
            dept: dept,
            status: req.status,
            reject_reason: req.reject_reason || null,
            user_id: user.id
        });
        insertedRequests.push({ id, ...req, item, user, dept });
    }
    console.log(`✅ Created ${requestsData.length} Requests (12 PENDING, 7 REVIEW, 18 APPROVED, 8 REJECTED)`);

    // ========== BARANG KELUAR ==========
    let bkCount = 0;
    for (const req of insertedRequests) {
        if (req.status === 'APPROVED') {
            await knex('barang_keluar').insert({
                request_id: req.id,
                date: dateStr(req.offset + 1),
                atk_item_id: req.item.id,
                nama_barang: req.item.nama_barang,
                kode_barang: req.item.kode_barang,
                qty: req.qty,
                satuan: req.item.satuan,
                penerima: req.user.name,
                dept: req.dept
            });
            bkCount++;
        }
    }
    console.log(`✅ Created ${bkCount} Barang Keluar records`);

    // ========== REQUEST BARANG BARU (item_requests_new) ==========
    const newItemReqs = [
        { item_name: 'Whiteboard Eraser Magnetic', desc: 'Penghapus magnetik', satuan: 'pcs', category: 'Alat Tulis', reason: 'Kebutuhan ruang rapat', status: 'PENDING', username: 'shared_service_general_support', offset: -1 },
        { item_name: 'Label Printer Tape', desc: 'Tape untuk brother', satuan: 'roll', category: 'Printer', reason: 'Untuk pelabelan arsip', status: 'PENDING', username: 'pqma', offset: -2 },
        { item_name: 'Kabel USB-C to USB-C', desc: 'Kabel charger fast charging', satuan: 'pcs', category: 'IT', reason: 'Kebutuhan operasional lapangan', status: 'PENDING', username: 'network_area', offset: -2 },
        { item_name: 'Webcam Meeting 1080p', desc: 'Logitech', satuan: 'unit', category: 'IT', reason: 'Rapat online direksi', status: 'APPROVED', qty: 2, username: 'service_assurance', offset: -10 },
        { item_name: 'Headset Call Center', desc: 'Noise cancelling', satuan: 'unit', category: 'IT', reason: 'Customer service baru', status: 'APPROVED', qty: 5, username: 'customer_care_plasa', offset: -12 },
        { item_name: 'Rak Dokumen 3 Susun', desc: 'Besi hitam', satuan: 'pcs', category: 'Perlengkapan', reason: 'Meja admin berantakan', status: 'APPROVED', qty: 3, username: 'finance_payment_collection', offset: -15 },
        { item_name: 'Mousepad RGB', desc: 'Gaming mousepad', satuan: 'pcs', category: 'IT', reason: 'Estetika meja', status: 'REJECTED', reject_reason: 'Bukan prioritas perusahaan', username: 'sales_operation', offset: -5 },
        { item_name: 'Clipboard Kayu', desc: 'Papan jalan', satuan: 'pcs', category: 'Perlengkapan', reason: 'Survey lapangan', status: 'REJECTED', reject_reason: 'Masih ada stok clipboard plastik di gudang', username: 'network_area', offset: -8 },
    ];

    for (const nr of newItemReqs) {
        const user = userIdMap[nr.username] || userIdMap['superadmin'];
        await knex('item_requests_new').insert({
            requested_by: user.id,
            item_name: nr.item_name,
            description: nr.desc,
            satuan: nr.satuan,
            category: nr.category,
            reason: nr.reason,
            status: nr.status,
            reject_reason: nr.reject_reason || null,
            approved_quantity: nr.qty || null,
            created_at: dateStr(nr.offset)
        });
    }
    console.log(`✅ Created ${newItemReqs.length} New Item Requests`);

    // ========== ANNOUNCEMENTS ==========
    await knex('announcements').insert([
        { title: 'Jadwal Pengambilan ATK', content: 'Pengambilan rutin ATK hanya dilayani setiap hari Selasa dan Kamis jam 13.00 - 15.00 WIB. Harap submit request H-1.', is_active: true, created_by: userMap['admin_general_support'], created_at: dateStr(-30) },
        { title: 'Stok Opname Akhir Bulan', content: 'Akan dilakukan stock opname pada tanggal 30. Seluruh transaksi barang keluar ditutup sementara mulai tanggal 28.', is_active: true, created_by: userMap['superadmin'], created_at: dateStr(-5) },
        { title: 'Aturan Barang Baru', content: 'Permintaan barang yang belum ada di master data wajib melampirkan alasan operasional yang mendesak.', is_active: true, created_by: userMap['admin_gudang'], created_at: dateStr(-10) }
    ]);
    console.log(`✅ Created 3 Announcements`);

    // ========== STOCK OPNAME ==========
    const [draftId] = await knex('stock_opname').insert({ opname_date: dateStr(-1), status: 'DRAFT', notes: 'Persiapan akhir bulan', created_by: userMap['admin_gudang'] });
    const [finalId] = await knex('stock_opname').insert({ opname_date: dateStr(-30), status: 'FINALIZED', notes: 'Opname bulan lalu', created_by: userMap['admin_gudang'] });

    await knex('stock_opname_items').insert([
        { opname_id: finalId, item_id: itemRows[0].id, system_qty: 252, physical_qty: 250, difference: -2, notes: 'Rusak basah' },
        { opname_id: finalId, item_id: itemRows[1].id, system_qty: 1195, physical_qty: 1200, difference: 5, notes: 'Kelebihan kirim' },
    ]);
    console.log(`✅ Created 2 Stock Opname records`);

    // ========== USER NOTIFICATIONS ==========
    await knex('user_notifications').insert([
        { user_id: userMap['sales_operation'], type: 'REQUEST_APPROVED', title: 'Request Disetujui', message: 'Permintaan ATK Anda telah disetujui.', is_read: false, created_at: dateStr(0) },
        { user_id: userMap['pqma'], type: 'REQUEST_REJECTED', title: 'Request Ditolak', message: 'Permintaan Mouse Wireless ditolak.', is_read: true, created_at: dateStr(-2) },
        { user_id: userMap['admin_gudang'], type: 'STOCK_LOW', title: 'Stok Menipis', message: 'Toner Printer HP Laserjet stok habis!', is_read: false, created_at: dateStr(0) },
    ]);
    console.log(`✅ Created 3 Notifications`);

    // ========== AUDIT LOGS ==========
    await knex('audit_logs').insert([
        { table_name: 'requests', record_id: insertedRequests[0].id, action: 'CREATE', user_id: userMap['sales_operation'], created_at: dateStr(0) },
        { table_name: 'barang_masuk', record_id: 1, action: 'CREATE', user_id: userMap['admin_gudang'], created_at: dateStr(-1) },
        { table_name: 'requests', record_id: insertedRequests[insertedRequests.length-1].id, action: 'APPROVE', user_id: userMap['superadmin'], created_at: dateStr(-5) },
    ]);
    console.log(`✅ Created 3 Audit Logs`);

    console.log('');
    console.log('🎉 Realistic Seeding Completed!');
    
    console.log('\n--- ROW COUNT AFTER SEED ---');
    for (const table of tablesToCount) {
        const result = await knex(table).count('* as count');
        console.log(`${table.padEnd(20)} : ${result[0].count}`);
    }
    console.log('-----------------------------\n');
}
