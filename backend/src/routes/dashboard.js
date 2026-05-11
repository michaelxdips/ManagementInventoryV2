import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { batchPredict } from '../utils/stockPrediction.js';

const router = Router();

// GET /api/dashboard/metrics
router.get('/metrics', authenticate, async (req, res) => {
    try {
        const { role, id: userId } = req.user;

        if (role === 'admin' || role === 'superadmin') {
            // -- Admin Dashboard Data --
            
            // 1. Total Items
            const [[{ totalItems }]] = await pool.query('SELECT COUNT(*) as totalItems FROM atk_items');
            
            // 2. Low Stock Count (<= min_stock)
            const [[{ lowStockCount }]] = await pool.query('SELECT COUNT(*) as lowStockCount FROM atk_items WHERE qty <= min_stock');
            
            // 3. Pending Requests
            const [[{ pendingRequests }]] = await pool.query(`
                SELECT COUNT(*) as pendingRequests 
                FROM requests 
                WHERE status IN ('PENDING', 'APPROVAL_REVIEW')
            `);

            // 4. Monthly Stats (Last 6 Months In vs Out)
             const [monthlyData] = await pool.query(`
                SELECT 
                    DATE_FORMAT(date, '%Y-%m') as month,
                    SUM(CASE WHEN source = 'masuk' THEN qty ELSE 0 END) as masuk,
                    SUM(CASE WHEN source = 'keluar' THEN qty ELSE 0 END) as keluar
                FROM (
                    SELECT date, qty, 'masuk' as source FROM barang_masuk
                    UNION ALL
                    SELECT date, qty, 'keluar' as source FROM barang_keluar
                ) combined
                WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY month
                ORDER BY month ASC
            `);

            // 5. Recent Requests Fast Feed
            const [recentRequests] = await pool.query(`
                SELECT id, item as nama_barang, qty, dept, status, created_at 
                FROM requests 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            // 6. Top Requesting Units
            const [topUnits] = await pool.query(`
                SELECT dept, SUM(qty) as total_qty 
                FROM requests 
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
                GROUP BY dept 
                ORDER BY total_qty DESC 
                LIMIT 5
            `);

            // 7. Enhanced Predictive Alerts with Statistical Analysis
            let predictiveAlerts = [];
            try {
                // Get items with usage history
                const [itemsWithHistory] = await pool.query(`
                    SELECT 
                        a.id,
                        a.nama_barang,
                        a.qty as current_stock,
                        a.min_stock
                    FROM atk_items a
                    WHERE a.qty > 0
                `);

                // FIX-P1-1: Single aggregated query replaces N+1 per-item queries.
                // Previously each item fired 2 queries (200 queries for 100 items).
                const [usageRows] = await pool.query(`
                    SELECT atk_item_id,
                        IFNULL(SUM(CASE WHEN date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN qty ELSE 0 END), 0) as monthly_out,
                        IFNULL(SUM(CASE WHEN date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND date < DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN qty ELSE 0 END), 0) as previous_monthly_out
                    FROM barang_keluar
                    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                    GROUP BY atk_item_id
                `);

                const usageMap = new Map();
                for (const row of usageRows) {
                    usageMap.set(row.atk_item_id, row);
                }

                const itemsWithUsage = itemsWithHistory.map((item) => {
                    const usage = usageMap.get(item.id) || {};
                    return {
                        ...item,
                        monthly_out: Number(usage.monthly_out) || 0,
                        previous_monthly_out: Number(usage.previous_monthly_out) || 0,
                    };
                });

                // Run statistical prediction
                const predictions = batchPredict(itemsWithUsage);
                
                // Take top 5 most urgent
                predictiveAlerts = predictions.slice(0, 5);
            } catch (error) {
                console.error('Prediction error:', error);
                // Fallback to empty array if prediction fails
                predictiveAlerts = [];
            }

            // 8. Audit Logs Feed from the canonical audit_logs table
            const [auditLogs] = await pool.query(`
                SELECT
                    a.id,
                    a.table_name,
                    a.record_id,
                    a.action,
                    a.created_at,
                    COALESCE(u.name, 'System') as user_name,
                    CASE
                        WHEN a.table_name = 'requests' AND a.action = 'CREATE' THEN 'REQUEST'
                        WHEN a.table_name = 'barang_masuk' THEN 'RESTOCK'
                        WHEN a.action = 'DELETE' THEN 'DELETE'
                        WHEN a.action = 'UPDATE' THEN 'UPDATE'
                        ELSE 'AUDIT'
                    END as type,
                    CONCAT(
                        COALESCE(u.name, 'System'), ' ',
                        CASE a.action
                            WHEN 'CREATE' THEN 'membuat'
                            WHEN 'UPDATE' THEN 'mengubah'
                            WHEN 'DELETE' THEN 'menghapus'
                            ELSE LOWER(a.action)
                        END,
                        ' data ', a.table_name, ' #', a.record_id
                    ) as message
                FROM audit_logs a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC
                LIMIT 10
            `);

            return res.json({
                totalItems: Number(totalItems),
                lowStockCount: Number(lowStockCount),
                pendingRequests: Number(pendingRequests),
                monthlyStats: monthlyData,
                recentRequests,
                topUnits,
                predictiveAlerts,
                auditLogs
            });

        } else if (role === 'user') {
            // -- User Dashboard Data --
            
            // 1. My Total Requests
            const [[{ myTotalRequests }]] = await pool.query('SELECT COUNT(*) as myTotalRequests FROM requests WHERE user_id = ?', [userId]);
            
            // 2. My Pending/Approved stats
            const [[{ myPendingRequests }]] = await pool.query("SELECT COUNT(*) as myPendingRequests FROM requests WHERE user_id = ? AND status IN ('PENDING', 'APPROVAL_REVIEW')", [userId]);
            const [[{ myApprovedRequests }]] = await pool.query(
                "SELECT COUNT(*) as myApprovedRequests FROM requests WHERE user_id = ? AND status IN ('APPROVED', 'FINISHED')",
                [userId]
            );
            
            // 3. My Recent Requests
            const [myRecentRequests] = await pool.query(`
                SELECT id, item as nama_barang, qty, status, created_at 
                FROM requests 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 5
            `, [userId]);

            // 4. Frequent Items (Quick Re-order)
            let frequentItems = [];
            try {
                const [freqRows] = await pool.query(`
                    SELECT item as nama_barang, COUNT(*) as freq 
                    FROM requests 
                    WHERE user_id = ? 
                    GROUP BY item 
                    ORDER BY freq DESC 
                    LIMIT 3
                `, [userId]);
                frequentItems = freqRows;
            } catch { /* ignore */ }

            // 5. Active Announcements
            let activeAnnouncements = [];
            try {
                const [annRows] = await pool.query(`
                    SELECT id, title, content, created_at 
                    FROM announcements 
                    WHERE is_active = TRUE 
                    ORDER BY created_at DESC 
                    LIMIT 3
                `);
                activeAnnouncements = annRows;
            } catch { /* table may not exist */ }

            return res.json({
                myTotalRequests: Number(myTotalRequests),
                myPendingRequests: Number(myPendingRequests),
                myApprovedRequests: Number(myApprovedRequests),
                myRecentRequests,
                frequentItems,
                activeAnnouncements
            });
        }

        res.status(403).json({ message: 'Role tidak memiliki dashboard access.' });

    } catch (error) {
        console.error('Dashboard metrics error:', error);
        res.status(500).json({ message: 'Gagal memuat dashboard metrics' });
    }
});

export default router;
