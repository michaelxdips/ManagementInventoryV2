import { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { fetchHistoryKeluar, HistoryEntry, HistoryFilter } from '../api/history.api';
import { Download, FileText } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';
import { formatDateV2, getWIBInputDate } from '../utils/dateUtils';
import { useSearchParams } from 'react-router-dom';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';

const parseDate = (value: string) => (value ? new Date(value) : null);

const HistoryKeluar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<HistoryEntry[]>([]);
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const perPage = 10;

  const loadData = (filter?: HistoryFilter) => {
    setLoading(true);
    setFetchError(null);
    fetchHistoryKeluar(filter)
      .then((rows) => {
        setData(rows);
        setFetchError(null);
      })
      .catch(() => {
        setFetchError('Gagal memuat data dari server');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [from, to]);


  const activeDept = searchParams.get('dept') || '';
  const filteredData = useMemo(() => {
    if (!activeDept) return data;
    return data.filter((row) => (row.dept || '').toLowerCase() === activeDept.toLowerCase());
  }, [activeDept, data]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, filteredData.length);
  const pageRows = filteredData.slice(startIndex, endIndex);

  const applyFilters = () => {
    const nextFrom = parseDate(draftFrom);
    const nextTo = parseDate(draftTo);
    if (nextFrom && nextTo && nextFrom > nextTo) {
      setError('Rentang tanggal tidak valid (dari harus lebih awal)');
      return;
    }
    setError(null);
    setFrom(draftFrom);
    setTo(draftTo);
    loadData({ from: draftFrom || undefined, to: draftTo || undefined });
  };

  const resetFilters = () => {
    setDraftFrom('');
    setDraftTo('');
    setFrom('');
    setTo('');
    setSearchParams({});
    setPage(1);
    setError(null);
    loadData();
  };

  const handleExport = () => {
    exportToExcel(filteredData, [
      { header: 'No', key: 'id' },
      { header: 'Tanggal', key: 'date' },
      { header: 'Nama Barang', key: 'name' },
      { header: 'Kode Barang', key: 'code' },
      { header: 'Jumlah', key: 'qty' },
      { header: 'Satuan', key: 'unit' },
      { header: 'Penerima', key: 'receiver' },
      { header: 'Unit/Dept', key: 'dept' },
    ], {
      filename: `History_Barang_Keluar_${getWIBInputDate()}`,
      sheetName: 'Barang Keluar',
    });
  };

  return (
    <div className="history-page">
      <div className="history-card">
        <div className="page-header--stacked history-header-compact">
          <h2 className="history-title mb-0">History Barang Keluar</h2>
          <div className="action-bar action-bar--wrap">
            <Button type="button" variant="secondary" onClick={() => exportToPdf({
              filename: `History_Barang_Keluar_${getWIBInputDate()}`,
              title: 'Laporan Barang Keluar',
              subtitle: from && to ? `Periode: ${formatDateV2(from)} s/d ${formatDateV2(to)}` : undefined,
              columns: [
                { header: 'Tanggal', dataKey: 'date' },
                { header: 'Nama Barang', dataKey: 'name' },
                { header: 'Kode Barang', dataKey: 'code' },
                { header: 'Jumlah', dataKey: 'qty' },
                { header: 'Satuan', dataKey: 'unit' },
                { header: 'Penerima', dataKey: 'receiver' },
                { header: 'Unit/Dept', dataKey: 'dept' },
              ],
              data: filteredData.map(d => ({ ...d, date: formatDateV2(d.date) }))
            })} disabled={data.length === 0} className="action-button-inline">
              <FileText size={16} />
              PDF
            </Button>
            <Button type="button" variant="secondary" onClick={handleExport} disabled={data.length === 0} className="action-button-inline">
              <Download size={16} />
              Excel
            </Button>
          </div>
        </div>
        {activeDept && (
          <div className="dashboard-filter-pill">
            <span>Filter dashboard: unit {activeDept}</span>
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
          </div>
        )}
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
            <Button type="button" variant="secondary" onClick={applyFilters}>
              Terapkan
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
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
              <TH className="th-width-52">No</TH>
              <TH>Tanggal</TH>
              <TH>Nama Barang</TH>
              <TH>Kode Barang</TH>
              <TH>Jumlah</TH>
              <TH>Satuan</TH>
              <TH>Penerima</TH>
              <TH>Unit</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={6} columns={8} />
            ) : pageRows.length === 0 ? (
              <EmptyTableRow
                colSpan={8}
                title="Tidak ada data pada rentang tanggal ini"
                description={activeDept ? `Tidak ada barang keluar untuk unit ${activeDept} pada filter ini.` : 'Coba ubah filter tanggal atau reset filter untuk melihat semua riwayat barang keluar.'}
              />
            ) : (
              pageRows.map((row, idx) => (
                <TR key={row.id}>
                  <TD>{startIndex + idx + 1}</TD>
                  <TD>{formatDateV2(row.date)}</TD>
                  <TD>{row.name}</TD>
                  <TD>{row.code}</TD>
                  <TD>{row.qty}</TD>
                  <TD>{row.unit}</TD>
                  <TD>{row.receiver}</TD>
                  <TD>{row.dept}</TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        {/* Mobile Card View */}
        <MobileCardList
          isEmpty={pageRows.length === 0}
          isLoading={loading}
          emptyMessage="Tidak ada data pada rentang tanggal ini"
        >
          {pageRows.map((row, idx) => (
            <MobileCard
              key={row.id}
              header={
                <span className="mobile-card-header-title">{row.name}</span>
              }
              fields={[
                { label: 'No', value: startIndex + idx + 1 },
                { label: 'Tanggal', value: formatDateV2(row.date) },
                { label: 'Kode', value: row.code },
                { label: 'Jumlah', value: `${row.qty} ${row.unit}` },
                { label: 'Penerima', value: row.receiver },
                { label: 'Unit', value: row.dept },
              ]}
            />
          ))}
        </MobileCardList>

        <div className="items-footer">
          <span className="items-meta">
            Menampilkan {filteredData.length === 0 ? 0 : startIndex + 1} - {endIndex} dari {filteredData.length} barang
          </span>
          <Pagination current={currentPage} total={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default HistoryKeluar;
