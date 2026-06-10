import React from 'react';
import { FileText, CheckCircle, Clock, Plus, RefreshCw, Package, FastForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { DashboardMetrics } from '../../hooks/useDashboard';
import { useTranslation } from '../../hooks/useTranslation';
import DashboardGreeting from '../../components/dashboard/DashboardGreeting';
import DashboardAnnouncement from '../../components/dashboard/DashboardAnnouncement';

const TRACK = { rail: 'var(--surface-alt)', blue: 'var(--accent)', green: 'var(--success)', red: 'var(--danger)' };

function RequestProgressTrack({ status }: { status: string }) {
  const { t } = useTranslation();
  const s = status.toUpperCase();
  const isReviewOrBeyond = s !== 'PENDING';
  const isFinished = s === 'FINISHED';
  const isApproved = s === 'APPROVED';
  const isRejected = s === 'REJECTED';

  const dotOuter = (active: boolean, color: string) => (
    <div
      style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        margin: '0 auto 6px',
        boxSizing: 'border-box',
        border: active ? `solid 2px ${color}` : `solid 2px var(--border)`,
        background: active ? color : 'var(--surface)',
      }}
    />
  );

  const line = (active: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', flex: '1 1 0%', minWidth: '12px', paddingTop: '5px' }}>
      <div style={{ height: '3px', width: '100%', borderRadius: '2px', background: active ? TRACK.blue : 'var(--border)' }} />
    </div>
  );

  const label = (done: boolean, text: string) => (
    <span style={{ fontSize: '12px', color: done ? 'var(--text)' : 'var(--muted)', fontWeight: done ? 600 : 500 }}>{text}</span>
  );

  return (
    <div
      role="presentation"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '4px',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        {dotOuter(true, TRACK.blue)}
        {label(true, t('dashboard.submitted'))}
      </div>
      {line(isReviewOrBeyond)}
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        {dotOuter(isReviewOrBeyond, isRejected ? TRACK.red : TRACK.blue)}
        {label(isReviewOrBeyond, isRejected ? t('dashboard.rejected') : t('dashboard.review'))}
      </div>
      {line(isFinished)}
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        {dotOuter(isFinished || isApproved, isRejected ? TRACK.red : (isFinished || isApproved ? TRACK.green : 'var(--border)'))}
        {label(isFinished || isApproved || isRejected, isRejected ? t('dashboard.rejected') : (isFinished ? t('dashboard.finished') : t('dashboard.approved')))}
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
  const { t } = useTranslation();

  return (
    <div style={{ display: 'grid', gap: '24px', minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <DashboardGreeting greeting={greeting} userName={userName} summaryText={t('dashboard.summary')} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            {t('dashboard.refresh')}
          </Button>
          <Button type="button" variant="primary" onClick={() => navigate('/requests/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            {t('dashboard.newRequest')}
          </Button>
        </div>
      </div>

      {/* Announcements Banner */}
      <DashboardAnnouncement announcements={metrics.activeAnnouncements} />

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <article className="dash-card">
          <div className="dash-icon-tile dash-icon-tile--accent">
            <FileText size={24} />
          </div>
          <h3 className="dash-stat-title">{t('dashboard.totalRequests')}</h3>
          <p className="dash-stat-value">{metrics.myTotalRequests ?? 0}</p>
        </article>

        <article className="dash-card">
          <div className="dash-icon-tile dash-icon-tile--warning">
            <Clock size={24} />
          </div>
          <h3 className="dash-stat-title">{t('dashboard.pendingValidation')}</h3>
          <p className="dash-stat-value">{metrics.myPendingRequests ?? 0}</p>
        </article>

        <article className="dash-card">
          <div className="dash-icon-tile dash-icon-tile--success">
            <CheckCircle size={24} />
          </div>
          <h3 className="dash-stat-title">{t('dashboard.approved')}</h3>
          <p className="dash-stat-value">{metrics.myApprovedRequests ?? 0}</p>
        </article>
      </div>

      {/* Frequent Items Section */}
      <article className="dash-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FastForward size={18} color="var(--accent)" /> 
              {t('dashboard.frequentRequests')}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{t('dashboard.frequentSubtitle')}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {metrics.frequentItems && metrics.frequentItems.length > 0 ? metrics.frequentItems.map((item, idx) => (
              <div key={idx} style={{ padding: '16px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'all 0.2s ease', cursor: 'pointer' }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                   onClick={() => navigate(`/requests/create?item=${encodeURIComponent(item.nama_barang)}`)}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/requests/create?item=${encodeURIComponent(item.nama_barang)}`); } }}
                   aria-label={`Request ${item.nama_barang} again`}>
                
                {/* Rank Indicator */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', fontWeight: 700, color: idx < 3 ? 'var(--accent)' : 'var(--muted)', background: idx < 3 ? 'var(--accent-glow)' : 'var(--surface-alt)', padding: '2px 8px', borderRadius: '12px' }}>
                  #{idx + 1}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Icon */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Package size={20} color="var(--muted)" />
                  </div>
                  
                  {/* Info */}
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={item.nama_barang}>{item.nama_barang}</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--muted)' }}>
                    {item.freq === 1 ? t('dashboard.requestedCountSingular') : t('dashboard.requestedCount', { count: item.freq })}
                  </p>
                </div>
                
                {/* Action */}
                <div style={{ marginTop: 'auto' }}>
                  <Button type="button" variant="secondary" style={{ width: '100%', fontSize: '13px', padding: '6px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} tabIndex={-1}>
                    <Plus size={14} />
                    {t('dashboard.requestAgain')}
                  </Button>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', background: 'var(--panel)', border: '1px dashed var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Package size={32} color="var(--muted)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>{t('dashboard.noFrequentItems')}</h4>
                <p style={{ margin: 0, fontSize: '13px', maxWidth: '300px', lineHeight: 1.5 }}>{t('dashboard.emptyFrequentItemsDesc')}</p>
                <Button type="button" variant="primary" onClick={(e) => { e.stopPropagation(); navigate('/requests/create'); }} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={16} /> {t('dashboard.newRequest')}
                </Button>
              </div>
            )}
          </div>
        </article>

        {/* Request Tracking */}
        <article className="dash-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{t('dashboard.historyAndTracking')}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{t('dashboard.trackRecent')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate('/requests')}>
              {t('dashboard.viewRequest')}
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {metrics.myRecentRequests && metrics.myRecentRequests.length > 0 ? metrics.myRecentRequests.map(req => (
              <div key={req.id} style={{ padding: '16px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{req.nama_barang} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>× {req.qty}</span></h4>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <RequestProgressTrack status={req.status} />
              </div>
            )) : (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', background: 'var(--panel)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                {t('dashboard.noRequestHistory')}
              </div>
            )}
          </div>
        </article>
    </div>
  );
};

export default UserDashboard;
