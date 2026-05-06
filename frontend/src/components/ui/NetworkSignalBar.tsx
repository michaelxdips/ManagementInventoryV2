import { NetworkStatus, useNetworkStatus } from '../../hooks/useNetworkStatus';

type NetworkSignalBarProps = {
  variant?: 'compact' | 'login';
  showDetails?: boolean;
};

const STATUS_COPY: Record<NetworkStatus, { label: string; detail: string }> = {
  online: {
    label: 'Online',
    detail: 'Server aktif.',
  },
  checking: {
    label: 'Checking',
    detail: 'Memeriksa server.',
  },
  offline: {
    label: 'Offline',
    detail: 'Tidak ada koneksi jaringan.',
  },
  'server-down': {
    label: 'Server Down',
    detail: 'Server tidak merespons.',
  },
};

const formatTime = (date: Date | null) =>
  date ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'belum dicek';

const NetworkSignalBar = ({ variant = 'compact', showDetails = false }: NetworkSignalBarProps) => {
  const { status, lastCheckedAt, refresh } = useNetworkStatus();
  const copy = STATUS_COPY[status];
  const details = `${copy.detail} Terakhir dicek ${formatTime(lastCheckedAt)}.`;

  return (
    <button
      type="button"
      className={`network-signal network-signal--${variant} is-${status}`}
      onClick={refresh}
      title={`${copy.label} — ${details}`}
      aria-live="polite"
      aria-label={`Status koneksi: ${copy.label}. Klik untuk cek ulang.`}
    >
      <span className="network-signal__bars" aria-hidden="true">
        <span className="network-signal__bar" />
        <span className="network-signal__bar" />
        <span className="network-signal__bar" />
        <span className="network-signal__bar" />
      </span>
      <span className="network-signal__text">
        <strong>{copy.label}</strong>
        {showDetails && <small>{copy.detail}</small>}
      </span>
    </button>
  );
};

export default NetworkSignalBar;
