import notificationService from './notificationService.js';
import { getWIBDateTime, normalizeDatesForWIB } from './date.js';

const SENSITIVE = ['password_hash', 'password', 'token', 'secret'];
const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.fromEntries(
        Object.entries(obj).filter(([k]) => !SENSITIVE.includes(k))
    );
};

const safeJson = (value) => {
    if (value === undefined) return null;
    if (value === null) return null;
    try {
        return JSON.stringify(sanitize(normalizeDatesForWIB(value)));
    } catch {
        return JSON.stringify({ unserializable: true });
    }
};

export const writeAuditLog = async ({
    tableName,
    recordId,
    action,
    oldValues = null,
    newValues = null,
    userId = null,
    connection,
}) => {
    if (!tableName || !recordId || !action) return;

    const executor = connection;
    if (!executor || typeof executor.query !== 'function') {
        throw new Error('writeAuditLog requires a pool or transaction connection');
    }

    const [result] = await executor.query(
        `INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tableName, recordId, action, safeJson(oldValues), safeJson(newValues), userId]
    );

    notificationService.broadcastToAdmins('AUDIT_LOG', {
        id: result.insertId,
        table_name: tableName,
        record_id: recordId,
        action,
        user_id: userId,
        created_at: getWIBDateTime(),
    });
};

export default writeAuditLog;
