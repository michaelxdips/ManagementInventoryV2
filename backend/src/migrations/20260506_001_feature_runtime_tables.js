export async function up(knex) {
    const hasAnnouncements = await knex.schema.hasTable('announcements');
    if (!hasAnnouncements) {
        await knex.schema.createTable('announcements', (table) => {
            table.increments('id').primary();
            table.string('title', 255).notNullable();
            table.text('content').notNullable();
            table.boolean('is_active').defaultTo(true);
            table.datetime('created_at').defaultTo(knex.fn.now());
            table.integer('created_by').unsigned().nullable();
            table.foreign('created_by').references('id').inTable('users');
        });
    }

    const hasStockOpname = await knex.schema.hasTable('stock_opname');
    if (!hasStockOpname) {
        await knex.schema.createTable('stock_opname', (table) => {
            table.increments('id').primary();
            table.datetime('opname_date').defaultTo(knex.fn.now());
            table.enum('status', ['DRAFT', 'FINALIZED']).notNullable().defaultTo('DRAFT');
            table.text('notes').nullable();
            table.integer('created_by').unsigned().nullable();
            table.datetime('created_at').defaultTo(knex.fn.now());
            table.foreign('created_by').references('id').inTable('users');
        });
    }

    const hasStockOpnameItems = await knex.schema.hasTable('stock_opname_items');
    if (!hasStockOpnameItems) {
        await knex.schema.createTable('stock_opname_items', (table) => {
            table.increments('id').primary();
            table.integer('opname_id').unsigned().notNullable();
            table.integer('item_id').unsigned().notNullable();
            table.integer('system_qty').notNullable();
            table.integer('physical_qty').notNullable();
            table.integer('difference').notNullable();
            table.text('notes').nullable();
            table.foreign('opname_id').references('id').inTable('stock_opname').onDelete('CASCADE');
            table.foreign('item_id').references('id').inTable('atk_items');
        });
    }

    const hasAuditLogs = await knex.schema.hasTable('audit_logs');
    if (!hasAuditLogs) {
        await knex.schema.createTable('audit_logs', (table) => {
            table.increments('id').primary();
            table.string('table_name', 255).notNullable();
            table.integer('record_id').notNullable();
            table.enum('action', [
                'CREATE',
                'UPDATE',
                'DELETE',
                'APPROVE',
                'REJECT',
                'FINALIZE',
                'IMPORT',
                'BULK_IMPORT',
                'REVIEW',
                'READ',
            ]).notNullable();
            table.json('old_values').nullable();
            table.json('new_values').nullable();
            table.integer('user_id').unsigned().nullable();
            table.datetime('created_at').defaultTo(knex.fn.now());
            table.foreign('user_id').references('id').inTable('users');
        });
    }
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('audit_logs');
    await knex.schema.dropTableIfExists('stock_opname_items');
    await knex.schema.dropTableIfExists('stock_opname');
    await knex.schema.dropTableIfExists('announcements');
}
