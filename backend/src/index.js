import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
import { config } from './config/env.js';
import morgan from 'morgan';

// Import routes
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import barangMasukRoutes from './routes/barangMasuk.js';
import approvalRoutes from './routes/approval.js';
import historyRoutes from './routes/history.js';
import requestsRoutes from './routes/requests.js';
import unitsRoutes from './routes/units.js';
import barangKosongRoutes from './routes/barangKosong.js';
import usersRoutes from './routes/users.js';
import newItemRequestsRoutes from './routes/newItemRequests.js';
import notificationsRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';

import opnameRoutes from './routes/opname.js';
import auditRoutes from './routes/audit.js';
import announcementsRoutes from './routes/announcements.js';

const app = express();
const PORT = config.port;

const corsOrigins = config.corsOrigins;

app.use(
    cors(
        corsOrigins.length > 0
            ? { origin: corsOrigins, credentials: true }
            : { origin: true, credentials: true }
    )
);

// Security Headers
app.use(helmet());

// FIX-P3-1: HTTP Request Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { message: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use(limiter);

// Health check endpoint (before other routes)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.use(express.json());



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/atk-items', itemsRoutes);
app.use('/api/barang-masuk', barangMasukRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/barang-kosong', barangKosongRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/new-item-requests', newItemRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/opname', opnameRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/announcements', announcementsRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server - bind to 0.0.0.0 for local network access
// Only start server if not in test mode (supertest will handle it)
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📦 API Base: http://localhost:${PORT}/api`);
        console.log(`🌐 Network access: http://<your-ip>:${PORT}`);
    });

    // FIX-P3-2: Graceful Shutdown
    const shutdown = async (signal) => {
        console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
        try {
            if (server) {
                await new Promise((resolve) => server.close(resolve));
                console.log('HTTP server closed.');
            }
            
            const pool = (await import('./config/db.js')).default;
            await pool.end();
            console.log('Database connections closed.');
            
            process.exit(0);
        } catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
