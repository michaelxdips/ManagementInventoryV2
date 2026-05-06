import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { reviewRequest, fetchApproval, rejectRequest, ApprovalItem } from '../api/approval.api';
import { formatDateV2 } from '../utils/dateUtils';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 4 4 10-10" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const toBadgeVariant = (status: ApprovalItem['status']) => {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'approval_review') return 'review';
  return 'pending';
};

const formatStatus = (status: ApprovalItem['status']) => {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'approval_review') return 'Review';
  return 'Pending';
};

const Approval = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    fetchApproval()
      .then((rows) => {
        setData(rows);
        setError(null);
      })
      .catch(() => {
        setData([]);
        setError('Gagal memuat data dari server');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // OPTIMIZATION: Auto-Refresh (Real-time polling)
  // Poll every 10 seconds for new requests
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if not currently processing or loading
      if (!processingId && !loading) {
        // Silent update (don't set loading=true)
        fetchApproval().then(setData).catch(() => { });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [processingId, loading]);

  const handleApprove = async (item: ApprovalItem) => {
    setProcessingId(item.id);
    try {
      // Step 1: Move to APPROVAL_REVIEW status (no stock change)
      await reviewRequest(item.id);
      // Step 2: Redirect to finalize page
      navigate(`/approval/${item.id}/finalize`);
    } catch (err: any) {
      const msg = err.message || 'Gagal memproses permintaan';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.message || msg);
      } catch {
        setError(msg);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    setRejectTarget(item);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await rejectRequest(rejectTarget.id, rejectReason.trim() || undefined);
      setStatusMessage('Permintaan ditolak');
      setRejectTarget(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal menolak permintaan');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered data
  const filtered = data.filter(row => {
    const queryStatus = searchParams.get('status');
    const queryRequestId = Number(searchParams.get('requestId') || 0);
    if (queryStatus === 'pending' && row.status !== 'pending' && row.status !== 'approval_review') return false;
    if (queryRequestId && row.id !== queryRequestId) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return row.name.toLowerCase().includes(s) || row.receiver.toLowerCase().includes(s) || row.dept.toLowerCase().includes(s);
  });

  const hasDashboardFilter = searchParams.has('status') || searchParams.has('requestId');

  const clearDashboardFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="history-page">
      <div className="history-card">
        <h2 className="history-title">Permintaan Barang Keluar</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Setujui permintaan untuk mengurangi stok dan mencatat barang keluar.
        </p>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <input
            className="input-control"
            placeholder="Cari nama barang, penerima, atau unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        {hasDashboardFilter && (
          <div style={{ padding: '10px 14px', background: 'rgba(219, 171, 9, 0.09)', border: '1px solid rgba(219, 171, 9, 0.24)', borderRadius: '999px', color: '#9a7600', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700 }}>
            <span>{searchParams.has('requestId') ? `Filter dashboard: request #${searchParams.get('requestId')}` : 'Filter dashboard: pending/review'}</span>
            <Button type="button" variant="ghost" size="sm" onClick={clearDashboardFilter}>Reset</Button>
          </div>
        )}

        {statusMessage && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--success-bg, #d4edda)',
            color: 'var(--success-text, #155724)',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {statusMessage}
          </div>
        )}
        {error && <div className="alert-danger">{error}</div>}
        <Table>
          <THead>
            <TR>
              <TH style={{ width: '52px' }}>No</TH>
              <TH>Tanggal</TH>
              <TH>Nama Barang</TH>
              <TH>Kode Barang</TH>
              <TH>Jumlah</TH>
              <TH>Satuan</TH>
              <TH>Penerima</TH>
              <TH>Unit</TH>
              <TH style={{ width: '160px' }}>Action</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={6} columns={9} />
            ) : filtered.length === 0 ? (
              <EmptyTableRow
                colSpan={9}
                title={search ? 'Tidak ada hasil yang cocok' : 'Tidak ada permintaan yang menunggu persetujuan'}
                description={search ? 'Coba gunakan kata kunci lain untuk nama barang, penerima, atau unit.' : 'Permintaan baru akan muncul otomatis saat user mengajukan barang keluar.'}
              />
            ) : (
              filtered.map((row, idx) => (
                <TR key={row.id}>
                  <TD>{idx + 1}</TD>
                  <TD>{formatDateV2(row.date)}</TD>
                  <TD>{row.name}</TD>
                  <TD>{row.code || '-'}</TD>
                  <TD>{row.qty}</TD>
                  <TD>{row.unit}</TD>
                  <TD>{row.receiver}</TD>
                  <TD>{row.dept}</TD>
                  <TD>
                    <div className="action-buttons">
                      {row.status === 'approval_review' ? (
                        <Button
                          type="button"
                          variant="primary" // Different color to indicate it's in progress
                          size="sm"
                          onClick={() => navigate(`/approval/${row.id}/finalize`)}
                          disabled={processingId === row.id}
                        >
                          <CheckIcon /> Lanjut Review
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApprove(row)}
                          disabled={processingId === row.id}
                        >
                          <CheckIcon /> {processingId === row.id ? '...' : 'Setujui'}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(row)}
                        disabled={processingId === row.id}
                      >
                        <XIcon /> Tolak
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        {/* Mobile Card View */}
        <MobileCardList
          isEmpty={filtered.length === 0}
          isLoading={loading}
          emptyMessage={search ? 'Tidak ada hasil yang cocok' : 'Tidak ada permintaan yang menunggu persetujuan'}
        >
          {filtered.map((row, idx) => (
            <MobileCard
              key={row.id}
              header={
                <>
                  <span className="mobile-card-header-title">{row.name}</span>
                  <Badge variant={toBadgeVariant(row.status)}>{formatStatus(row.status)}</Badge>
                </>
              }
              fields={[
                { label: 'No', value: idx + 1 },
                { label: 'Tanggal', value: formatDateV2(row.date) },
                { label: 'Kode', value: row.code || '-' },
                { label: 'Jumlah', value: `${row.qty} ${row.unit}` },
                { label: 'Penerima', value: row.receiver },
                { label: 'Unit', value: row.dept },
              ]}
              actions={
                <>
                  {row.status === 'approval_review' ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => navigate(`/approval/${row.id}/finalize`)}
                      disabled={processingId === row.id}
                    >
                      <CheckIcon /> Lanjut Review
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleApprove(row)}
                      disabled={processingId === row.id}
                    >
                      <CheckIcon /> {processingId === row.id ? '...' : 'Setujui'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleReject(row)}
                    disabled={processingId === row.id}
                  >
                    <XIcon /> Tolak
                  </Button>
                </>
              }
            />
          ))}
        </MobileCardList>
      </div>

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setRejectTarget(null)} />
          <div style={{ position: 'relative', background: 'var(--surface)', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Tolak Permintaan</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 16px' }}>
              Tolak permintaan <strong>{rejectTarget.name}</strong> dari <strong>{rejectTarget.receiver}</strong>?
            </p>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--muted)' }}>Alasan penolakan (opsional)</label>
            <textarea
              className="input-control"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan..."
              style={{ width: '100%', marginBottom: '16px', resize: 'vertical' }}
            />
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setRejectTarget(null)}>Batal</Button>
              <Button type="button" variant="danger" onClick={confirmReject} disabled={processingId === rejectTarget.id}>
                {processingId === rejectTarget.id ? 'Menolak...' : 'Tolak Permintaan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;
