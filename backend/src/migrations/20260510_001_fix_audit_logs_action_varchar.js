/**
 * FIX-P0-1: Change audit_logs.action from ENUM to VARCHAR(100).
 *
 * The codebase writes 15+ action values (MARK_APPROVAL_REVIEW, FINALIZE_APPROVAL,
 * UPDATE_STOCK_OUT, CREATE_UNIT, DELETE_UNIT, etc.) that are NOT in the original
 * ENUM definition. On strict-mode MySQL every INSERT with a non-ENUM value will
 * throw an error and roll back the surrounding transaction.
 *
 * This migration converts the column to VARCHAR(100) so any action string is
 * accepted.
 */
export async function up(knex) {
    const hasTable = await knex.schema.hasTable('audit_logs');
    if (!hasTable) return;

    // Check current column type — only alter if it's still an ENUM
    const [cols] = await knex.raw(
        `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'audit_logs'
           AND COLUMN_NAME  = 'action'`
    );

    const colType = cols[0]?.COLUMN_TYPE || '';
    if (colType.toLowerCase().startsWith('enum')) {
        await knex.raw(
            'ALTER TABLE audit_logs MODIFY COLUMN action VARCHAR(100) NOT NULL'
        );
    }
}

export async function down(knex) {
    const hasTable = await knex.schema.hasTable('audit_logs');
    if (!hasTable) return;

    // Revert to the original ENUM (best-effort rollback).
    // Rows with values outside this list will be truncated to '' on strict mode.
    await knex.raw(`
        ALTER TABLE audit_logs MODIFY COLUMN action
        ENUM('CREATE','UPDATE','DELETE','APPROVE','REJECT','FINALIZE',
             'IMPORT','BULK_IMPORT','REVIEW','READ') NOT NULL
    `);
}
