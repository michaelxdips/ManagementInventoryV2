import React from 'react';
import { Package, AlertTriangle, Clock, Calendar, CheckCircle, RefreshCw, PlusCircle, TrendingUp, Activity, AlertCircle, BarChart2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import Button from '../../components/ui/Button';
import { DashboardMetrics } from '../../hooks/useDashboard';

const UNIT_COLORS = ['#2f81f7', '#6f42c1', '#28a745', '#dbab09', '#d73a49'];

type RecentRequest = NonNullable<DashboardMetrics['recentRequests']>[number];

interface Props {
  metrics: DashboardMetrics;
  greeting: string;
  userName: string;
  onRefresh: () => void;
  refreshing?: boolean;
}

const AdminDashboard: React.FC<Props> = ({ metrics, greeting, userName, onRefresh, refreshing = false }) => {
  const navigate = useNavigate();

  const getRecentRequestPath = (req: RecentRequest) => {
    const status = req.status.toUpperCase();
    if (status === 'APPROVED' || status === 'FINISHED') return `/history-keluar?requestId=${req.id}`;
    return `/approval?requestId=${req.id}`;
  };

  return (
    <div style={{ display: 'grid', gap: '24px', minWidth: 0 }}>
      {/* Header with greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h2 className="dashboard-greeting-title" style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700 }}>{greeting}, {userName} 👋</h2>
          <p className="dashboard-greeting-sub" style={{ margin: 0, color: 'var(--muted)', fontSize: '15px' }}>Berikut ringkasan inventaris terkini.</p>
        </div>
        <Button type="button" variant="secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <article
          className="dash-card dashboard-drilldown-card"
          onClick={() => navigate('/items')}
          title="Buka daftar inventaris"
          aria-label="Buka daftar inventaris"
          style={{ display: 'flex', flexDirection: 'column', padding: '24px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(47, 129, 247, 0.1)', borderRadius: '12px', color: '#2f81f7' }}>
              <Package size={24} />
            </div>
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>Total Barang</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{metrics.totalItems ?? 0}</p>
        </article>

        <article
          className="dash-card dashboard-drilldown-card"
          onClick={() => navigate('/items?stock=low')}
          title="Lihat stok rentan dan barang kosong"
          aria-label="Lihat stok rentan dan barang kosong"
          style={{ display: 'flex', flexDirection: 'column', padding: '24px', border: (metrics.lowStockCount ?? 0) > 0 ? '1px solid #d73a49' : undefined, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(215, 58, 73, 0.1)', borderRadius: '12px', color: '#d73a49' }}>
              <AlertTriangle size={24} />
            </div>
            {(metrics.lowStockCount ?? 0) > 0 && <span style={{ background: '#d73a49', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Perlu Aksi</span>}
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>Stok Rentan (&lt;10)</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: (metrics.lowStockCount ?? 0) > 0 ? '#d73a49' : 'inherit' }}>{metrics.lowStockCount ?? 0}</p>
        </article>

        <article
          className="dash-card dashboard-drilldown-card"
          onClick={() => navigate('/approval?status=pending')}
          title="Buka approval pending"
          aria-label="Buka approval pending"
          style={{ display: 'flex', flexDirection: 'column', padding: '24px', border: (metrics.pendingRequests ?? 0) > 0 ? '1px solid #dbab09' : undefined, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(219, 171, 9, 0.1)', borderRadius: '12px', color: '#dbab09' }}>
              <Clock size={24} />
            </div>
            {(metrics.pendingRequests ?? 0) > 0 && <span style={{ background: '#dbab09', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Menunggu</span>}
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>Pending Request</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{metrics.pendingRequests ?? 0}</p>
        </article>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button type="button" variant="primary" onClick={() => navigate('/barang-masuk/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={16} />
          Tambah Barang Masuk
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/approval?status=pending')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} />
          Review Approval {(metrics.pendingRequests ?? 0) > 0 && `(${metrics.pendingRequests})`}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/items')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} />
          Kelola Inventaris
        </Button>
      </div>

      <div className="dashboard-primary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        {/* Chart Section */}
        <article className="dash-card dashboard-primary-card" style={{ padding: '22px', minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--muted)" />
            Statistik 6 Bulan Terakhir
          </h3>
          <div className="dashboard-chart-wrap" style={{ flex: 1, minHeight: 0, width: '100%', minWidth: 0 }}>
            {metrics.monthlyStats && metrics.monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.monthlyStats} margin={{ top: 10, right: 16, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="var(--muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    allowDecimals={false}
                    tickFormatter={(value) => Number(value).toLocaleString('id-ID')}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)' }}
                    cursor={{ fill: 'var(--surface-alt)' }}
                    formatter={(value) => Number(value).toLocaleString('id-ID')}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '13px' }} />
                  <Bar dataKey="masuk" name="Barang Masuk" fill="#2f81f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="keluar" name="Barang Keluar" fill="#d73a49" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexDirection: 'column', gap: '8px' }}>
                <Calendar size={32} />
                <span>Belum ada data historis</span>
              </div>
            )}
          </div>
        </article>

        {/* Recent Requests */}
        <article className="dash-card dashboard-primary-card dashboard-widget-card">
          <div className="dashboard-section-header dashboard-section-header--spaced">
            <h3 className="dashboard-section-title">Permintaan Terbaru</h3>
            <Button type="button" variant="secondary" onClick={() => navigate('/approval?status=pending')} className="dashboard-compact-button">
              Lihat Pending
            </Button>
          </div>

          <div className="dashboard-scroll-list dashboard-scroll-list--recent">
            {metrics.recentRequests && metrics.recentRequests.length > 0 ? metrics.recentRequests.map(req => (
              <div
                key={req.id}
                className="dashboard-drilldown-row"
                onClick={() => navigate(getRecentRequestPath(req))}
                title={`Buka permintaan #${req.id}`}
                aria-label={`Buka permintaan #${req.id}`}
              >
                <div className="dashboard-row-content">
                  <p className="dashboard-row-title">{req.nama_barang} <span className="dashboard-row-muted">×{req.qty}</span></p>
                  <p className="dashboard-row-subtitle">Dari: {req.dept}</p>
                </div>
                {(req.status === 'PENDING' || req.status === 'APPROVAL_REVIEW') ? (
                  <span className="dashboard-status-pill dashboard-status-pill--pending">
                    <Clock size={12} /> Menunggu
                  </span>
                ) : req.status === 'APPROVED' ? (
                  <span className="dashboard-status-pill dashboard-status-pill--success">
                    <CheckCircle size={12} /> Disetujui
                  </span>
                ) : req.status === 'REJECTED' ? (
                  <span className="dashboard-status-pill dashboard-status-pill--danger">
                    Ditolak
                  </span>
                ) : (
                  <span className="dashboard-status-pill dashboard-status-pill--neutral">
                    Selesai
                  </span>
                )}
              </div>
            )) : (
              <div className="dashboard-empty-panel dashboard-empty-panel--tall">
                Belum ada permintaan masuk
              </div>
            )}
          </div>
        </article>

        {/* Priority Insights */}
        <article className="dash-card dashboard-primary-card" style={{ padding: '22px', minHeight: '360px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--muted)" />
              Insight Prioritas
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--muted)', background: 'var(--surface-alt)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '999px' }}>
              Stok & Unit
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '14px', flex: 1, minHeight: 0 }}>
            <section style={{ minHeight: 0, display: 'flex', flexDirection: 'column', padding: '14px', borderRadius: '18px', border: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(215, 58, 73, 0.045), var(--surface-alt))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: 'var(--text)' }}>Prediksi Kehabisan Stok</p>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>{metrics.predictiveAlerts?.length ?? 0} item</span>
              </div>

              <div style={{ display: 'grid', gap: '9px', overflowY: 'auto', paddingRight: '4px', minHeight: 0 }}>
                {metrics.predictiveAlerts && metrics.predictiveAlerts.length > 0 ? metrics.predictiveAlerts.map((alert, idx) => {
                  const isCritical = alert.alertLevel === 'critical';
                  const accent = isCritical ? '#d73a49' : '#dbab09';
                  const trendIcon = alert.trend === 'increasing' ? '↗' : alert.trend === 'decreasing' ? '↘' : '→';

                  return (
                    <div
                      key={idx}
                      className="dashboard-alert-card dashboard-drilldown-row"
                      onClick={() => navigate(`/items?search=${encodeURIComponent(alert.nama_barang)}`)}
                      title={`Cari ${alert.nama_barang} di inventaris`}
                      aria-label={`Cari ${alert.nama_barang} di inventaris`}
                      style={{ '--alert-accent': accent, '--alert-tint': isCritical ? 'rgba(215, 58, 73, 0.1)' : 'rgba(219, 171, 9, 0.13)' } as React.CSSProperties}
                    >
                      <div className="dashboard-alert-main">
                        <div className="dashboard-alert-icon">
                          <AlertCircle size={16} />
                        </div>
                        <div className="dashboard-alert-content">
                          <p className="dashboard-alert-name">{alert.nama_barang}</p>
                          <p className="dashboard-alert-desc">{trendIcon} Habis sekitar <strong>{alert.daysUntilStockout} hari</strong></p>
                        </div>
                        <span className="dashboard-alert-badge">
                          {isCritical ? 'Kritis' : 'Pantau'}
                        </span>
                      </div>
                      <div className="dashboard-alert-stats">
                        <div className="dashboard-stat-box"><p className="dashboard-stat-label">Stok</p><strong className="dashboard-stat-value">{Number(alert.current_stock).toLocaleString('id-ID')}</strong></div>
                        <div className="dashboard-stat-box"><p className="dashboard-stat-label">Keluar</p><strong className="dashboard-stat-value">{Number(alert.monthly_out).toLocaleString('id-ID')}</strong></div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ height: '100%', minHeight: '100px', display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--muted)', background: 'var(--panel)', border: '1px dashed var(--border)', borderRadius: '14px', fontSize: '13px' }}>
                    Tidak ada stok yang perlu diprediksi.
                  </div>
                )}
              </div>
            </section>

            <section className="dashboard-unit-widget">
              <div className="dashboard-unit-widget-header">
                <p className="dashboard-unit-widget-title"><BarChart2 size={15} color="var(--muted)" />Unit Teraktif Bulan Ini</p>
                <span className="dashboard-unit-widget-count">{metrics.topUnits?.length ?? 0} unit</span>
              </div>

              {metrics.topUnits && metrics.topUnits.length > 0 ? (() => {
                const topUnits = metrics.topUnits.slice(0, 5).filter(unit => Number(unit.total_qty) > 0);
                const visibleUnits = topUnits.slice(0, 3);
                const totalQty = topUnits.reduce((sum, unit) => sum + Number(unit.total_qty), 0) || 1;
                const maxQty = visibleUnits[0]?.total_qty || 1;
                let segmentStart = 0;
                const donutSegments = topUnits.map((unit, idx) => {
                  const segmentSize = (Number(unit.total_qty) / totalQty) * 100;
                  const segment = `${UNIT_COLORS[idx % UNIT_COLORS.length]} ${segmentStart}% ${segmentStart + segmentSize}%`;
                  segmentStart += segmentSize;
                  return segment;
                }).join(', ');

                return (
                  <div className="dashboard-unit-leaderboard">
                    <div className="dashboard-unit-donut-panel">
                      <div
                        className="dashboard-unit-css-donut"
                        style={{ background: `conic-gradient(${donutSegments})` }}
                        aria-label={`Distribusi ${topUnits.length} unit teraktif`}
                      >
                        <div className="dashboard-unit-donut-core">
                          <strong>{Number(totalQty).toLocaleString('id-ID')}</strong>
                          <span>Total keluar</span>
                        </div>
                      </div>
                      <p className="dashboard-unit-donut-caption">Distribusi aktivitas keluar barang</p>
                    </div>

                    <div className="dashboard-unit-bars">
                      {visibleUnits.map((unit, idx) => {
                        const percentOfTotal = Math.round((Number(unit.total_qty) / totalQty) * 100);
                        const barWidth = Math.max(6, Math.round((Number(unit.total_qty) / maxQty) * 100));

                        return (
                          <button
                            type="button"
                            key={unit.dept}
                            className="dashboard-unit-bar-card"
                            onClick={() => navigate(`/history-keluar?dept=${encodeURIComponent(unit.dept)}`)}
                            title={`Lihat barang keluar unit ${unit.dept}`}
                            aria-label={`Lihat barang keluar unit ${unit.dept}`}
                          >
                            <div className="dashboard-unit-bar-topline">
                              <span className="dashboard-unit-rank" style={{ background: UNIT_COLORS[idx % UNIT_COLORS.length] }}>{idx + 1}</span>
                              <span className="dashboard-unit-bar-name">{unit.dept}</span>
                              <span className="dashboard-unit-bar-value">{Number(unit.total_qty).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="dashboard-unit-bar-track">
                              <span
                                className="dashboard-unit-bar-fill"
                                style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${UNIT_COLORS[idx % UNIT_COLORS.length]}, rgba(47, 129, 247, 0.55))` }}
                              />
                            </div>
                            <span className="dashboard-unit-bar-percent">{percentOfTotal}% dari total aktivitas</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (
                <div style={{ height: '100%', minHeight: '86px', display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--muted)', background: 'var(--panel)', border: '1px dashed var(--border)', borderRadius: '14px', fontSize: '13px' }}>
                  Belum ada data unit bulan ini.
                </div>
              )}
            </section>
          </div>
        </article>

        {/* Audit Logs */}
        <article className="dash-card dashboard-primary-card" style={{ padding: '22px', minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <h3
              onClick={() => navigate('/audit-logs')}
              title="Buka audit logs"
              aria-label="Buka audit logs"
              style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Zap size={20} color="var(--muted)" />
              Live Feed Aktivitas
            </h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: refreshing ? '#2f81f7' : '#28a745', background: refreshing ? 'rgba(47, 129, 247, 0.12)' : 'rgba(40, 167, 69, 0.12)', padding: '6px 10px', borderRadius: '999px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: refreshing ? '#2f81f7' : '#28a745', boxShadow: `0 0 0 4px ${refreshing ? 'rgba(47, 129, 247, 0.14)' : 'rgba(40, 167, 69, 0.14)'}` }} />
              {refreshing ? 'Syncing...' : 'Realtime SSE'}
            </span>
          </div>
          <div style={{ display: 'grid', gap: '0', overflowY: 'auto', paddingRight: '8px', flex: 1, minHeight: 0 }}>
            {metrics.auditLogs && metrics.auditLogs.length > 0 ? metrics.auditLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: '10px', padding: '10px 0', borderBottom: idx !== metrics.auditLogs!.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                <div style={{ marginTop: '2px', color: log.type === 'REQUEST' ? '#dbab09' : log.type === 'RESTOCK' ? '#28a745' : log.type === 'DELETE' ? '#d73a49' : log.type === 'UPDATE' ? '#2f81f7' : '#6f42c1' }}>
                  {log.type === 'REQUEST' ? <Clock size={16} /> : log.type === 'DELETE' ? <AlertTriangle size={16} /> : log.type === 'UPDATE' ? <Activity size={16} /> : <CheckCircle size={16} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', lineHeight: '1.45' }}>{log.message}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                    {new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )) : (
              <div style={{ height: '100%', minHeight: '220px', display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--muted)', background: 'var(--surface-alt)', border: '1px dashed var(--border)', borderRadius: '14px' }}>
                Belum ada log aktivitas.
              </div>
            )}
          </div>
        </article>
      </div>

    </div>
  );
};

export default AdminDashboard;
