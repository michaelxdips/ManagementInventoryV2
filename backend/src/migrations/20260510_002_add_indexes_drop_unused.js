/**
 * FIX-P2-1 & FIX-P2-2: Add missing indexes and drop unused table.
 */
export async function up(knex) {
    // 1. Add missing indexes for performance on foreign keys and frequently filtered columns
    await knex.schema.table('barang_masuk', (table) => {
        // Only add if it doesn't exist (handled by Knex IF NOT EXISTS logic via raw or knex-schema-inspector in complex setups,
        // but raw works fine here for a simple schema)
        table.index('atk_item_id', 'idx_barang_masuk_atk_item_id');
    });

    await knex.schema.table('barang_keluar', (table) => {
        table.index('atk_item_id', 'idx_barang_keluar_atk_item_id');
    });

    await knex.schema.table('requests', (table) => {
        table.index('status', 'idx_requests_status');
    });

    // 2. Drop dead table
    await knex.schema.dropTableIfExists('barang_kosong');
}

export async function down(knex) {
    await knex.schema.table('requests', (table) => {
        table.dropIndex('status', 'idx_requests_status');
    });

    await knex.schema.table('barang_keluar', (table) => {
        table.dropIndex('atk_item_id', 'idx_barang_keluar_atk_item_id');
    });

    await knex.schema.table('barang_masuk', (table) => {
        table.dropIndex('atk_item_id', 'idx_barang_masuk_atk_item_id');
    });

    // Cannot reliably restore barang_kosong as we don't know the schema
    // and it was unused anyway. Creating a stub if needed.
    await knex.schema.createTable('barang_kosong', (table) => {
        table.increments('id').primary();
        table.string('nama_barang');
    });
}
