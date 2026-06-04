import Knex from 'knex';
import config from '../knexfile.js';

const knex = Knex(config.development);

async function checkIntegrity() {
    let success = true;
    console.log('--- STARTING INTEGRITY CHECKS ---');

    // 1. no negative stock
    const negativeStock = await knex('atk_items').where('qty', '<', 0);
    console.log('[CHECK] No negative stock:', negativeStock.length === 0 ? '✅ PASS' : `❌ FAIL (${negativeStock.length} items found)`);
    if (negativeStock.length > 0) success = false;

    // 2. no orphan request user
    const orphanUsers = await knex('requests')
        .leftJoin('users', 'requests.user_id', 'users.id')
        .whereNull('users.id');
    console.log('[CHECK] No orphan request user:', orphanUsers.length === 0 ? '✅ PASS' : `❌ FAIL (${orphanUsers.length} requests found)`);
    if (orphanUsers.length > 0) success = false;

    // 3. no orphan request item
    const orphanItems = await knex('requests')
        .leftJoin('atk_items', 'requests.atk_item_id', 'atk_items.id')
        .whereNotNull('requests.atk_item_id')
        .whereNull('atk_items.id');
    console.log('[CHECK] No orphan request item:', orphanItems.length === 0 ? '✅ PASS' : `❌ FAIL (${orphanItems.length} requests found)`);
    if (orphanItems.length > 0) success = false;

    // 4. no duplicate item code
    const duplicateCodes = await knex('atk_items')
        .select('kode_barang')
        .whereNotNull('kode_barang')
        .groupBy('kode_barang')
        .havingRaw('COUNT(kode_barang) > 1');
    console.log('[CHECK] No duplicate item code:', duplicateCodes.length === 0 ? '✅ PASS' : `❌ FAIL (${duplicateCodes.length} duplicates found)`);
    if (duplicateCodes.length > 0) success = false;

    // 5. all APPROVED requests have barang_keluar
    const missingKeluar = await knex('requests')
        .leftJoin('barang_keluar', 'requests.id', 'barang_keluar.request_id')
        .where('requests.status', 'APPROVED')
        .whereNull('barang_keluar.id');
    console.log('[CHECK] All APPROVED requests have barang_keluar:', missingKeluar.length === 0 ? '✅ PASS' : `❌ FAIL (${missingKeluar.length} missing)`);
    if (missingKeluar.length > 0) success = false;

    // 6. status values valid
    const validStatuses = ['PENDING', 'APPROVAL_REVIEW', 'APPROVED', 'REJECTED', 'FINISHED']; // Finished might not be used here, but valid
    const invalidStatusReq = await knex('requests').whereNotIn('status', validStatuses);
    console.log('[CHECK] Status values valid in requests:', invalidStatusReq.length === 0 ? '✅ PASS' : `❌ FAIL (${invalidStatusReq.length} invalid)`);
    if (invalidStatusReq.length > 0) success = false;

    console.log('--- INTEGRITY CHECKS COMPLETE ---');
    if (!success) {
        process.exit(1);
    }
    process.exit(0);
}

checkIntegrity().catch(err => {
    console.error('Integrity check error:', err);
    process.exit(1);
});
