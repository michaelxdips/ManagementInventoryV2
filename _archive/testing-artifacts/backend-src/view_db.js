import pool from './config/db.js';

const viewData = async () => {
    try {
        console.log('Connecting...');

        const [users] = await pool.query('SELECT id, name, username, role FROM users LIMIT 3');
        console.log('\n--- USERS ---');
        console.log(JSON.stringify(users, null, 2));

        const [reqs] = await pool.query('SELECT id, date, item, status FROM requests LIMIT 3');
        console.log('\n--- REQUESTS ---');
        console.log(JSON.stringify(reqs, null, 2));

        console.log('\n--- ATK ITEMS ---');
        const [items] = await pool.query('SELECT id, nama_barang, qty FROM atk_items LIMIT 3');
        console.log(JSON.stringify(items, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
};

viewData();
