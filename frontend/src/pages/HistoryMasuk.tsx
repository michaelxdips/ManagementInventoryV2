import { useEffect, useState, useCallback } from 'react';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { fetchHistoryMasukPage, HistoryEntry, HistoryFilter } from '../api/history.api';
import { Download, FileText } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';
import { formatDateV2, getWIBInputDate } from '../utils/dateUtils';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';
import { useTranslation } from '../hooks/useTranslation';

const parseDate = (value: string) => (value ? new Date(value) : null);

const HistoryMasuk = () => {
  const [data, setData] = useState<HistoryEntry[]>([]);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const { t } = useTranslation();

  const perPage = 15;

  const loadData = useCallback((filter?: HistoryFilter) => {
    setLoading(true);
    setFetchError(null);
    fetchHistoryMasukPage({ ...filter, page, perPage })
      .then((res) => {
        setData(res.entries);
        setTotalPages(res.pagination.totalPages);
        setFetchError(null);
      })
      .catch(() => {
        setFetchError('Gagal memuat data dari server');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, perPage]);

  useEffect(() => {
    loadData({ from: from || undefined, to: to || undefined });
  }, [loadData, from, to]);

  const handleApply = () => {
    const nextFrom = parseDate(draftFrom);
    const nextTo = parseDate(draftTo);
    if (nextFrom && nextTo && nextFrom > nextTo) {
      setError('Rentang tanggal tidak valid (dari harus lebih awal)');
      return;
    }
    setError(null);
    setFrom(draftFrom);
    setTo(draftTo);
    setPage(1); // Reset to page 1 on filter change
  };

  const handleReset = () => {
    setDraftFrom('');
    setDraftTo('');
    setFrom('');
    setTo('');
    setPage(1);
    setError(null);
  };

  const handleExport = () => {
    exportToExcel(data, [
      { header: 'No', key: 'id' },
      { header: 'Tanggal', key: 'date' },
      { header: 'Nama Barang', key: 'name' },
      { header: 'Kode Barang', key: 'code' },
      { header: 'Jumlah', key: 'qty' },
      { header: 'Satuan', key: 'unit' },
      { header: 'PIC', key: 'pic' },
    ], {
      filename: `History_Barang_Masuk_${getWIBInputDate()}`,
      sheetName: 'Barang Masuk',
    });
  };

  return (
    <div className="history-page">
      <div className="history-card">
        <div className="page-header--stacked history-header-compact">
          <h2 className="history-title mb-0">{t('history.titleIn')}</h2>
          <div className="action-bar action-bar--wrap">
            <Button type="button" variant="secondary" onClick={() => exportToPdf({
              filename: `History_Barang_Masuk_${getWIBInputDate()}`,
              title: 'Laporan Barang Masuk',
              subtitle: from && to ? `Periode: ${formatDateV2(from)} s/d ${formatDateV2(to)}` : undefined,
              columns: [
                { header: 'Tanggal', dataKey: 'date' },
                { header: 'Nama Barang', dataKey: 'name' },
                { header: 'Kode Barang', dataKey: 'code' },
                { header: 'Jumlah', dataKey: 'qty' },
                { header: 'Satuan', dataKey: 'unit' },
                { header: 'PIC', dataKey: 'pic' },
              ],
              data: data.map(d => ({ ...d, date: formatDateV2(d.date) }))
            })} disabled={data.length === 0} className="action-button-inline">
              <FileText size={16} />
              {t('inventory.pdf')}
            </Button>
            <Button type="button" variant="secondary" onClick={handleExport} disabled={data.length === 0} className="action-button-inline">
              <Download size={16} />
              {t('inventory.excel')}
            </Button>
          </div>
        </div>

        <div className="history-filters">
          {error && <p className="danger-text" role="alert">{error}</p>}
          <div className="filter-group">
            <label className="filter-label">Dari Tanggal</label>
            <div className="date-input">
              <span className="date-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M4 9h16" />
                  <path d="M9 3v4M15 3v4" />
                </svg>
              </span>
              <input
                type="date"
                className="input-control date-control"
                placeholder="dd/mm/yyyy"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Hingga Tanggal</label>
            <div className="date-input">
              <span className="date-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M4 9h16" />
                  <path d="M9 3v4M15 3v4" />
                </svg>
              </span>
              <input
                type="date"
                className="input-control date-control"
                placeholder="dd/mm/yyyy"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </div>
          </div>

          <div className="history-actions">
            <Button type="button" variant="secondary" onClick={handleApply}>
              {t('inventory.apply')}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="history-card">
        {fetchError && <p className="danger-text" role="alert">{fetchError}</p>}
        <Table>
          <THead>
            <TR>
              <TH className="th-width-52">{t('inventory.columns.no')}</TH>
              <TH>{t('inventory.columns.date')}</TH>
              <TH>{t('inventory.columns.itemName')}</TH>
              <TH>{t('inventory.columns.itemCode')}</TH>
              <TH>{t('inventory.columns.qty')}</TH>
              <TH>{t('inventory.columns.unit')}</TH>
              <TH>PIC</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={6} columns={7} />
            ) : data.length === 0 ? (
              <EmptyTableRow
                colSpan={7}
                title={t('inventory.noData')}
                description="Coba ubah filter tanggal atau reset filter untuk melihat semua riwayat barang masuk."
              />
            ) : (
              data.map((row, idx) => (
                <TR key={row.id}>
                  <TD>{((page - 1) * perPage) + idx + 1}</TD>
                  <TD>{formatDateV2(row.date)}</TD>
                  <TD>{row.name}</TD>
                  <TD>{row.code}</TD>
                  <TD>{row.qty}</TD>
                  <TD>{row.unit}</TD>
                  <TD>{row.pic}</TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        {/* Mobile Card View */}
        <MobileCardList
          isEmpty={data.length === 0}
          isLoading={loading}
          emptyMessage={t('inventory.noData')}
        >
          {data.map((row, idx) => (
            <MobileCard
              key={row.id}
              header={
                <span className="mobile-card-header-title">{row.name}</span>
              }
              fields={[
                { label: t('inventory.columns.no'), value: ((page - 1) * perPage) + idx + 1 },
                { label: t('inventory.columns.date'), value: formatDateV2(row.date) },
                { label: t('inventory.columns.itemCode'), value: row.code },
                { label: t('inventory.columns.qty'), value: `${row.qty} ${row.unit}` },
                { label: 'PIC', value: row.pic },
              ]}
            />
          ))}
        </MobileCardList>

        <div className="items-footer">
          <span className="items-meta">
            Menampilkan halaman {page} dari {totalPages}
          </span>
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default HistoryMasuk;
