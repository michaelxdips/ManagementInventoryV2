import request from 'supertest';
import app from './src/index.js'; // Adjust path if needed
import pool from './src/config/db.js';

async function runTest() {
    console.log('🚀 Starting Qty Validation Test...');
    
    // 1. Get tokens
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'sales_operation', password: 'password_demo' });
    console.log('Login res:', loginRes.body);
    const userToken = loginRes.body.token;

    const basePayload = {
        date: '2026-06-04',
        item: 'Amplop Coklat Folio',
        unit: 'pcs',
        receiver: 'Test Qty',
        dept: 'Sales & Operation (Consumer/Enterprise)'
    };

    const testCases = [
        { desc: 'qty: "abc"', qty: 'abc', expected: 400 },
        { desc: 'qty: ""', qty: '', expected: 400 },
        { desc: 'qty: null', qty: null, expected: 400 },
        { desc: 'qty: 0', qty: 0, expected: 400 },
        { desc: 'qty: -1', qty: -1, expected: 400 },
        { desc: 'qty: 1.5', qty: 1.5, expected: 400 },
        { desc: 'qty: "3"', qty: "3", expected: 201 },
        { desc: 'qty: 3', qty: 3, expected: 201 },
    ];

    let passed = 0;
    for (const tc of testCases) {
        const payload = { ...basePayload, qty: tc.qty };
        const res = await request(app).post('/api/requests').set('Authorization', `Bearer ${userToken}`).send(payload);
        
        if (res.status === tc.expected) {
            console.log(`✅ PASS: ${tc.desc} (Expected ${tc.expected}, Got ${res.status})`);
            passed++;
        } else {
            console.log(`❌ FAIL: ${tc.desc} (Expected ${tc.expected}, Got ${res.status}) | Msg: ${res.body.message || res.status}`);
        }
    }

    console.log(`\n--- TEST SUMMARY ---`);
    console.log(`Total: ${testCases.length} | Passed: ${passed} | Failed: ${testCases.length - passed}`);
    process.exit(passed === testCases.length ? 0 : 1);
}

runTest().catch(err => {
    console.error('Test crashed:', err);
    process.exit(1);
});
