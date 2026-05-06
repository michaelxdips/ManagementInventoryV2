import pool from '../config/db.js';
import { getWIBDateTime, normalizeDatesForWIB } from './date.js';

/**
 * Insert one inbox row per user for NEW_REQUEST / LOW_STOCK / STATUS_UPDATE.
 */
export async function createUserNotification(userId, { type, title, message, payload }) {
    const uid = Number(userId);
    if (!Number.isFinite(uid)) throw new Error('Invalid user id for notification');

    const [result] = await pool.execute(
        `INSERT INTO user_notifications (user_id, type, title, message, payload)
         VALUES (?, ?, ?, ?, ?)`,
        [uid, type, title, message, payload == null ? null : JSON.stringify(normalizeDatesForWIB(payload))]
    );
    return result.insertId;
}

export function mapNotificationRow(row) {
    let payload = row.payload;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            payload = null;
        }
    }
    return {
        id: Number(row.id),
        type: row.type,
        title: row.title,
        message: row.message,
        payload,
        is_read: Boolean(row.is_read),
        created_at: row.created_at instanceof Date ? getWIBDateTime(row.created_at) : String(row.created_at),
    };
}

export async function listNotificationsForUser(userId, limit = 100) {
    const lim = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const uid = Number(userId);
    const [rows] = await pool.query(
        `SELECT id, type, title, message, payload, is_read, created_at
         FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [uid, lim]
    );
    return rows.map(mapNotificationRow);
}

export async function markNotificationRead(userId, notificationId) {
    const uid = Number(userId);
    const nid = Number(notificationId);
    await pool.execute(
        `UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [nid, uid]
    );
}

export async function markAllNotificationsRead(userId) {
    await pool.execute(`UPDATE user_notifications SET is_read = 1 WHERE user_id = ?`, [
        Number(userId),
    ]);
}

export async function deleteAllNotificationsForUser(userId) {
    await pool.execute(`DELETE FROM user_notifications WHERE user_id = ?`, [Number(userId)]);
}
