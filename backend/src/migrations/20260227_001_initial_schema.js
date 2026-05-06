/**
 * Migration 001 — Initial Schema
 * Creates all base tables for the inventory management system.
 * 
 * Tables: users, atk_items, requests, barang_masuk, barang_keluar,
 *         barang_kosong (unit_quota removed — lihat migrasi drop terpisah jika DB lama)
 */

export async function up(knex) {
    // Drop existing tables from old seed.js (one-time transition to Knex migrations)
    // Order matters: drop dependent tables first
    await knex.schema.dropTableIfExists('unit_quota');
    await knex.schema.dropTableIfExists('item_requests_new');
    await knex.schema.dropTableIfExists('barang_kosong');
    await knex.schema.dropTableIfExists('barang_keluar');
    await knex.schema.dropTableIfExists('barang_masuk');
    await knex.schema.dropTableIfExists('requests');
    await knex.schema.dropTableIfExists('atk_items');
    await knex.schema.dropTableIfExists('users');

    // 1. Users
    await knex.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('name', 255).notNullable();
        t.string('username', 255).notNullable().unique();
        t.string('password_hash', 255).notNullable();
        t.enum('role', ['admin', 'superadmin', 'user']).notNullable().defaultTo('user');
        t.datetime('created_at').defaultTo(knex.fn.now());
    });

    // 2. ATK Items
    await knex.schema.createTable('atk_items', (t) => {
        t.increments('id').primary();
        t.string('nama_barang', 255).notNullable().unique();
        t.string('kode_barang', 255).nullable();
        t.integer('qty').notNullable().defaultTo(0);
        t.string('satuan', 50).notNullable();
        t.string('lokasi_simpan', 255).nullable();
        t.datetime('created_at').defaultTo(knex.fn.now());
    });

    // 3. Requests (Ambil Barang)
    await knex.schema.createTable('requests', (t) => {
        t.increments('id').primary();
        t.date('date').notNullable();
        t.string('item', 255).notNullable();
        t.integer('qty').notNullable();
        t.string('unit', 50).notNullable();
        t.string('receiver', 255).notNullable();
        t.string('dept', 255).notNullable();
        t.enum('status', ['PENDING', 'APPROVAL_REVIEW', 'APPROVED', 'REJECTED', 'FINISHED'])
            .notNullable().defaultTo('PENDING');
        t.integer('user_id').unsigned().nullable();
        t.datetime('created_at').defaultTo(knex.fn.now());
        t.foreign('user_id').references('id').inTable('users');
    });

    // 4. Barang Masuk
    await knex.schema.createTable('barang_masuk', (t) => {
        t.increments('id').primary();
        t.date('date').notNullable();
        t.integer('atk_item_id').unsigned().nullable();
        t.string('nama_barang', 255).notNullable();
        t.string('kode_barang', 255).nullable();
        t.integer('qty').notNullable();
        t.string('satuan', 50).notNullable();
        t.string('lokasi_simpan', 255).nullable();
        t.string('pic', 255).nullable();
        t.integer('request_id').unsigned().nullable();
        t.datetime('created_at').defaultTo(knex.fn.now());
        t.foreign('atk_item_id').references('id').inTable('atk_items');
        t.foreign('request_id').references('id').inTable('requests');
    });

    // 5. Barang Keluar
    await knex.schema.createTable('barang_keluar', (t) => {
        t.increments('id').primary();
        t.date('date').notNullable();
        t.integer('atk_item_id').unsigned().notNullable();
        t.string('nama_barang', 255).notNullable();
        t.string('kode_barang', 255).nullable();
        t.integer('qty').notNullable();
        t.string('satuan', 50).notNullable();
        t.string('penerima', 255).notNullable();
        t.string('dept', 255).nullable();
        t.integer('request_id').unsigned().nullable();
        t.datetime('created_at').defaultTo(knex.fn.now());
        t.foreign('atk_item_id').references('id').inTable('atk_items');
        t.foreign('request_id').references('id').inTable('requests').onDelete('SET NULL');
    });

    // 6. Barang Kosong
    await knex.schema.createTable('barang_kosong', (t) => {
        t.increments('id').primary();
        t.string('name', 255).notNullable();
        t.string('code', 255).nullable();
        t.string('location', 255).nullable();
        t.datetime('created_at').defaultTo(knex.fn.now());
    });

}

export async function down(knex) {
    // Drop in reverse dependency order
    await knex.schema.dropTableIfExists('barang_kosong');
    await knex.schema.dropTableIfExists('barang_keluar');
    await knex.schema.dropTableIfExists('barang_masuk');
    await knex.schema.dropTableIfExists('requests');
    await knex.schema.dropTableIfExists('atk_items');
    await knex.schema.dropTableIfExists('users');
}
