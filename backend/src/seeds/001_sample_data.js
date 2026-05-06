/**
 * Seed: Sample Data
 * 
 * Run with: npx knex seed:run
 * WARNING: This will DELETE all existing data before inserting fresh sample data.
 * Only use for development/testing, NOT in production.
 */

import bcrypt from 'bcryptjs';

export async function seed(knex) {
    console.log('🌱 Seeding sample data...');

    // Clear existing data (reverse dependency order)
    await knex('barang_keluar').del();
    await knex('barang_masuk').del();
    await knex('requests').del();
    await knex('item_requests_new').del();
    await knex('barang_kosong').del();
    await knex('atk_items').del();
    await knex('users').del();

    // ========== USERS ==========
    const users = [
        { name: 'Super Admin', username: 'superadmin', password: 'admin123', role: 'superadmin' },
        { name: 'Admin 1', username: 'admin1', password: 'admin123', role: 'admin' },
        { name: 'Admin 2', username: 'admin2', password: 'admin123', role: 'admin' },
        { name: 'Share Service & General Support', username: 'ssgs', password: 'user123', role: 'user' },
        { name: 'Performance, Risk & QOS', username: 'prq', password: 'user123', role: 'user' },
        { name: 'Finance', username: 'finance', password: 'user123', role: 'user' },
        { name: 'IT Support', username: 'itsupport', password: 'user123', role: 'user' },
        { name: 'Lgs', username: 'lgs', password: 'user123', role: 'user' },
        { name: 'bs', username: 'bs', password: 'user123', role: 'user' },
        { name: 'pai', username: 'pai', password: 'user123', role: 'user' },
    ];

    for (const u of users) {
        const hash = bcrypt.hashSync(u.password, 10);
        await knex('users').insert({
            name: u.name,
            username: u.username,
            password_hash: hash,
            role: u.role,
        });
    }
    console.log(`✅ Created ${users.length} users`);

    // ========== ATK ITEMS ==========
    const items = [
        { nama_barang: '3M Double Tape Abu-Abu', kode_barang: '3M-DTP-GRY', qty: 15, satuan: 'pcs', lokasi_simpan: 'Lemari A1' },
        { nama_barang: 'Amplop Coklat 110x240', kode_barang: 'APP-BRW-110', qty: 200, satuan: 'pack', lokasi_simpan: 'Lemari A1' },
        { nama_barang: 'Amplop Coklat 140x270', kode_barang: 'APP-BRW-140', qty: 1001, satuan: 'pack', lokasi_simpan: 'Lemari A1' },
        { nama_barang: 'Amplop Polos Coklat', kode_barang: 'APP-PLS-BRW', qty: 190, satuan: 'pcs', lokasi_simpan: 'Lemari A2' },
        { nama_barang: 'Amplop Telkom Polos', kode_barang: 'APP-TLM-CLS', qty: 20, satuan: 'bungkus', lokasi_simpan: 'Lemari A2' },
        { nama_barang: 'Amplop Telkom Jendela', kode_barang: 'APP-TLM-JDL', qty: 11, satuan: 'bundle', lokasi_simpan: 'Lemari A2' },
        { nama_barang: 'Bola Golf', kode_barang: 'BAL-GLF', qty: 3, satuan: 'kotak', lokasi_simpan: 'Lemari B1' },
        { nama_barang: 'Ball Liner Biru', kode_barang: 'BAL-LNR-BLU', qty: 109, satuan: 'pcs', lokasi_simpan: 'Lemari B1' },
        { nama_barang: 'Ball Liner Hijau', kode_barang: 'BAL-LNR-HJU', qty: 2, satuan: 'pcs', lokasi_simpan: 'Lemari B1' },
        { nama_barang: 'Ball Liner Hitam', kode_barang: 'BAL-LNR-HTM', qty: 19, satuan: 'pcs', lokasi_simpan: 'Lemari B1' },
        { nama_barang: 'Baterai AA', kode_barang: 'BTR-A2', qty: 48, satuan: 'pcs', lokasi_simpan: 'Lemari B2' },
        { nama_barang: 'Baterai AAA', kode_barang: 'BTR-A3', qty: 36, satuan: 'pcs', lokasi_simpan: 'Lemari B2' },
        { nama_barang: 'kertas paper one A4', kode_barang: 'PPR-ONE-A4', qty: 50, satuan: 'rim', lokasi_simpan: 'Gudang' },
        { nama_barang: 'Map Bening Dataflex', kode_barang: 'MAP-CLS-DTX', qty: 0, satuan: 'pcs', lokasi_simpan: 'Lemari C1' },
        { nama_barang: 'Folder One Transparent', kode_barang: 'FDR-ONE-TPR', qty: 120, satuan: 'pcs', lokasi_simpan: 'Lemari C1' },
        { nama_barang: 'Gunting Besar Joyko', kode_barang: 'GTG-BIG-JYO', qty: 5, satuan: 'pcs', lokasi_simpan: 'Lemari C2' },
        { nama_barang: 'Gunting Kecil', kode_barang: 'GK01', qty: 8, satuan: 'pcs', lokasi_simpan: 'Lemari C2' },
        { nama_barang: 'Pilot Hitam', kode_barang: 'PLT-HTM', qty: 45, satuan: 'pcs', lokasi_simpan: 'Lemari D1' },
        { nama_barang: 'Pilot Biru', kode_barang: 'PLT-BLU', qty: 38, satuan: 'pcs', lokasi_simpan: 'Lemari D1' },
        { nama_barang: 'Lakban Hijau Besar', kode_barang: 'SLS-HJU-BIG', qty: 0, satuan: 'pcs', lokasi_simpan: 'Lemari D2' },
        { nama_barang: 'Label Tom & Jerry No.121', kode_barang: 'LBL-TNJ-121', qty: 25, satuan: 'bungkus', lokasi_simpan: 'Lemari D2' },
        { nama_barang: 'Snowman Whiteboard Marker Non Permanent Merah', kode_barang: 'SNO-NON-RED', qty: 12, satuan: 'pcs', lokasi_simpan: 'Lemari E1' },
        { nama_barang: 'Staples Kecil', kode_barang: 'STP-KCL', qty: 0, satuan: 'kotak', lokasi_simpan: 'Lemari E1' },
        { nama_barang: 'Lem Kertas UHU', kode_barang: 'LEM-UHU', qty: 18, satuan: 'pcs', lokasi_simpan: 'Lemari E2' },
    ];

    for (const item of items) {
        await knex('atk_items').insert(item);
        if (item.qty === 0) {
            await knex('barang_kosong').insert({
                name: item.nama_barang,
                code: item.kode_barang,
                location: item.lokasi_simpan,
            });
        }
    }
    console.log(`✅ Created ${items.length} ATK items`);

    // Get user ID map
    const userRows = await knex('users').select('id', 'username');
    const userMap = {};
    userRows.forEach((u) => (userMap[u.username] = u.id));

    // Get item ID map
    const itemRows = await knex('atk_items').select('id', 'nama_barang');
    const itemMap = {};
    itemRows.forEach((i) => (itemMap[i.nama_barang] = i.id));

    // ========== REQUESTS ==========
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
        await knex('requests').insert({
            date: req.date,
            item: req.item,
            qty: req.qty,
            unit: req.unit,
            receiver: req.receiver,
            dept: req.dept,
            status: req.status,
            user_id: userMap[req.username],
        });
    }
    console.log(`✅ Created ${reqData.length} requests`);

    // ========== BARANG MASUK ==========
    const barangMasuk = [
        { date: '2026-01-15', nama: 'Snowman Whiteboard Marker Non Permanent Merah', kode: 'SNO-NON-RED', qty: 10, satuan: 'pcs', pic: 'Super Admin' },
        { date: '2026-01-02', nama: 'Map Bening Dataflex', kode: 'MAP-CLS-DTX', qty: 120, satuan: 'pcs', pic: 'Admin 1' },
        { date: '2026-01-02', nama: 'Folder One Transparent', kode: 'FDR-ONE-TPR', qty: 240, satuan: 'pcs', pic: 'Admin 1' },
        { date: '2026-01-02', nama: 'Amplop Coklat 140x270', kode: 'APP-BRW-140', qty: 1000, satuan: 'pcs', pic: 'Admin 1' },
        { date: '2025-12-02', nama: 'Baterai AA', kode: 'BTR-A2', qty: 70, satuan: 'pcs', pic: 'Admin 1' },
        { date: '2025-12-01', nama: 'kertas paper one A4', kode: 'PPR-ONE-A4', qty: 29, satuan: 'rim', pic: 'Admin 2' },
    ];

    for (const bm of barangMasuk) {
        await knex('barang_masuk').insert({
            date: bm.date,
            atk_item_id: itemMap[bm.nama] || null,
            nama_barang: bm.nama,
            kode_barang: bm.kode,
            qty: bm.qty,
            satuan: bm.satuan,
            pic: bm.pic,
        });
    }
    console.log(`✅ Created ${barangMasuk.length} barang masuk records`);

    // ========== BARANG KELUAR ==========
    const barangKeluar = [
        { date: '2026-01-20', nama: 'Pilot Hitam', kode: 'PLT-HTM', qty: 2, satuan: 'pcs', penerima: 'Eti', dept: 'Share Service & General Support' },
        { date: '2026-01-18', nama: 'kertas paper one A4', kode: 'PPR-ONE-A4', qty: 3, satuan: 'rim', penerima: 'Wulan', dept: 'Share Service & General Support' },
        { date: '2026-01-15', nama: 'Baterai AA', kode: 'BTR-A2', qty: 4, satuan: 'pcs', penerima: 'Akbar', dept: 'IT Support' },
    ];

    for (const bk of barangKeluar) {
        const itemId = itemMap[bk.nama];
        if (itemId) {
            await knex('barang_keluar').insert({
                date: bk.date,
                atk_item_id: itemId,
                nama_barang: bk.nama,
                kode_barang: bk.kode,
                qty: bk.qty,
                satuan: bk.satuan,
                penerima: bk.penerima,
                dept: bk.dept,
            });
        }
    }
    console.log(`✅ Created ${barangKeluar.length} barang keluar records`);

    console.log('');
    console.log('🎉 Seeding completed!');
    console.log('');
    console.log('📋 Default credentials:');
    console.log('   Superadmin: superadmin / admin123');
    console.log('   Admin:      admin1 / admin123');
    console.log('   User:       ssgs / user123');
}
