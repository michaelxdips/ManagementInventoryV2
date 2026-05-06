export const up = async (knex) => {
    // Add min_stock column with a default of 5 for low stock alerts
    await knex.schema.alterTable('atk_items', (table) => {
        table.integer('min_stock').unsigned().notNullable().defaultTo(5);
    });
};

export const down = async (knex) => {
    await knex.schema.alterTable('atk_items', (table) => {
        table.dropColumn('min_stock');
    });
};
