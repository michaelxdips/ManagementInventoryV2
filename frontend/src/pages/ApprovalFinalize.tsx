import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { fetchApprovalDetail, finalizeRequest, reviewRequest, ApprovalDetail } from '../api/approval.api';

const SaveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const ApprovalFinalize = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [detail, setDetail] = useState<ApprovalDetail | null>(null);
    const [finalQty, setFinalQty] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchApprovalDetail(parseInt(id))
            .then((data) => {
                setDetail(data);
                setFinalQty(data.requestQty);
                setError(null);
            })
            .catch((err) => {
                let msg = 'Gagal memuat detail permintaan';
                try {
                    const parsed = JSON.parse(err.message);
                    msg = parsed.message || msg;
                } catch {
                    msg = err.message || msg;
                }
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val)) {
            setFinalQty(0);
        } else {
            setFinalQty(val);
        }
    };

    const getValidationError = (): string | null => {
        if (!detail) return 'Data tidak tersedia';
        if (finalQty <= 0) return 'Jumlah harus lebih dari 0';
        if (finalQty > detail.requestQty) return `Jumlah tidak boleh melebihi permintaan (${detail.requestQty})`;
        if (finalQty > detail.stok_tersedia) return `Jumlah tidak boleh melebihi stok tersedia (${detail.stok_tersedia})`;
        return null;
    };

    const validationError = getValidationError();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || validationError) return;

        setSubmitting(true);
        setError(null);
        try {
            const result = await finalizeRequest(parseInt(id), finalQty);
            setSuccess(result.message);
            // Redirect after short delay
            setTimeout(() => navigate('/approval'), 2000);
        } catch (err: any) {
            let msg = 'Gagal menyelesaikan permintaan';
            try {
                const parsed = JSON.parse(err.message);
                msg = parsed.message || msg;
            } catch {
                msg = err.message || msg;
            }
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartReview = async () => {
        if (!id) return;
        setSubmitting(true);
        try {
            await reviewRequest(parseInt(id));
            // Reload details to refresh status
            const data = await fetchApprovalDetail(parseInt(id));
            setDetail(data);
            setSuccess('Status diupdate ke Review. Silakan lanjutkan.');
        } catch (err: any) {
            let msg = 'Gagal update status';
            try {
                const parsed = JSON.parse(err.message);
                msg = parsed.message || msg;
            } catch {
                msg = err.message || msg;
            }
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="history-page">
                <div className="history-card" style={{ maxWidth: '600px' }}>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                        Memuat data...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !detail) {
        return (
            <div className="history-page">
                <div className="history-card" style={{ maxWidth: '600px' }}>
                    <h2 className="history-title">Review Barang Keluar</h2>
                    <p className="danger-text" role="alert">{error}</p>
                    <div style={{ marginTop: '16px' }}>
                        <Button type="button" variant="secondary" onClick={() => navigate('/approval')}>
                            ← Kembali ke Approval
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="history-page">
            <div className="history-card" style={{ maxWidth: '600px' }}>
                <h2 className="history-title" style={{ color: 'var(--text-muted)' }}>
                    {detail && (detail.status === 'APPROVED' || detail.status === 'FINISHED')
                        ? 'Detail Barang Keluar'
                        : 'Review Barang Keluar'}
                </h2>

                {success && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'var(--success-bg, #d4edda)',
                        color: 'var(--success-text, #155724)',
                        borderRadius: '6px',
                        marginBottom: '16px'
                    }}>
                        {success}
                    </div>
                )}
                {error && <p className="danger-text" style={{ marginBottom: '16px' }}>{error}</p>}

                {detail && (
                    <form onSubmit={handleSubmit} className="edit-form">
                        {/* Warning if PENDING */}
                        {detail.status === 'PENDING' && (
                            <div style={{
                                padding: '12px',
                                background: '#fff3cd',
                                color: '#856404',
                                borderRadius: '6px',
                                marginBottom: '16px',
                                fontSize: '14px'
                            }}>
                                ⚠️ Permintaan ini masih <strong>PENDING</strong>. Klik "Mulai Review" untuk memproses.
                            </div>
                        )}

                        {/* Nama Barang (readonly) */}
                        <div className="form-group">
                            <label style={{ color: 'var(--text-muted)' }}>Nama Barang</label>
                            <input
                                type="text"
                                value={detail.name}
                                readOnly
                                style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }}
                            />
                        </div>

                        {/* Kode Barang (readonly) */}
                        <div className="form-group">
                            <label style={{ color: 'var(--text-muted)' }}>Kode Barang</label>
                            <input
                                type="text"
                                value={detail.kode_barang || '-'}
                                readOnly
                                style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }}
                            />
                        </div>

                        {/* Lokasi Barang (readonly) */}
                        <div className="form-group">
                            <label style={{ color: 'var(--text-muted)' }}>Lokasi Barang</label>
                            <input
                                type="text"
                                value={detail.lokasi_barang || '-'}
                                readOnly
                                style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }}
                            />
                        </div>

                        {/* Quota Info Box REMOVED */}

                        {/* Jumlah (editable ONLY if APPROVAL_REVIEW) */}
                        <div className="form-group">
                            <label style={{ color: 'var(--text-muted)' }}>Jumlah Disetujui</label>
                            <input
                                type="number"
                                min="1"
                                max={Math.min(
                                    detail.requestQty,
                                    detail.stok_tersedia
                                )}
                                value={finalQty}
                                onChange={handleQtyChange}
                                required
                                readOnly={detail.status !== 'APPROVAL_REVIEW'}
                                style={{
                                    borderColor: validationError ? '#c63d3d' : undefined,
                                    background: detail.status !== 'APPROVAL_REVIEW' ? 'var(--surface-alt)' : undefined,
                                    cursor: detail.status !== 'APPROVAL_REVIEW' ? 'not-allowed' : 'text'
                                }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Permintaan asli: {detail.requestQty} · Stok: {detail.stok_tersedia}
                            </span>
                            {detail.status === 'APPROVAL_REVIEW' && validationError && (
                                <span style={{ fontSize: '13px', color: 'var(--danger-text, #d73a49)', marginTop: '2px' }}>
                                    {validationError}
                                </span>
                            )}
                        </div>

                        {/* Satuan (readonly) */}
                        <div className="form-group">
                            <label style={{ color: 'var(--text-muted)' }}>Satuan</label>
                            <input
                                type="text"
                                value={detail.satuan}
                                readOnly
                                style={{ background: 'var(--surface-alt)', cursor: 'not-allowed' }}
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="form-actions" style={{ marginTop: '8px' }}>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/approval')}
                                disabled={submitting}
                            >
                                ← Kembali
                            </Button>

                            {/* Show logic based on status */}
                            {detail.status === 'PENDING' ? (
                                <Button
                                    type="button"
                                    onClick={handleStartReview}
                                    disabled={submitting}
                                >
                                    Mulai Review
                                </Button>
                            ) : detail.status === 'APPROVAL_REVIEW' ? (
                                <Button
                                    type="submit"
                                    disabled={submitting || !!validationError}
                                >
                                    <SaveIcon /> {submitting ? 'Memproses...' : 'Selesai & Catat Barang Keluar'}
                                </Button>
                            ) : (
                                <div style={{
                                    padding: '8px 12px',
                                    background: 'var(--surface-alt)',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}>
                                    Status: {detail.status}
                                </div>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ApprovalFinalize;
