import React from 'react';
import { Bell, Megaphone } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { DashboardMetrics } from '../../hooks/useDashboard';

interface Props {
  announcements?: DashboardMetrics['activeAnnouncements'];
}

const DashboardAnnouncement: React.FC<Props> = ({ announcements }) => {
  const { t } = useTranslation();

  if (!announcements || announcements.length === 0) {
    return (
      <div style={{ padding: '16px 20px', background: 'var(--surface-alt)', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        <Megaphone size={20} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{t('dashboard.emptyAnnouncements')}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {announcements.map((ann, idx) => (
        <div key={idx} style={{ padding: '16px 20px', background: 'var(--surface-alt)', border: '1px solid var(--accent)', borderLeft: '4px solid var(--accent)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Bell size={20} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{ann.title}</h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>{ann.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardAnnouncement;
