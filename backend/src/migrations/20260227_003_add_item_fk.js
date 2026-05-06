export const up = async (knex) => {
    // 1. Add the column (allowing null temporarily to safely migrate existing data)
    await knex.schema.alterTable('requests', (table) => {
        table.integer('atk_item_id').unsigned().nullable();
        table.foreign('atk_item_id').references('id').inTable('atk_items').onDelete('SET NULL');
    });

    // 2. Backfill the existing data
    // Match by exact case-insensitive string just like the current old behavior
    await knex.raw(`
        UPDATE requests r
        JOIN atk_items a ON LOWER(r.item) = LOWER(a.nama_barang)
        SET r.atk_item_id = a.id
    `);

    // We do NOT enforce NOT NULL yet, because there might be "Yatim Piatu" records 
    // where the user completely deleted the item from atk_items in the past,
    // and those old requests still need to exist with just the string name.
};

export const down = async (knex) => {
    await knex.schema.alterTable('requests', (table) => {
        table.dropForeign('atk_item_id');
        table.dropColumn('atk_item_id');
    });
};
