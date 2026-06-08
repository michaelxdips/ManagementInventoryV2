import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

const OfflineBanner: React.FC = () => {
  const { browserOnline } = useNetworkStatus();

  if (browserOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--surface-alt, #1e293b)',
        color: 'var(--text, #e2e8f0)',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9999,
        border: '1px solid var(--border, #334155)',
        maxWidth: '90vw',
        width: 'max-content'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        padding: '8px',
        borderRadius: '50%'
      }}>
        <WifiOff size={18} />
      </div>
      <div>
        <strong style={{ display: 'block', fontSize: '14px', marginBottom: '2px' }}>
          Anda sedang offline
        </strong>
        <span style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)' }}>
          Aksi transaksi membutuhkan koneksi internet.
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
