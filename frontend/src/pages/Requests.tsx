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
import { getStatusLabel } from '../utils/status';

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

const formatStatus = (status: string, t: any) => {
  return getStatusLabel(status, t);
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
        showToast(t('common.fetchError'));
      })
      .finally(() => setLoading(false));
  }, [ambilSubTab, isUser, showToast]);

  const loadBaruData = useCallback(() => {
    setLoading(true);
    fetchNewItemRequests()
      .then((rows) => setBaruData(rows))
      .catch(() => {
        setBaruData([]);
        showToast(t('common.fetchError'));
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
      showToast(t('toast.requests.nameRequired'));
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
        showToast(t('toast.requests.newRequestSuccess'));
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
            <span>{t('requests.takeItem')}</span>
          </Button>
        )}
        {activeTab === 'baru' && (
          <Button type="button" variant="secondary" onClick={() => setShowForm(!showForm)}>
            <PlusIcon />
            <span>{showForm ? t('requests.closeForm') : t('requests.newRequest')}</span>
          </Button>
        )}
      </div>

      <div className="request-tabs">
        <button
          onClick={() => setActiveTab('ambil')}
          className={activeTab === 'ambil' ? 'request-tab request-tab--active' : 'request-tab'}
        >
          {t('requests.takeItem')}
        </button>
        <button
          onClick={() => setActiveTab('baru')}
          className={activeTab === 'baru' ? 'request-tab request-tab--active' : 'request-tab'}
        >
          {t('requests.newItemRequest')}
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
                {t('requests.processing')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ambilSubTab === 'riwayat' ? 'true' : 'false'}
                onClick={() => setAmbilSubTab('riwayat')}
                className={ambilSubTab === 'riwayat' ? 'segmented-tab segmented-tab--active' : 'segmented-tab'}
              >
                {t('requests.history')}
              </button>
            </div>
          )}
          <div className="history-card">
          <Table>
            <THead>
              <TR>
                <TH className="th-width-52">{t('inventory.columns.no')}</TH>
                <TH>{t('requests.date')}</TH>
                <TH>{t('requests.itemName')}</TH>
                <TH>{t('requests.quantity')}</TH>
                <TH>{t('requests.unit')}</TH>
                <TH>{t('requests.receiver')}</TH>
                <TH>{t('requests.department')}</TH>
                <TH>{t('requests.status')}</TH>
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
                        {formatStatus(row.status, t)}
                      </Badge>
                      {row.status?.toUpperCase() === 'REJECTED' && row.reject_reason && (
                        <div className="status-note status-note--danger">
                          {t('requests.reason')}: {row.reject_reason}
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
                    <Badge variant={getStatusVariant(row.status)}>{formatStatus(row.status, t)}</Badge>
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
                <PlusIcon /> <span>{t('requests.requestNewItemTitle')}</span>
              </div>
              <p className="form-hint">
                {t('requests.requestNewItemDesc')}
              </p>

              <form className="form-grid responsive-modal-form" onSubmit={handleSubmitNewItem}>
                <label className="form-field">
                  <span className="form-label">Nama Barang <span className="required-mark">*</span></span>
                  <input className="input-control" value={formValues.item_name} onChange={(e) => handleChange('item_name', e.target.value)} placeholder={t('requests.descExample')} />
                </label>
                <label className="form-field">
                  <span className="form-label">{t('requests.description')}</span>
                  <input className="input-control" value={formValues.description} onChange={(e) => handleChange('description', e.target.value)} placeholder={t('requests.descAddExample')} />
                </label>
                <label className="form-field">
                  <span className="form-label">{t('requests.unit')}</span>
                  <input className="input-control" value={formValues.satuan} onChange={(e) => handleChange('satuan', e.target.value)} placeholder={t('requests.unitExample')} />
                </label>
                <label className="form-field">
                  <span className="form-label">{t('requests.category')}</span>
                  <input className="input-control" value={formValues.category} onChange={(e) => handleChange('category', e.target.value)} placeholder={t('requests.catExample')} />
                </label>
                <label className="form-field">
                  <span className="form-label">{t('requests.requestReason')}</span>
                  <input className="input-control" value={formValues.reason} onChange={(e) => handleChange('reason', e.target.value)} placeholder={t('requests.reasonExample')} />
                </label>
                <div className="form-actions form-actions-wide">
                  <div />
                  <Button type="submit" variant="secondary" disabled={saving}>
                    <PlusIcon />
                    <span>{saving ? t('requests.processing') + '...' : t('requests.submitRequest')}</span>
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
                  <TH className="th-width-52">{t('inventory.columns.no')}</TH>
                  <TH>{t('requests.itemName')}</TH>
                  <TH>{t('requests.description')}</TH>
                  <TH>{t('requests.unit')}</TH>
                  <TH>{t('requests.date')}</TH>
                  <TH>{t('requests.status')}</TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <SkeletonTableRows rows={5} columns={6} />
                ) : baruData.length === 0 ? (
                  <EmptyTableRow
                    colSpan={6}
                    title="Belum ada request barang baru"
                    description={t('requests.emptyNewRequest')}
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
                          {formatStatus(row.status, t)}
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
                      <Badge variant={getStatusVariant(row.status)}>{formatStatus(row.status, t)}</Badge>
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
