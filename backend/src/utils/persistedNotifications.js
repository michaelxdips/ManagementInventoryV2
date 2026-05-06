import pool from '../config/db.js';
import notificationService from './notificationService.js';
import emailService from './emailService.js';
import { createUserNotification } from './userNotifications.js';
import { normalizeDatesForWIB } from './date.js';

function ssePayload(eventType, payload, notificationId) {
    const normalizedPayload = normalizeDatesForWIB(payload);
    if (normalizedPayload != null && typeof normalizedPayload === 'object' && !Array.isArray(normalizedPayload)) {
        return { ...normalizedPayload, notificationId };
    }
    return { data: normalizedPayload, notificationId };
}

/**
 * Persist one inbox row per admin/superadmin, then SSE individually (each gets their PK).
 */
export async function notifyAdminsWithPersistence(eventType, payload, { title, message }) {
    const [admins] = await pool.query(
        `SELECT id FROM users WHERE role IN ('admin', 'superadmin')`
    );
    for (const row of admins) {
        const id = Number(row.id);
        const normalizedPayload = normalizeDatesForWIB(payload);
        const notificationId = await createUserNotification(id, {
            type: eventType,
            title,
            message,
            payload: normalizedPayload,
        });
        notificationService.sendToUser(id, eventType, ssePayload(eventType, normalizedPayload, notificationId));
    }
}

/**
 * Persist STATUS_UPDATE + optional email to requesting user + SSE with notification id.
 */
export async function notifyUserRequestStatus(userId, { requestId, itemName, status, message }) {
    const uid = userId != null ? Number(userId) : NaN;
    if (!Number.isFinite(uid)) return null;

    const st = String(status || '').toUpperCase();
    const sseData = {
        id: Number(requestId),
        status: st,
        item: itemName,
        message,
    };

    let title = 'Update status permintaan';
    if (st === 'APPROVED') title = 'Barang disetujui';
    else if (st === 'FINISHED') title = 'Permintaan selesai';
    else if (st === 'REJECTED') title = 'Permintaan ditolak';

    const notificationId = await createUserNotification(uid, {
        type: 'STATUS_UPDATE',
        title,
        message,
        payload: sseData,
    });
    notificationService.sendToUser(uid, 'STATUS_UPDATE', { ...sseData, notificationId });

    const [userRows] = await pool.execute('SELECT email FROM users WHERE id = ?', [uid]);
    const rawEmail = userRows[0]?.email;
    const email = rawEmail ? String(rawEmail).trim() : '';
    if (email) {
        await emailService
            .notifyUserRequestStatus({
                to: email,
                itemName,
                status: st,
                message,
            })
            .catch((err) => console.error('Email user request status error:', err));
    }

    return notificationId;
}

export async function notifyLowStockToAdmins(payload) {
    const title = payload.remaining === 0 ? 'Stok habis' : 'Peringatan stok minimum';
    await notifyAdminsWithPersistence('LOW_STOCK', payload, {
        title,
        message: payload.message || '',
    });
}
