import pool from '../config/db.js';

const REQUIRED_ACTION_VALUES = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'REJECT',
  'APPROVE',
  'CREATE_UNIT',
  'DELETE_UNIT',
  'UPDATE_PROFILE',
  'UPDATE_PASSWORD',
  'DELETE_ACCOUNT',
  'MARK_APPROVAL_REVIEW',
  'FINALIZE_APPROVAL',
  'UPDATE_STOCK_OUT',
  'CREATE_FROM_NEW_ITEM_REQUEST',
  'CREATE_DRAFT',
  'UPDATE_PHYSICAL_QTY',
  'STOCK_OPNAME_ADJUSTMENT',
  'FINALIZE',
  'DELETE_DRAFT',
];

const main = async () => {
  const enumSql = REQUIRED_ACTION_VALUES.map((value) => `'${value}'`).join(', ');
  await pool.query(`ALTER TABLE audit_logs MODIFY COLUMN action ENUM(${enumSql}) NOT NULL`);
  console.log(`✅ audit_logs.action enum updated (${REQUIRED_ACTION_VALUES.length} values)`);
};

main()
  .catch((error) => {
    console.error('❌ Failed to update audit action enum:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
