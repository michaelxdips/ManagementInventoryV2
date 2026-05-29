import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { reviewRequest, fetchApproval, rejectRequest, batchApproveRequests, batchRejectRequests, ApprovalItem } from '../api/approval.api';
import { formatDateV2 } from '../utils/dateUtils';
import { useToast } from '../components/ui/Toast';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';
import { useTranslation } from '../hooks/useTranslation';

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
  const { t } = useTranslation();
  const [data, setData] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBatchReject, setIsBatchReject] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    fetchApproval()
      .then((rows) => {
        setData(rows);
        
      })
      .catch(() => {
        setData([]);
        
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        
      } catch {
        
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
    if (isBatchReject) {
      if (selectedIds.size === 0) return;
      setBatchProcessing(true);
      try {
        const res = await batchRejectRequests(Array.from(selectedIds), rejectReason.trim() || undefined);
        showToast(res.message, 'success');
        setRejectTarget(null);
        setIsBatchReject(false);
        setSelectedIds(new Set());
        loadData();
      } catch (err: any) {
        
      } finally {
        setBatchProcessing(false);
      }
      return;
    }

    if (!rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await rejectRequest(rejectTarget.id, rejectReason.trim() || undefined);
      showToast('Permintaan ditolak', 'success');
      setRejectTarget(null);
      loadData();
    } catch (err: any) {
      
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

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    setBatchProcessing(true);
    try {
      const res = await batchApproveRequests(Array.from(selectedIds));
      showToast(res.message, 'success');
      setSelectedIds(new Set());
      loadData();
    } catch (err: any) {
      
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchRejectInit = () => {
    if (selectedIds.size === 0) return;
    setRejectReason('');
    setIsBatchReject(true);
    setRejectTarget({ id: 0, name: `${selectedIds.size} permintaan terpilih` } as any); // Dummy target for modal
  };

  const hasDashboardFilter = searchParams.has('status') || searchParams.has('requestId');

  const clearDashboardFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="history-page">
      <div className="history-card">
        <h2 className="history-title">{t('approval.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t('approval.subtitle')}
        </p>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <input
            className="input-control"
            placeholder={t('approval.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        {selectedIds.size > 0 && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, marginRight: '8px' }}>{selectedIds.size} {t('approval.selected')}</span>
            <Button type="button" variant="primary" onClick={handleBatchApprove} disabled={batchProcessing}>
              {batchProcessing ? t('inventory.modals.processRequest') : t('approval.approveSelected')}
            </Button>
            <Button type="button" variant="danger" onClick={handleBatchRejectInit} disabled={batchProcessing}>
              {t('approval.rejectSelected')}
            </Button>
          </div>
        )}

        {hasDashboardFilter && (
          <div style={{ padding: '10px 14px', background: 'var(--warning-glow)', border: '1px solid var(--warning)', borderRadius: '999px', color: 'var(--warning)', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700 }}>
            <span>{searchParams.has('requestId') ? `Filter dashboard: request #${searchParams.get('requestId')}` : 'Filter dashboard: pending/review'}</span>
            <Button type="button" variant="ghost" size="sm" onClick={clearDashboardFilter}>Reset</Button>
          </div>
        )}


        <Table>
          <THead>
            <TR>
              <TH style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={handleToggleSelectAll}
                />
              </TH>
              <TH style={{ width: '52px' }}>{t('inventory.columns.no')}</TH>
              <TH>{t('inventory.columns.date')}</TH>
              <TH>{t('inventory.columns.itemName')}</TH>
              <TH>{t('inventory.columns.itemCode')}</TH>
              <TH>{t('inventory.columns.qty')}</TH>
              <TH>{t('inventory.columns.unit')}</TH>
              <TH>{t('inventory.columns.receiver')}</TH>
              <TH>{t('inventory.columns.dept')}</TH>
              <TH style={{ width: '160px' }}>{t('inventory.columns.action')}</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={6} columns={10} />
            ) : filtered.length === 0 ? (
              <EmptyTableRow
                colSpan={10}
                title={search ? t('inventory.noData') : t('approval.noData')}
                description={search ? t('inventory.noDataDescSearch') : t('approval.noDataDesc')}
              />
            ) : (
              filtered.map((row, idx) => (
                <TR key={row.id}>
                  <TD>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => handleToggleSelect(row.id)}
                    />
                  </TD>
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
                          <CheckIcon /> {processingId === row.id ? '...' : t('inventory.actions.approve')}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(row)}
                        disabled={processingId === row.id}
                      >
                        <XIcon /> {t('inventory.actions.reject')}
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
          emptyMessage={search ? t('inventory.noData') : t('approval.noData')}
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
                { label: t('inventory.columns.no'), value: idx + 1 },
                { label: t('inventory.columns.date'), value: formatDateV2(row.date) },
                { label: t('inventory.columns.itemCode'), value: row.code || '-' },
                { label: t('inventory.columns.qty'), value: `${row.qty} ${row.unit}` },
                { label: t('inventory.columns.receiver'), value: row.receiver },
                { label: t('inventory.columns.dept'), value: row.dept },
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
                      <CheckIcon /> {processingId === row.id ? '...' : t('inventory.actions.approve')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleReject(row)}
                    disabled={processingId === row.id}
                  >
                    <XIcon /> {t('inventory.actions.reject')}
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
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{t('inventory.actions.reject')}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 16px' }}>
              {isBatchReject ? (
                <>{t('inventory.actions.reject')} <strong>{selectedIds.size}</strong> {t('approval.selected')}?</>
              ) : (
                <>{t('inventory.actions.reject')} <strong>{rejectTarget.name}</strong>?</>
              )}
            </p>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--muted)' }}>{t('approval.rejectReason')}</label>
            <textarea
              className="input-control"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan..."
              style={{ width: '100%', marginBottom: '16px', resize: 'vertical' }}
            />
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => { setRejectTarget(null); setIsBatchReject(false); }}>{t('inventory.actions.cancel')}</Button>
              <Button type="button" variant="danger" onClick={confirmReject} disabled={processingId === rejectTarget.id || batchProcessing}>
                {processingId === rejectTarget.id || batchProcessing ? t('inventory.modals.processRequest') : t('inventory.actions.reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;
