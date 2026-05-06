export async function up(knex) {
    const hasEmail = await knex.schema.hasColumn('users', 'email');
    if (!hasEmail) {
        await knex.schema.alterTable('users', (table) => {
            table.string('email', 255).nullable();
        });
    }

    const hasUserNotifications = await knex.schema.hasTable('user_notifications');
    if (!hasUserNotifications) {
        await knex.schema.createTable('user_notifications', (table) => {
            table.increments('id').unsigned().primary();
            table.integer('user_id').unsigned().notNullable();
            table.string('type', 40).notNullable();
            table.string('title', 255).notNullable();
            table.text('message').notNullable();
            table.json('payload').nullable();
            table.boolean('is_read').notNullable().defaultTo(false);
            table.datetime('created_at').defaultTo(knex.fn.now());
            table.index(['user_id', 'created_at'], 'idx_user_created');
            table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        });
    }
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('user_notifications');

    const hasEmail = await knex.schema.hasColumn('users', 'email');
    if (hasEmail) {
        await knex.schema.alterTable('users', (table) => {
            table.dropColumn('email');
        });
    }
}
