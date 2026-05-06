export async function up(knex) {
    const hasRequestId = await knex.schema.hasColumn('barang_keluar', 'request_id');
    if (!hasRequestId) {
        await knex.schema.alterTable('barang_keluar', (table) => {
            table.integer('request_id').unsigned().nullable();
            table.foreign('request_id').references('id').inTable('requests').onDelete('SET NULL');
        });
    }
}

export async function down(knex) {
    const hasRequestId = await knex.schema.hasColumn('barang_keluar', 'request_id');
    if (hasRequestId) {
        await knex.schema.alterTable('barang_keluar', (table) => {
            table.dropForeign(['request_id']);
            table.dropColumn('request_id');
        });
    }
}
