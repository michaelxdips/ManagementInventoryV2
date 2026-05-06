export async function up(knex) {
    await knex.schema.dropTableIfExists('unit_quota');
}

export async function down() {
    // unit_quota is a removed legacy feature. Intentionally no-op on rollback.
}
