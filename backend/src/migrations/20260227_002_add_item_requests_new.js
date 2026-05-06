/**
 * Migration 002 — Add Item Requests New table
 * DOMAIN: Inventory Creation (separate from Ambil Barang)
 * 
 * Creates the item_requests_new table for requesting brand-new items
 * that don't yet exist in the inventory.
 */

export async function up(knex) {
    await knex.schema.createTable('item_requests_new', (t) => {
        t.increments('id').primary();
        t.integer('requested_by').unsigned().notNullable();
        t.string('item_name', 255).notNullable();
        t.text('description').nullable();
        t.string('satuan', 50).nullable();
        t.string('category', 255).nullable();
        t.text('reason').nullable();
        t.enum('status', ['PENDING', 'APPROVED', 'REJECTED']).notNullable().defaultTo('PENDING');
        t.integer('approved_by').unsigned().nullable();
        t.integer('approved_quantity').nullable();
        t.string('reject_reason', 500).nullable();
        t.datetime('created_at').defaultTo(knex.fn.now());
        t.datetime('updated_at').defaultTo(knex.fn.now());
        t.foreign('requested_by').references('id').inTable('users');
        t.foreign('approved_by').references('id').inTable('users');
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('item_requests_new');
}
