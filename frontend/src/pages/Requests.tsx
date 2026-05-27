import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { fetchRequests, RequestItem } from '../api/requests.api';
import { fetchNewItemRequests, createNewItemRequest, NewItemRequest } from '../api/newItemRequests.api';
import useAuth from '../hooks/useAuth';
import { formatDateV2 } from '../utils/dateUtils';
import { useToast } from '../components/ui/Toast';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';
import { useTranslation } from '../hooks/useTranslation';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

type TabType = 'ambil' | 'baru';
type AmbilSubTab = 'aktif' | 'riwayat';

const getStatusVariant = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'APPROVED' || s === 'FINISHED') return 'approved';
  if (s === 'REJECTED') return 'rejected';
  if (s === 'APPROVAL_REVIEW') return 'review';
  return 'pending';
};

const formatStatus = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'APPROVAL_REVIEW') return 'Review';
  if (s === 'FINISHED') return 'Selesai';
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

const Requests = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ambil');
  const [ambilSubTab, setAmbilSubTab] = useState<AmbilSubTab>('aktif');
  const [ambilData, setAmbilData] = useState<RequestItem[]>([]);
  const [baruData, setBaruData] = useState<NewItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isUser = hasRole(['user']);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // New item form state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    item_name: '',
    description: '',
    satuan: '',
    category: '',
    reason: '',
  });

  const loadAmbilData = useCallback(() => {
    setLoading(true);
    fetchRequests()
      .then((rows) => {
        if (!isUser) {
          setAmbilData(rows);
          return;
        }
        const isActiveStatus = (r: RequestItem) => {
          const s = r.status.toUpperCase();
          return s === 'PENDING' || s === 'APPROVAL_REVIEW';
        };
        const filtered = rows.filter((r) =>
          ambilSubTab === 'aktif' ? isActiveStatus(r) : !isActiveStatus(r)
        );
        setAmbilData(filtered);
      })
      .catch(() => {
        setAmbilData([]);
        showToast('Gagal memuat data dari server');
      })
      .finally(() => setLoading(false));
  }, [ambilSubTab, isUser, showToast]);

  const loadBaruData = useCallback(() => {
    setLoading(true);
    fetchNewItemRequests()
      .then((rows) => setBaruData(rows))
      .catch(() => {
        setBaruData([]);
        showToast('Gagal memuat data dari server');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'ambil') loadAmbilData();
    else loadBaruData();
  }, [activeTab, ambilSubTab, loadAmbilData, loadBaruData]);

  const handleChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.item_name.trim()) {
      showToast('Nama barang wajib diisi');
      return;
    }
    setSaving(true);
    createNewItemRequest({
      item_name: formValues.item_name.trim(),
      description: formValues.description.trim() || undefined,
      satuan: formValues.satuan.trim() || undefined,
      category: formValues.category.trim() || undefined,
      reason: formValues.reason.trim() || undefined,
    })
      .then(() => {
        showToast('Request barang baru berhasil dikirim', 'success');
        setFormValues({ item_name: '', description: '', satuan: '', category: '', reason: '' });
        setShowForm(false);
        loadBaruData();
      })
      .catch((err: any) => {
        let msg = 'Gagal mengirim request';
        if (err?.message) {
          try {
            const parsed = JSON.parse(err.message);
            msg = parsed.message || msg;
          } catch {
            msg = err.message;
          }
        }
        showToast(msg);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="requests-page">
      <div className="requests-header">
        <h2 className="history-title">{t('requests.title')}</h2>
        {activeTab === 'ambil' && isUser && (
          <Button type="button" variant="secondary" onClick={() => navigate('/requests/create')}>
            <PlusIcon />
            <span>Ambil Barang</span>
          </Button>
        )}
        {activeTab === 'baru' && (
          <Button type="button" variant="secondary" onClick={() => setShowForm(!showForm)}>
            <PlusIcon />
            <span>{showForm ? 'Tutup Form' : 'Request Baru'}</span>
          </Button>
        )}
      </div>

      <div className="request-tabs">
        <button
          onClick={() => setActiveTab('ambil')}
          className={activeTab === 'ambil' ? 'request-tab request-tab--active' : 'request-tab'}
        >
          Ambil Barang
        </button>
        <button
          onClick={() => setActiveTab('baru')}
          className={activeTab === 'baru' ? 'request-tab request-tab--active' : 'request-tab'}
        >
          Request Barang Baru
        </button>
      </div>

      {/* ========== TAB: AMBIL BARANG ========== */}
      {activeTab === 'ambil' && (
        <>
          {isUser && (
            <div
              role="tablist"
              aria-label="Filter ambil barang"
              className="segmented-tabs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={ambilSubTab === 'aktif' ? 'true' : 'false'}
                onClick={() => setAmbilSubTab('aktif')}
                className={ambilSubTab === 'aktif' ? 'segmented-tab segmented-tab--active' : 'segmented-tab'}
              >
                Sedang diproses
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ambilSubTab === 'riwayat' ? 'true' : 'false'}
                onClick={() => setAmbilSubTab('riwayat')}
                className={ambilSubTab === 'riwayat' ? 'segmented-tab segmented-tab--active' : 'segmented-tab'}
              >
                Riwayat
              </button>
            </div>
          )}
          <div className="history-card">
          <Table>
            <THead>
              <TR>
                <TH className="th-width-52">No</TH>
                <TH>Tanggal</TH>
                <TH>Nama Barang</TH>
                <TH>Jumlah</TH>
                <TH>Satuan</TH>
                <TH>Penerima</TH>
                <TH>Unit</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <SkeletonTableRows rows={5} columns={8} />
              ) : ambilData.length === 0 ? (
                <EmptyTableRow
                  colSpan={8}
                  title={t('requests.noData')}
                  description={t('requests.noDataDesc')}
                />
              ) : (
                ambilData.map((row, idx) => (
                  <TR key={row.id}>
                    <TD>{idx + 1}</TD>
                    <TD>{formatDateV2(row.date)}</TD>
                    <TD>{row.item}</TD>
                    <TD>{row.qty}</TD>
                    <TD>{row.unit}</TD>
                    <TD>{row.receiver}</TD>
                    <TD>{row.dept}</TD>
                    <TD>
                      <Badge variant={getStatusVariant(row.status)}>
                        {formatStatus(row.status)}
                      </Badge>
                      {row.status?.toUpperCase() === 'REJECTED' && row.reject_reason && (
                        <div className="status-note status-note--danger">
                          Alasan: {row.reject_reason}
                        </div>
                      )}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          <MobileCardList
            isEmpty={ambilData.length === 0}
            isLoading={loading}
            emptyMessage={t('requests.noData')}
          >
            {ambilData.map((row, idx) => (
              <MobileCard
                key={row.id}
                header={
                  <>
                    <span className="mobile-card-header-title">{row.item}</span>
                    <Badge variant={getStatusVariant(row.status)}>{formatStatus(row.status)}</Badge>
                  </>
                }
                fields={[
                  { label: 'No', value: idx + 1 },
                  { label: 'Tanggal', value: formatDateV2(row.date) },
                  { label: 'Jumlah', value: `${row.qty} ${row.unit}` },
                  { label: 'Penerima', value: row.receiver },
                  { label: 'Unit', value: row.dept },
                  ...(row.status?.toUpperCase() === 'REJECTED' && row.reject_reason
                    ? [{ label: 'Alasan ditolak', value: row.reject_reason }]
                    : []),
                ]}
              />
            ))}
          </MobileCardList>
        </div>
        </>
      )}

      {/* ========== TAB: REQUEST BARANG BARU ========== */}
      {activeTab === 'baru' && (
        <>
          {/* New Item Form */}
          {showForm && (
            <div className="history-card mb-4">
              <div className="history-title title-inline mb-4">
                <PlusIcon /> <span>Form Request Barang Baru</span>
              </div>
              <p className="form-hint">
                Request barang yang <strong>belum ada</strong> di inventory. Barang yang sudah ada gunakan tab "Ambil Barang".
              </p>

              <form className="form-grid responsive-modal-form" onSubmit={handleSubmitNewItem}>
                <label className="form-field">
                  <span className="form-label">Nama Barang <span className="required-mark">*</span></span>
                  <input className="input-control" value={formValues.item_name} onChange={(e) => handleChange('item_name', e.target.value)} placeholder="Contoh: Spidol Boardmarker Biru" />
                </label>
                <label className="form-field">
                  <span className="form-label">Deskripsi</span>
                  <input className="input-control" value={formValues.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Deskripsi tambahan (opsional)" />
                </label>
                <label className="form-field">
                  <span className="form-label">Satuan</span>
                  <input className="input-control" value={formValues.satuan} onChange={(e) => handleChange('satuan', e.target.value)} placeholder="Contoh: pcs, pack, rim (opsional)" />
                </label>
                <label className="form-field">
                  <span className="form-label">Kategori</span>
                  <input className="input-control" value={formValues.category} onChange={(e) => handleChange('category', e.target.value)} placeholder="Contoh: ATK, Elektronik (opsional)" />
                </label>
                <label className="form-field">
                  <span className="form-label">Alasan Request</span>
                  <input className="input-control" value={formValues.reason} onChange={(e) => handleChange('reason', e.target.value)} placeholder="Jelaskan alasan request (opsional)" />
                </label>
                <div className="form-actions form-actions-wide">
                  <div />
                  <Button type="submit" variant="secondary" disabled={saving}>
                    <PlusIcon />
                    <span>{saving ? 'Mengirim...' : 'Kirim Request'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* New Item List */}
          <div className="history-card">
            <Table>
              <THead>
                <TR>
                  <TH className="th-width-52">No</TH>
                  <TH>Nama Barang</TH>
                  <TH>Deskripsi</TH>
                  <TH>Satuan</TH>
                  <TH>Tanggal</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <SkeletonTableRows rows={5} columns={6} />
                ) : baruData.length === 0 ? (
                  <EmptyTableRow
                    colSpan={6}
                    title="Belum ada request barang baru"
                    description="Ajukan barang yang belum tersedia di inventory melalui tombol Request Baru."
                  />
                ) : (
                  baruData.map((row, idx) => (
                    <TR key={row.id}>
                      <TD>{idx + 1}</TD>
                      <TD>{row.item_name}</TD>
                      <TD>{row.description || '-'}</TD>
                      <TD>{row.satuan || '-'}</TD>
                      <TD>{formatDate(row.created_at)}</TD>
                      <TD>
                        <Badge variant={getStatusVariant(row.status)}>
                          {formatStatus(row.status)}
                        </Badge>
                        {row.status === 'REJECTED' && row.reject_reason && (
                          <div className="status-note status-note--danger">
                            Alasan: {row.reject_reason}
                          </div>
                        )}
                        {row.status === 'APPROVED' && row.approved_quantity && (
                          <div className="status-note status-note--success">
                            Qty: {row.approved_quantity}
                          </div>
                        )}
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>

            <MobileCardList isEmpty={baruData.length === 0} isLoading={loading} emptyMessage="Belum ada request barang baru">
              {baruData.map((row, idx) => (
                <MobileCard
                  key={row.id}
                  header={
                    <>
                      <span className="mobile-card-header-title">{row.item_name}</span>
                      <Badge variant={getStatusVariant(row.status)}>{formatStatus(row.status)}</Badge>
                    </>
                  }
                  fields={[
                    { label: 'No', value: idx + 1 },
                    { label: 'Deskripsi', value: row.description || '-' },
                    { label: 'Satuan', value: row.satuan || '-' },
                    { label: 'Tanggal', value: formatDate(row.created_at) },
                    ...(row.status === 'REJECTED' && row.reject_reason ? [{ label: 'Alasan Ditolak', value: row.reject_reason }] : []),
                    ...(row.status === 'APPROVED' && row.approved_quantity ? [{ label: 'Qty Disetujui', value: row.approved_quantity }] : []),
                  ]}
                />
              ))}
            </MobileCardList>
          </div>
        </>
      )}
    </div>
  );
};

export default Requests;
