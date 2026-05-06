import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { fetchBarangKosong, BarangKosongItem } from '../api/barangKosong.api';
import { FileText } from 'lucide-react';
import { exportToPdf } from '../utils/exportPdf';
import { getWIBInputDate } from '../utils/dateUtils';
import { SkeletonTableRows } from '../components/ui/Skeleton';

const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 9V4h12v5" />
    <path d="M6 14h12v6H6z" />
    <path d="M6 10H5a2 2 0 0 0-2 2v4h3" />
    <path d="M18 10h1a2 2 0 0 1 2 2v4h-3" />
    <path d="M9 16h6" />
  </svg>
);

const BarangKosong = () => {
  const [items, setItems] = useState<BarangKosongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchBarangKosong()
      .then((data) => {
        if (!mounted) return;
        setItems(data);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Gagal memuat data barang kosong');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="history-page">
      <style>{`
        /* Print Header - Only visible when printing */
        .print-header {
          display: none;
        }

        @media print {
          @page {
            /* Set print margins */
            margin: 20mm;
          }
          
          body { 
            background: #fff; 
            color: #000;
          }

          /* Hide UI elements not meant for print */
          .sidebar, 
          .topbar, 
          .mobile-topbar, 
          .mobile-bottom-nav, 
          .mobile-drawer, 
          .mobile-drawer-overlay, 
          .print-action, 
          .mobile-card-list { 
            display: none !important; 
          }

          /* Reset layouts that might constrain height or add scrollbars */
          .app-shell, 
          .desktop-layout, 
          .mobile-layout, 
          .main-panel, 
          .content-area, 
          .history-page { 
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            grid-template-columns: 1fr !important;
          }

          /* Force Desktop Table to show and remove card styling */
          .table-shell, 
          .history-card { 
            display: block !important;
            overflow: visible !important;
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important;
          }

          .requests-header,
          .history-title {
            display: none !important;
          }

          /* Make table printer-friendly */
          table { 
            width: 100% !important; 
            min-width: 0 !important;
            max-width: 100% !important;
            border-collapse: collapse !important; 
            page-break-inside: auto !important;
          }
          tr { 
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          th, td { 
            border: 1px solid #000 !important; 
            padding: 8px 12px !important; 
            text-align: left !important;
            color: #000 !important;
          }
          th {
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Show custom print header */
          .print-header {
            display: block !important;
            margin-bottom: 24px;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
          }
          .print-header h1 {
            margin: 0 0 4px 0;
            font-size: 24px;
          }
          .print-header p {
            margin: 0;
            color: #555;
            font-size: 14px;
          }
        }
      `}</style>

      {/* Actual Print Header rendered in DOM but hidden via CSS unless printing */}
      <div className="print-header">
        <h1>Laporan Barang Kosong</h1>
        <p>Inventory ATK</p>
        <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="requests-header section-spacer-sm">
        <h2 className="history-title">List Barang Kosong</h2>
        <Button
          type="button"
          variant="secondary"
          onClick={() => exportToPdf({
            filename: `Barang_Kosong_${getWIBInputDate()}`,
            title: 'Laporan Barang Kosong',
            columns: [
              { header: 'No', dataKey: 'no' },
              { header: 'Nama Barang', dataKey: 'name' },
              { header: 'Kode Barang', dataKey: 'code' },
              { header: 'Lokasi Simpan', dataKey: 'location' },
            ],
            data: items.map((item, idx) => ({ no: idx + 1, name: item.name, code: item.code || '-', location: item.location || '-' }))
          })}
          disabled={items.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={16} />
          <span>PDF</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="print-action"
          onClick={() => typeof window !== 'undefined' && window.print()}
        >
          <PrintIcon />
          <span>Print</span>
        </Button>
      </div>

      <div className="history-card">
        {error && <div className="alert-danger">{error}</div>}

        <Table>
          <THead>
            <TR>
              <TH style={{ width: '52px' }}>No</TH>
              <TH>Nama Barang</TH>
              <TH>Kode Barang</TH>
              <TH>Lokasi Simpan</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={6} columns={4} />
            ) : items.length === 0 ? (
              <TR>
                <TD colSpan={4}>Tidak ada data</TD>
              </TR>
            ) : (
              items.map((item, idx) => (
                <TR key={item.id}>
                  <TD>{idx + 1}</TD>
                  <TD>{item.name}</TD>
                  <TD>{item.code ?? '-'}</TD>
                  <TD>{item.location ?? '-'}</TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        {/* Mobile Card View */}
        <MobileCardList
          isEmpty={items.length === 0}
          isLoading={loading}
          emptyMessage="Tidak ada barang kosong"
        >
          {items.map((item, idx) => (
            <MobileCard
              key={item.id}
              header={
                <>
                  <span className="mobile-card-header-title">{item.name}</span>
                  <span className="badge badge-rejected">Habis</span>
                </>
              }
              fields={[
                { label: 'No', value: idx + 1 },
                { label: 'Kode', value: item.code ?? '-' },
                { label: 'Lokasi', value: item.location ?? '-' },
              ]}
            />
          ))}
        </MobileCardList>
      </div>
    </div>
  );
};

export default BarangKosong;
