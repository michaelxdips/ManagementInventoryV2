export async function up(knex) {
    const hasRejectReason = await knex.schema.hasColumn('requests', 'reject_reason');
    if (!hasRejectReason) {
        await knex.schema.alterTable('requests', (table) => {
            table.string('reject_reason', 500).nullable();
        });
    }

    // Existing production databases may still have barang_keluar.atk_item_id as NOT NULL.
    // Keep this nullable so item deletion cleanup can preserve historical outgoing records.
    await knex.schema.alterTable('barang_keluar', (table) => {
        table.integer('atk_item_id').unsigned().nullable().alter();
    });
}

export async function down(knex) {
    const hasRejectReason = await knex.schema.hasColumn('requests', 'reject_reason');
    if (hasRejectReason) {
        await knex.schema.alterTable('requests', (table) => {
            table.dropColumn('reject_reason');
        });
    }

    await knex.schema.alterTable('barang_keluar', (table) => {
        table.integer('atk_item_id').unsigned().notNullable().alter();
    });
}
