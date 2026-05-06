import { useState, useEffect, useCallback } from 'react';
import { http, getApiBaseUrl } from '../api/http';
import useAuth from './useAuth';


export interface DashboardMetrics {
  // Admin fields
  totalItems?: number;
  lowStockCount?: number;
  pendingRequests?: number;
  monthlyStats?: { month: string; masuk: number; keluar: number }[];
  recentRequests?: { id: number; nama_barang: string; qty: number; dept: string; status: string; created_at: string }[];
  topUnits?: { dept: string; total_qty: number }[];
  predictiveAlerts?: {
    nama_barang: string;
    current_stock: number;
    monthly_out: number;
    previous_monthly_out: number;
    min_stock: number;
    daysUntilStockout: number;
    dailyUsageRate: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recommendedReorderQty: number;
    alertLevel: 'critical' | 'warning';
  }[];
  auditLogs?: { id?: number; type: string; message: string; created_at: string; table_name?: string; action?: string; user_name?: string }[];

  // User fields
  myTotalRequests?: number;
  myPendingRequests?: number;
  myApprovedRequests?: number;
  myRecentRequests?: { id: number; nama_barang: string; qty: number; status: string; created_at: string }[];
  frequentItems?: { nama_barang: string; freq: number }[];
  activeAnnouncements?: { id: number; title: string; content: string; created_at: string }[];
}

export function useDashboard() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const isAdminDashboard = hasRole(['admin', 'superadmin']);

  const fetchMetrics = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!userId) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const json = await http.get<DashboardMetrics>('/dashboard/metrics');
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data dashboard');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchMetrics();
  }, [fetchMetrics, userId]);

  useEffect(() => {
    if (!userId || !isAdminDashboard || !token) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const eventSource = new EventSource(`${getApiBaseUrl()}/notifications/stream?token=${encodeURIComponent(token)}`);

    eventSource.addEventListener('AUDIT_LOG', () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        fetchMetrics({ silent: true });
      }, 500);
    });

    eventSource.onerror = () => {
      setRefreshing(false);
    };

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      eventSource.close();
    };
  }, [fetchMetrics, isAdminDashboard, token, userId]);

  const refetch = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, loading, refreshing, error, refetch };
}
