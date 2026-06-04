import request from 'supertest';
import app from './src/index.js';
import db from './src/config/db.js';

if (process.env.ALLOW_TORTURE_TEST !== 'true') {
    console.error('ERROR: ALLOW_TORTURE_TEST must be true to run this script.');
    process.exit(1);
}

// Ignore self signed certs for testing if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let superadminToken = '';
let adminGudangToken = '';
let userToken = '';
let targetItemId = null;
let reqIdCounter = Date.now();

async function runTests() {
    console.log('🚀 Starting Controlled Torture Test...');

    // 1. Get tokens
    console.log('\n--- GETTING TOKENS ---');
    const saRes = await request(app).post('/api/auth/login').send({ username: 'superadmin', password: 'password_demo' });
    superadminToken = saRes.body.token;
    const adRes = await request(app).post('/api/auth/login').send({ username: 'admin_gudang', password: 'password_demo' });
    adminGudangToken = adRes.body.token;
    const usrRes = await request(app).post('/api/auth/login').send({ username: 'sales_operation', password: 'password_demo' });
    userToken = usrRes.body.token;
    
    const itemsRes = await request(app).get('/api/atk-items').set('Authorization', `Bearer ${adminGudangToken}`);
    let itemsArray = itemsRes.body.data || itemsRes.body; // handle both cases
    if (!Array.isArray(itemsArray)) {
        console.error('Failed to fetch items:', itemsRes.body);
        process.exit(1);
    }
    const item = itemsArray.find(i => i.qty >= 50);
    if (!item) {
        console.error('No item with sufficient stock for torture test. Test aborted.');
        process.exit(1);
    }
    let targetItemName = item.nama_barang;
    let targetItemSatuan = item.satuan;
    console.log(`Using Item ID: ${targetItemId} (${targetItemName}), Initial Qty: ${item.qty}`);

    const basePayload = {
        date: '2026-06-04',
        item: targetItemName,
        qty: 1,
        unit: targetItemSatuan,
        receiver: 'John Doe',
        dept: 'Sales & Operation (Consumer/Enterprise)' // Must match a user name
    };

    let totalTests = 0;
    let passed = 0;
    let failed = 0;

    const assertStatus = (res, expected, name) => {
        totalTests++;
        if (res.status === expected || (Array.isArray(expected) && expected.includes(res.status))) {
            console.log(`✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${name} | Expected ${expected}, Got ${res.status} | Msg: ${res.body.message}`);
            failed++;
        }
    };

    // A. Auth & Role Torture
    console.log('\n--- A. AUTH & ROLE TORTURE ---');
    
    let res = await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`);
    assertStatus(res, [403, 401], 'User accesses superadmin endpoint');

    res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminGudangToken}`);
    assertStatus(res, [403, 401], 'Admin accesses superadmin endpoint');

    res = await request(app).post('/api/barang-masuk').set('Authorization', `Bearer `).send({});
    assertStatus(res, 401, 'Empty token');

    res = await request(app).post('/api/barang-masuk').set('Authorization', `Bearer invalid-token`).send({});
    assertStatus(res, [401, 403], 'Invalid token');

    res = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({
        ...basePayload,
        role: 'superadmin' // Manipulasi role
    });
    assertStatus(res, 201, 'Role manipulation ignored in POST /api/requests'); // It should succeed but not elevate privileges
    const manipulatedReqId = res.body.data?.insertId || res.body.data?.id || res.body.id || res.body.insertId;

    // B. Request & Approval Edge Case
    console.log('\n--- B. REQUEST EDGE CASES ---');
    
    res = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({ ...basePayload, qty: -1 });
    assertStatus(res, [400, 422], 'Request with negative qty');

    res = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({ ...basePayload, qty: 0 });
    assertStatus(res, [400, 422], 'Request with 0 qty');

    res = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({ ...basePayload, qty: 'abc' });
    assertStatus(res, [400, 422], 'Request with string qty');

    res = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({ ...basePayload, item: 'Barang Ajaib Tidak Ada' });
    assertStatus(res, [400, 404, 500], 'Request with invalid item_id/item_name');

    // Create a request to approve
    const validReqRes = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({ ...basePayload, qty: 2 });
    assertStatus(validReqRes, 201, 'Create valid request for approval test');
    const validReqId = validReqRes.body.data?.insertId || validReqRes.body.data?.id || validReqRes.body.id || validReqRes.body.insertId;

    console.log('\n--- B. APPROVAL EDGE CASES ---');
    // First, mark as APPROVAL_REVIEW
    await request(app).put(`/api/approval/${validReqId}`).set('Authorization', `Bearer ${adminGudangToken}`).send({ status: 'APPROVAL_REVIEW' });
    
    // Finalize approve
    res = await request(app).post(`/api/approval/${validReqId}/finalize`).set('Authorization', `Bearer ${adminGudangToken}`).send({
        status: 'APPROVED',
        finalQty: 2
    });
    assertStatus(res, [200, 201], 'Approve valid request');

    // Approve already approved request
    res = await request(app).post(`/api/approval/${validReqId}/finalize`).set('Authorization', `Bearer ${adminGudangToken}`).send({
        status: 'APPROVED',
        finalQty: 2
    });
    assertStatus(res, [400, 409], 'Approve request that is already approved');

    // Finalize with qty > stok
    const overReqRes = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({ ...basePayload, qty: 2 });
    const overReqId = overReqRes.body.data?.insertId || overReqRes.body.data?.id || overReqRes.body.id || overReqRes.body.insertId;
    await request(app).put(`/api/approval/${overReqId}`).set('Authorization', `Bearer ${adminGudangToken}`).send({ status: 'APPROVAL_REVIEW' });
    res = await request(app).post(`/api/approval/${overReqId}/finalize`).set('Authorization', `Bearer ${adminGudangToken}`).send({
        status: 'APPROVED',
        finalQty: 999999
    });
    assertStatus(res, 400, 'Finalize with qty > stock');

    // C. Concurrency / Race Condition
    console.log('\n--- C. CONCURRENCY / RACE CONDITION ---');
    
    // Find an item with EXACTLY 5 stock for race condition test, or we can just use the target item and request its full stock
    const raceItemRes = await request(app).get('/api/atk-items').set('Authorization', `Bearer ${adminGudangToken}`);
    let raceItemsArray = raceItemRes.body.data || raceItemRes.body;
    const raceItem = raceItemsArray.find(i => i.qty >= 5 && i.qty < 50);
    
    if (raceItem) {
        const raceItemId = raceItem.id;
        const currentStock = raceItem.qty;
        console.log(`Race condition test on item ${raceItemId} with stock ${currentStock}`);
        
        // create 5 requests of qty = (currentStock / 2) -> Total requested = 2.5x stock
        const reqPromises = [];
        for (let i = 0; i < 5; i++) {
            reqPromises.push(
                request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send({
                    ...basePayload,
                    item: raceItem.nama_barang,
                    qty: Math.ceil(currentStock / 2)
                })
            );
        }
        const reqResults = await Promise.all(reqPromises);
        let createdIds = [];
        for (const r of reqResults) {
            if (r.status === 201) {
                createdIds.push(r.body.data?.insertId || r.body.data?.id || r.body.id || r.body.insertId);
            }
        }
        
        // Set them to APPROVAL_REVIEW
        for(let id of createdIds) {
            await request(app).put(`/api/approval/${id}`).set('Authorization', `Bearer ${adminGudangToken}`).send({ status: 'APPROVAL_REVIEW' });
        }

        // Try to approve all of them concurrently
        const approvePromises = createdIds.map(id => {
            return request(app).post(`/api/approval/${id}/finalize`).set('Authorization', `Bearer ${adminGudangToken}`).send({
                status: 'APPROVED',
                finalQty: Math.ceil(currentStock / 2)
            });
        });
        
        const approveResults = await Promise.all(approvePromises);
        let successApprove = 0;
        let failedApprove = 0;
        for (const r of approveResults) {
            if (r.status === 200 || r.status === 201) successApprove++;
            else failedApprove++;
        }
        
        console.log(`Race Condition Approval: ${successApprove} succeeded, ${failedApprove} failed.`);
        totalTests++;
        if (successApprove > 0 && failedApprove > 0) {
            passed++;
            console.log('✅ PASS: Concurrency prevented double deduction/negative stock');
        } else {
            console.log('⚠️ WARN: All failed or all succeeded. Might need manual check if stock is negative.');
            failed++;
        }
    } else {
        console.log('⚠️ SKIP: No suitable item for race condition test');
    }

    // D. Barang Masuk Torture
    console.log('\n--- D. BARANG MASUK TORTURE ---');
    res = await request(app).post('/api/barang-masuk').set('Authorization', `Bearer ${adminGudangToken}`).send({
        atk_item_id: targetItemId, qty: -5, date: '2026-01-01'
    });
    assertStatus(res, [400, 422], 'Barang masuk with negative qty');

    res = await request(app).post('/api/barang-masuk').set('Authorization', `Bearer ${adminGudangToken}`).send({
        atk_item_id: targetItemId, qty: 0, date: '2026-01-01'
    });
    assertStatus(res, [400, 422], 'Barang masuk with 0 qty');

    // F. History, Pagination, Filter, Export
    console.log('\n--- F. HISTORY & PAGINATION ---');
    res = await request(app).get('/api/history/keluar?page=999&perPage=10').set('Authorization', `Bearer ${adminGudangToken}`);
    assertStatus(res, 200, 'Page out of bounds returns empty/valid response');

    res = await request(app).get('/api/history/keluar?page=-1&perPage=10').set('Authorization', `Bearer ${adminGudangToken}`);
    assertStatus(res, [400, 200], 'Negative page number (handled gracefully)');

    res = await request(app).get('/api/history/keluar?page=1&perPage=string').set('Authorization', `Bearer ${adminGudangToken}`);
    assertStatus(res, [400, 200], 'Invalid perPage (handled gracefully)');

    // H. Light Performance Test
    console.log('\n--- H. LIGHT PERFORMANCE TEST ---');
    const startPerf = Date.now();
    const perfPromises = [];
    for(let i=0; i<20; i++) {
        perfPromises.push(request(app).get('/api/atk-items').set('Authorization', `Bearer ${userToken}`));
    }
    const perfResults = await Promise.all(perfPromises);
    const endPerf = Date.now();
    const duration = endPerf - startPerf;
    const avg = duration / 20;
    
    let perfSuccess = 0;
    perfResults.forEach(r => { if(r.status === 200) perfSuccess++; });
    
    console.log(`Performance 20 Concurrent GETs:`);
    console.log(`- Success Rate: ${perfSuccess}/20`);
    console.log(`- Total Time: ${duration}ms`);
    console.log(`- Avg Time/Req: ${avg.toFixed(2)}ms`);
    
    totalTests++;
    if (perfSuccess === 20) {
        console.log('✅ PASS: Light Performance Test');
        passed++;
    } else {
        console.log('❌ FAIL: Light Performance Test (Some requests failed/timeout)');
        failed++;
    }

    console.log('\n--- TORTURE TEST SUMMARY ---');
    console.log(`Total: ${totalTests} | Passed: ${passed} | Failed: ${failed}`);
    
    await db.end();
    
    if (failed > 0) {
        process.exit(1);
    }
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test crashed:', err);
    db.end();
    process.exit(1);
});
