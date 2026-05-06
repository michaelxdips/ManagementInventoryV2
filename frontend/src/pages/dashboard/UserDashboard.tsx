import React from 'react';
import { FileText, CheckCircle, Clock, Plus, RefreshCw, Package, Bell, FastForward, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { DashboardMetrics } from '../../hooks/useDashboard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2f81f7', '#28a745', '#dbab09', '#d73a49', '#6f42c1'];

/** Progress track palette — explicit values so inactive steps stay readable on `surface-alt`. */
const TRACK = {
  rail: 'rgba(15, 23, 42, 0.22)',
  labelMuted: '#64748b',
  blue: '#2f81f7',
  green: '#28a745',
  red: '#d73a49',
};

function RequestProgressTrack({ status }: { status: string }) {
  const s = status.toUpperCase();
  const pending = s === 'PENDING';
  const approved = s === 'APPROVED';
  const finished = s === 'FINISHED';
  const rejected = s === 'REJECTED';

  const line1Active = !pending;
  const dot2Active = line1Active;
  const line2Approve = approved || finished;
  const line2Reject = rejected;

  let line2Style: React.CSSProperties = { background: TRACK.rail };
  if (line2Approve) line2Style = { background: TRACK.green };
  else if (line2Reject) line2Style = { background: TRACK.red };

  const dotOuter = (active: boolean, color: string) => (
    <div
      style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        margin: '0 auto 6px',
        boxSizing: 'border-box',
        border: active ? `solid 2px ${color}` : `solid 2px ${TRACK.rail}`,
        background: active ? color : 'var(--surface-alt)',
      }}
    />
  );

  const dot3Finalize = () => {
    if (rejected) return dotOuter(true, TRACK.red);
    if (approved || finished) return dotOuter(true, TRACK.green);
    return dotOuter(false, TRACK.green);
  };

  const label = (done: boolean, text: string) => (
    <span style={{ fontSize: '12px', color: done ? 'var(--text)' : TRACK.labelMuted, fontWeight: done ? 600 : 500 }}>{text}</span>
  );

  return (
    <div
      role="presentation"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '0',
        marginTop: '4px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        {dotOuter(true, TRACK.blue)}
        {label(true, 'Diajukan')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', flex: '1.15 1 0%', minWidth: '12px', paddingTop: '5px' }}>
        <div style={{ height: '3px', width: '100%', borderRadius: '2px', background: line1Active ? TRACK.blue : TRACK.rail }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        {dot2Active ? dotOuter(true, TRACK.blue) : dotOuter(false, TRACK.blue)}
        {label(dot2Active, 'Review')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', flex: '1.15 1 0%', minWidth: '12px', paddingTop: '5px' }}>
        <div style={{ height: '3px', width: '100%', borderRadius: '2px', ...line2Style }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        {dot3Finalize()}
        {label(approved || finished || rejected, rejected ? 'Ditolak' : finished ? 'Selesai' : 'Disetujui')}
      </div>
    </div>
  );
}

interface Props {
  metrics: DashboardMetrics;
  greeting: string;
  userName: string;
  onRefresh: () => void;
}

const UserDashboard: React.FC<Props> = ({ metrics, greeting, userName, onRefresh }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'grid', gap: '24px', minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h2 className="dashboard-greeting-title" style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700 }}>{greeting}, {userName} 👋</h2>
          <p className="dashboard-greeting-sub" style={{ margin: 0, color: 'var(--muted)', fontSize: '15px' }}>Kelola permintaan ATK dan pantau aktivitas Anda.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button type="button" variant="primary" onClick={() => navigate('/requests/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            Buat Request
          </Button>
        </div>
      </div>

      {/* Announcements Banner */}
      {metrics.activeAnnouncements && metrics.activeAnnouncements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {metrics.activeAnnouncements.map((ann, idx) => (
            <div key={idx} style={{ padding: '16px 20px', background: 'var(--surface-alt)', border: '1px solid #2f81f7', borderLeft: '4px solid #2f81f7', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Bell size={20} color="#2f81f7" style={{ marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{ann.title}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>{ann.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <article className="dash-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(47, 129, 247, 0.1)', borderRadius: '12px', color: '#2f81f7', width: 'fit-content' }}>
              <FileText size={24} />
            </div>
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>Total Request</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{metrics.myTotalRequests ?? 0}</p>
        </article>

        <article className="dash-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(219, 171, 9, 0.1)', borderRadius: '12px', color: '#dbab09', width: 'fit-content' }}>
              <Clock size={24} />
            </div>
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>Menunggu Validasi</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{metrics.myPendingRequests ?? 0}</p>
        </article>

        <article className="dash-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(40, 167, 69, 0.1)', borderRadius: '12px', color: '#28a745', width: 'fit-content' }}>
              <CheckCircle size={24} />
            </div>
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>Disetujui</h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{metrics.myApprovedRequests ?? 0}</p>
        </article>
      </div>

      {/* Quick Actions for User */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={() => navigate('/items')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} />
          Lihat Katalog Barang
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/requests')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} />
          Semua Request Saya
        </Button>
      </div>

      {/* Quick Re-order & Chart */}
      {metrics.frequentItems && metrics.frequentItems.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FastForward size={18} color="#2f81f7" /> 
            Sering Anda Minta (Distribusi)
          </h3>
          <div className="dashboard-frequent-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            <div className="dashboard-frequent-pie" style={{ width: '200px', height: '200px', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.frequentItems}
                    dataKey="freq"
                    nameKey="nama_barang"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {metrics.frequentItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--text)', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
              {metrics.frequentItems.map((item, idx) => (
                <div key={idx} style={{ padding: '12px 16px', background: 'var(--surface-alt)', border: `1px solid ${COLORS[idx % COLORS.length]}40`, borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>{item.nama_barang}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Di-request {item.freq} kali</p>
                  </div>
                  <Button type="button" variant="primary" onClick={() => navigate('/requests/create')} style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <Plus size={14} /> Request Lagi
                  </Button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>

        {/* Recent Requests */}
        <article className="dash-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--muted)" />
              Riwayat & Tracking Request
            </h3>
            <button
              type="button"
              onClick={() => navigate('/requests')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#2f81f7',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              className="dashboard-history-link"
            >
              Lihat request
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
          <p style={{ margin: '-8px 0 16px', fontSize: '13px', color: TRACK.labelMuted, lineHeight: 1.5 }}>
            Pantau status permintaan terbaru Anda langsung dari ringkasan ini.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.myRecentRequests && metrics.myRecentRequests.length > 0 ? metrics.myRecentRequests.map(req => {
              const st = req.status.toUpperCase();
              let step = 1;
              if (st === 'APPROVAL_REVIEW') step = 2;
              if (st === 'APPROVED' || st === 'FINISHED' || st === 'REJECTED') step = 3;

              return (
                <div
                  key={req.id}
                  style={{
                    padding: '14px 16px',
                    background: 'var(--surface-alt)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '0', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '15px', lineHeight: 1.35 }}>
                        {req.nama_barang}{' '}
                        <span style={{ color: TRACK.labelMuted, fontWeight: 500 }}>×{req.qty}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: TRACK.labelMuted, fontWeight: 500 }}>
                        {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {st === 'REJECTED' ? (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: TRACK.red, background: 'rgba(215, 58, 73, 0.12)', padding: '5px 10px', borderRadius: '999px' }}>
                          Ditolak
                        </span>
                      ) : st === 'FINISHED' ? (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a7f37', background: 'rgba(40, 167, 69, 0.12)', padding: '5px 10px', borderRadius: '999px' }}>
                          Selesai
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: step === 3 ? TRACK.green : TRACK.blue,
                            background: step === 3 ? 'rgba(40, 167, 69, 0.12)' : 'rgba(47, 129, 247, 0.12)',
                            padding: '5px 10px',
                            borderRadius: '999px',
                          }}
                        >
                          {step === 3 ? 'Disetujui' : 'Diproses'}
                        </span>
                      )}
                    </div>
                  </div>

                  <RequestProgressTrack status={req.status} />
                </div>
              );
            }) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
                Belum ada riwayat request
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default UserDashboard;
