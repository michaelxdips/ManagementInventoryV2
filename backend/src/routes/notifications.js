import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import notificationService from '../utils/notificationService.js';
import {
    listNotificationsForUser,
    markNotificationRead,
    markAllNotificationsRead,
    deleteAllNotificationsForUser,
} from '../utils/userNotifications.js';

const router = Router();

// Middleware: EventSource can't send headers, so accept token from query param
const sseAuth = (req, res, next) => {
    if (req.query.token && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
};

// GET /api/notifications/stream - Server-Sent Events Endpoint
router.get('/stream', sseAuth, authenticate, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    notificationService.addClient(req.user.id, res, req.user.role);

    res.write(
        `event: connected\ndata: ${JSON.stringify({ message: 'Real-time connection established', userId: req.user.id })}\n\n`
    );
});

// GET /api/notifications/inbox — persisted notifications (merge with SSE on client)
router.get('/inbox', authenticate, async (req, res) => {
    try {
        const lim = parseInt(String(req.query.limit || '80'), 10);
        const notifications = await listNotificationsForUser(req.user.id, lim);
        res.json({ notifications });
    } catch (error) {
        console.error('List notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/read-all', authenticate, async (req, res) => {
    try {
        await markAllNotificationsRead(req.user.id);
        res.status(204).send();
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.patch('/inbox/:notificationId/read', authenticate, async (req, res) => {
    try {
        const { notificationId } = req.params;
        await markNotificationRead(req.user.id, notificationId);
        res.status(204).send();
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/inbox', authenticate, async (req, res) => {
    try {
        await deleteAllNotificationsForUser(req.user.id);
        res.status(204).send();
    } catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
