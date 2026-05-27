import { useCallback, useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import Modal from '../components/ui/Modal';
import {
    fetchNewItemRequests,
    approveNewItemRequest,
    rejectNewItemRequest,
    NewItemRequest,
} from '../api/newItemRequests.api';
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

const getStatusVariant = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED') return 'approved';
    if (s === 'REJECTED') return 'rejected';
    return 'pending';
};

const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const formatDate = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const NewItemRequestApproval = () => {
    const { showToast } = useToast();
    const [data, setData] = useState<NewItemRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();

    // Approve modal
    const [approveTarget, setApproveTarget] = useState<NewItemRequest | null>(null);
    const [approveForm, setApproveForm] = useState({
        approved_quantity: '',
        satuan: '',
        kode_barang: '',
        lokasi_simpan: '',
    });

    // Reject modal
    const [rejectTarget, setRejectTarget] = useState<NewItemRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const loadData = useCallback(() => {
        setLoading(true);
        fetchNewItemRequests()
            .then((rows) => setData(rows))
            .catch(() => {
                setData([]);
                showToast(t('newItemApproval.reqFailed'), 'error');
            })
            .finally(() => setLoading(false));
    }, [showToast, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh every 10s
    useEffect(() => {
        const interval = setInterval(() => {
            if (!processingId && !loading) {
                fetchNewItemRequests().then(setData).catch(() => { });
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [processingId, loading]);

    // Filter data
    const filteredData = data.filter((row) => {
        const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
        const matchesSearch = !searchQuery ||
            row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (row.requested_by_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Open approve modal
    const openApproveModal = (item: NewItemRequest) => {
        setApproveTarget(item);
        setApproveForm({
            approved_quantity: '',
            satuan: item.satuan || '',
            kode_barang: '',
            lokasi_simpan: '',
        });
    };

    // Handle approve submit
    const handleApprove = async () => {
        if (!approveTarget) return;
        const qty = parseInt(approveForm.approved_quantity, 10);
        if (!qty || qty <= 0 || isNaN(qty)) {
            showToast(t('newItemApproval.errQty'), 'error');
            return;
        }

        setProcessingId(approveTarget.id);
        try {
            const result = await approveNewItemRequest(approveTarget.id, {
                approved_quantity: qty,
                satuan: approveForm.satuan.trim() || undefined,
                kode_barang: approveForm.kode_barang.trim() || undefined,
                lokasi_simpan: approveForm.lokasi_simpan.trim() || undefined,
            });
            showToast(result.message, 'success');
            setApproveTarget(null);
            loadData();
        } catch (err: any) {
            let msg = t('newItemApproval.failApprove');
            if (err?.message) {
                try {
                    const parsed = JSON.parse(err.message);
                    msg = parsed.message || msg;
                } catch {
                    msg = err.message;
                }
            }
            showToast(msg, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Open reject modal
    const openRejectModal = (item: NewItemRequest) => {
        setRejectTarget(item);
        setRejectReason('');
    };

    // Handle reject submit
    const handleReject = async () => {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            showToast(t('newItemApproval.errRejectReason'), 'error');
            return;
        }

        setProcessingId(rejectTarget.id);
        try {
            const result = await rejectNewItemRequest(rejectTarget.id, rejectReason.trim());
            showToast(result.message, 'success');
            setRejectTarget(null);
            loadData();
        } catch (err: any) {
            let msg = t('newItemApproval.failReject');
            if (err?.message) {
                try {
                    const parsed = JSON.parse(err.message);
                    msg = parsed.message || msg;
                } catch {
                    msg = err.message;
                }
            }
            showToast(msg, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="history-page">
            <div className="history-card">
                <h2 className="history-title">{t('newItemApproval.title')}</h2>
                <p className="text-muted mb-4">
                    {t('newItemApproval.description')}
                </p>

                {/* Filters */}
                <div className="filter-bar mb-4">
                    <select
                        className="input-control action-button-inline"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    >
                        <option value="PENDING">{t('newItemApproval.filterPending')}</option>
                        <option value="APPROVED">{t('newItemApproval.filterApproved')}</option>
                        <option value="REJECTED">{t('newItemApproval.filterRejected')}</option>
                        <option value="ALL">{t('newItemApproval.filterAll')}</option>
                    </select>
                    <input
                        className="input-control"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('newItemApproval.searchPlaceholder')}
                    />
                </div>

                <Table>
                    <THead>
                        <TR>
                            <TH className="action-bar action-bar--wrap">{t('newItemApproval.colNo')}</TH>
                            <TH>{t('newItemApproval.colName')}</TH>
                            <TH>{t('newItemApproval.colDesc')}</TH>
                            <TH>{t('newItemApproval.colUnit')}</TH>
                            <TH>{t('newItemApproval.colRequestedBy')}</TH>
                            <TH>{t('newItemApproval.colDate')}</TH>
                            <TH>{t('newItemApproval.colStatus')}</TH>
                            <TH>{t('newItemApproval.colAction')}</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {loading ? (
                            <SkeletonTableRows rows={6} columns={8} />
                        ) : filteredData.length === 0 ? (
                            <EmptyTableRow
                                colSpan={8}
                                title={statusFilter !== 'ALL' ? t('newItemApproval.emptyNoMatch', { status: statusFilter.toLowerCase() }) : t('newItemApproval.emptyNoData')}
                                description={t('newItemApproval.emptyHint')}
                            />
                        ) : (
                            filteredData.map((row, idx) => (
                                <TR key={row.id}>
                                    <TD>{idx + 1}</TD>
                                    <TD>{row.item_name}</TD>
                                    <TD>{row.description || '-'}</TD>
                                    <TD>{row.satuan || '-'}</TD>
                                    <TD>{row.requested_by_name}</TD>
                                    <TD>{formatDate(row.created_at)}</TD>
                                    <TD>
                                        <Badge variant={getStatusVariant(row.status)}>
                                            {formatStatus(row.status)}
                                        </Badge>
                                    </TD>
                                    <TD>
                                        {row.status === 'PENDING' ? (
                                            <div className="action-buttons">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openApproveModal(row)}
                                                    disabled={processingId === row.id}
                                                >
                                                    <CheckIcon /> {processingId === row.id ? t('newItemApproval.btnProcessing') : t('newItemApproval.btnApprove')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => openRejectModal(row)}
                                                    disabled={processingId === row.id}
                                                >
                                                    <XIcon /> {t('newItemApproval.btnReject')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-muted text-sm">
                                                {row.status === 'APPROVED' && row.approved_quantity
                                                    ? t('newItemApproval.msgQty', { qty: row.approved_quantity.toString() })
                                                    : row.status === 'REJECTED' && row.reject_reason
                                                        ? t('newItemApproval.msgReason', { reason: row.reject_reason })
                                                        : t('newItemApproval.msgProcessed')}
                                            </span>
                                        )}
                                    </TD>
                                </TR>
                            ))
                        )}
                    </TBody>
                </Table>

                {/* Mobile Card View */}
                <MobileCardList
                    isEmpty={filteredData.length === 0}
                    isLoading={loading}
                    emptyMessage={statusFilter !== 'ALL' ? t('newItemApproval.emptyNoMatch', { status: statusFilter.toLowerCase() }) : t('newItemApproval.emptyNoData')}
                >
                    {filteredData.map((row, idx) => (
                        <MobileCard
                            key={row.id}
                            header={
                                <>
                                    <span className="mobile-card-header-title">{row.item_name}</span>
                                    <Badge variant={getStatusVariant(row.status)}>
                                        {formatStatus(row.status)}
                                    </Badge>
                                </>
                            }
                            fields={[
                                { label: t('newItemApproval.colNo'), value: idx + 1 },
                                { label: t('newItemApproval.colDesc'), value: row.description || '-' },
                                { label: t('newItemApproval.colUnit'), value: row.satuan || '-' },
                                { label: t('newItemApproval.colRequestedBy'), value: row.requested_by_name },
                                { label: t('newItemApproval.colDate'), value: formatDate(row.created_at) },
                            ]}
                            actions={
                                row.status === 'PENDING' ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => openApproveModal(row)}
                                            disabled={processingId === row.id}
                                        >
                                            <CheckIcon /> {processingId === row.id ? t('newItemApproval.btnProcessing') : t('newItemApproval.btnApprove')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            onClick={() => openRejectModal(row)}
                                            disabled={processingId === row.id}
                                        >
                                            <XIcon /> {t('newItemApproval.btnReject')}
                                        </Button>
                                    </>
                                ) : undefined
                            }
                        />
                    ))}
                </MobileCardList>
            </div>

            {/* Approve Modal */}
            <Modal
                isOpen={!!approveTarget}
                onClose={() => setApproveTarget(null)}
                title={t('newItemApproval.modalApproveTitle', { name: approveTarget?.item_name || '' })}
                footer={
                    <div className="form-actions">
                        <Button variant="ghost" onClick={() => setApproveTarget(null)}>{t('newItemApproval.modalApproveBtnCancel')}</Button>
                        <Button
                            variant="secondary"
                            onClick={handleApprove}
                            disabled={processingId !== null}
                        >
                            <CheckIcon /> {processingId ? t('newItemApproval.modalApproveBtnProcessing') : t('newItemApproval.modalApproveBtnSubmit')}
                        </Button>
                    </div>
                }
            >
                <p className="form-hint">
                    {t('newItemApproval.modalApproveHint')}
                </p>
                <div className="responsive-modal-form">
                    <label className="form-field form-field--tight">
                        <span className="form-label">{t('newItemApproval.modalApproveLabelQty')} <span className="required-mark">*</span></span>
                        <input
                            className="input-control"
                            type="number"
                            min="1"
                            value={approveForm.approved_quantity}
                            onChange={(e) => setApproveForm((p) => ({ ...p, approved_quantity: e.target.value }))}
                            placeholder={t('newItemApproval.modalApproveHolderQty')}
                            autoFocus
                        />
                    </label>
                    <label className="form-field form-field--tight">
                        <span className="form-label">{t('newItemApproval.modalApproveLabelUnit')}</span>
                        <input
                            className="input-control"
                            value={approveForm.satuan}
                            onChange={(e) => setApproveForm((p) => ({ ...p, satuan: e.target.value }))}
                            placeholder={approveTarget?.satuan ? t('newItemApproval.modalApproveHolderUnit', { unit: approveTarget.satuan }) : 'pcs'}
                        />
                    </label>
                    <label className="form-field form-field--tight">
                        <span className="form-label">{t('newItemApproval.modalApproveLabelCode')}</span>
                        <input
                            className="input-control"
                            value={approveForm.kode_barang}
                            onChange={(e) => setApproveForm((p) => ({ ...p, kode_barang: e.target.value }))}
                            placeholder={t('newItemApproval.modalApproveHolderCode')}
                        />
                    </label>
                    <label className="form-field form-field--tight">
                        <span className="form-label">{t('newItemApproval.modalApproveLabelLoc')}</span>
                        <input
                            className="input-control"
                            value={approveForm.lokasi_simpan}
                            onChange={(e) => setApproveForm((p) => ({ ...p, lokasi_simpan: e.target.value }))}
                            placeholder={t('newItemApproval.modalApproveHolderLoc')}
                        />
                    </label>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                title={t('newItemApproval.modalRejectTitle', { name: rejectTarget?.item_name || '' })}
                footer={
                    <div className="form-actions">
                        <Button variant="ghost" onClick={() => setRejectTarget(null)}>{t('newItemApproval.modalRejectBtnCancel')}</Button>
                        <Button
                            variant="danger"
                            onClick={handleReject}
                            disabled={processingId !== null}
                        >
                            <XIcon /> {processingId ? t('newItemApproval.modalRejectBtnProcessing') : t('newItemApproval.modalRejectBtnSubmit')}
                        </Button>
                    </div>
                }
            >
                <label className="form-field" style={{ margin: 0 }}>
                    <span className="form-label">{t('newItemApproval.modalRejectLabelReason')} <span className="required-mark">*</span></span>
                    <textarea
                        className="input-control input-control--textarea-resize"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={t('newItemApproval.modalRejectHolderReason')}
                        rows={3}
                        autoFocus
                    />
                </label>
            </Modal>
        </div>
    );
};

export default NewItemRequestApproval;
