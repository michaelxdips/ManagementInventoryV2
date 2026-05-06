import pool from './config/db.js';

/**
 * Migration: Add APPROVAL_REVIEW status to requests table ENUM.
 * This is a one-time migration for the 2-step approval flow.
 */
const migrate = async () => {
    console.log('🔄 Running migration: Add APPROVAL_REVIEW status...');
    try {
        await pool.query(`
      ALTER TABLE requests MODIFY COLUMN status 
      ENUM('PENDING','APPROVAL_REVIEW','APPROVED','REJECTED','FINISHED') 
      NOT NULL DEFAULT 'PENDING'
    `);
        console.log('✅ Migration successful: APPROVAL_REVIEW status added.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
};

migrate();
