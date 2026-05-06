import React, { useState } from 'react';
import { useOpname, OpnameSession } from '../hooks/useOpname';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { FileText } from 'lucide-react';
import { exportToPdf } from '../utils/exportPdf';
import { useToast } from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getWIBInputDate } from '../utils/dateUtils';
import { SkeletonTableRows } from '../components/ui/Skeleton';

const StockOpname = () => {
    const { sessions, loading, error, createSession, deleteSession, getSession, updateItem, finalizeSession } = useOpname();
    const [activeSession, setActiveSession] = useState<OpnameSession | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [formNotes, setFormNotes] = useState('');
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
    const { showToast } = useToast();

    const handleCreate = async () => {
        try {
            setActionLoading(true);
            const id = await createSession(formNotes);
            await loadSession(id);
            setFormNotes('');
        } catch (err: any) {
            showToast(err.message || 'Gagal membuat sesi opname', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const loadSession = async (id: number) => {
        try {
            setActionLoading(true);
            const sess = await getSession(id);
            setActiveSession(sess);
        } catch (err: any) {
            showToast(err.message || 'Gagal memuat sesi opname', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleItemChange = async (itemId: number, physicalQty: number, notes: string) => {
        if (!activeSession) return;
        try {
            await updateItem(activeSession.id, itemId, physicalQty, notes);
            // Optimistically update local state
            setActiveSession({
                ...activeSession,
                items: activeSession.items?.map(i => i.item_id === itemId ? { ...i, physical_qty: physicalQty, difference: physicalQty - i.system_qty, notes } : i)
            });
        } catch (err: any) {
            showToast('Gagal update item: ' + (err.message || 'Terjadi kesalahan'), 'error');
        }
    };

    const handleFinalize = async () => {
        if (!activeSession) return;
        try {
            setActionLoading(true);
            await finalizeSession(activeSession.id);
            showToast('Berhasil finalisasi', 'success');
            setShowFinalizeConfirm(false);
            setActiveSession(null);
        } catch (err: any) {
            showToast(err.message || 'Gagal finalize', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (activeSession) {
        return (
            <div className="page-container">
                <header className="page-header page-header--stacked">
                    <div>
                        <h1 className="page-title">Sesi Opname #{activeSession.id}</h1>
                        <p className="page-description">Status: <span className="text-strong">{activeSession.status}</span> | Tanggal: {new Date(activeSession.opname_date).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="action-bar action-bar--wrap">
                        <Button variant="secondary" onClick={() => setActiveSession(null)}>Kembali</Button>
                        <Button variant="secondary" onClick={() => exportToPdf({
                            filename: `Stock_Opname_${activeSession.id}_${getWIBInputDate()}`,
                            title: `Laporan Stock Opname #${activeSession.id}`,
                            subtitle: `Status: ${activeSession.status} | Tanggal: ${new Date(activeSession.opname_date).toLocaleString('id-ID')}`,
                            columns: [
                                { header: 'Kode', dataKey: 'kode_barang' },
                                { header: 'Nama Barang', dataKey: 'nama_barang' },
                                { header: 'Stok Sistem', dataKey: 'system_qty' },
                                { header: 'Stok Fisik', dataKey: 'physical_qty' },
                                { header: 'Selisih', dataKey: 'difference' },
                                { header: 'Catatan', dataKey: 'notes' },
                            ],
                            data: (activeSession.items || []).map(i => ({
                                ...i,
                                kode_barang: i.kode_barang || '-',
                                notes: i.notes || '-',
                            }))
                        })} className="action-button-inline">
                            <FileText size={16} /> PDF
                        </Button>
                        {activeSession.status === 'DRAFT' && (
                            <Button onClick={() => setShowFinalizeConfirm(true)} disabled={actionLoading}>
                                {actionLoading ? 'Menyimpan...' : 'Finalisasi & Update Stok'}
                            </Button>
                        )}
                    </div>
                </header>

                <div className="history-card table-scroll-card">
                    <Table>
                        <THead>
                            <TR>
                                <TH>Kode</TH>
                                <TH>Nama Barang</TH>
                                <TH>Stok Sistem</TH>
                                <TH className="th-width-150">Stok Fisik</TH>
                                <TH>Selisih</TH>
                                <TH>Catatan (Opsional)</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {activeSession.items?.map(item => (
                                <TR key={item.id} className={item.difference !== 0 ? 'row-warning' : ''}>
                                    <TD>{item.kode_barang || '-'}</TD>
                                    <TD>{item.nama_barang}</TD>
                                    <TD>{item.system_qty}</TD>
                                    <TD>
                                        <Input 
                                            type="number" 
                                            value={item.physical_qty}
                                            disabled={activeSession.status === 'FINALIZED'}
                                            onChange={(e) => handleItemChange(item.item_id, parseInt(e.target.value) || 0, item.notes)}
                                            className="input-control input-control--compact"
                                        />
                                    </TD>
                                    <TD>
                                        <span className={item.difference < 0 ? 'text-danger text-strong' : item.difference > 0 ? 'text-success text-strong' : ''}>
                                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                                        </span>
                                    </TD>
                                    <TD>
                                        <Input 
                                            type="text" 
                                            value={item.notes || ''}
                                            disabled={activeSession.status === 'FINALIZED'}
                                            onChange={(e) => handleItemChange(item.item_id, item.physical_qty, e.target.value)}
                                            className="input-control input-control--compact"
                                            placeholder="Alasan selisih..."
                                        />
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>

                    <MobileCardList isEmpty={(activeSession.items?.length ?? 0) === 0} isLoading={false} emptyMessage="Tidak ada barang dalam sesi.">
                        {(activeSession.items || []).map((item) => (
                            <MobileCard
                                key={item.id}
                                className={item.difference !== 0 ? 'card-warning' : undefined}
                                header={<span className="mobile-card-header-title">{item.nama_barang}</span>}
                                fields={[
                                    { label: 'Kode', value: item.kode_barang || '-' },
                                    { label: 'Stok sistem', value: item.system_qty },
                                    {
                                        label: 'Selisih',
                                        value: (
                                            <span className={item.difference < 0 ? 'text-danger text-strong' : item.difference > 0 ? 'text-success text-strong' : ''}>
                                                {item.difference > 0 ? `+${item.difference}` : item.difference}
                                            </span>
                                        ),
                                    },
                                ]}
                                actions={
                                    <div className="form-stack-compact">
                                        <label className="form-label form-label--compact">Stok fisik</label>
                                        <Input
                                            type="number"
                                            value={item.physical_qty}
                                            disabled={activeSession.status === 'FINALIZED'}
                                            onChange={(e) => handleItemChange(item.item_id, parseInt(e.target.value) || 0, item.notes)}
                                            className="input-control input-control--compact"
                                        />
                                        <label className="form-label form-label--compact">Catatan</label>
                                        <Input
                                            type="text"
                                            value={item.notes || ''}
                                            disabled={activeSession.status === 'FINALIZED'}
                                            onChange={(e) => handleItemChange(item.item_id, item.physical_qty, e.target.value)}
                                            className="input-control input-control--compact"
                                            placeholder="Alasan selisih..."
                                        />
                                    </div>
                                }
                            />
                        ))}
                    </MobileCardList>
                </div>
                <ConfirmDialog
                    open={showFinalizeConfirm}
                    title="Finalisasi Stock Opname"
                    message="Apakah Anda yakin ingin memfinalisasi opname ini? Stok master akan diupdate dan tindakan ini tidak dapat dibatalkan."
                    confirmLabel="Finalisasi"
                    danger
                    loading={actionLoading}
                    onConfirm={handleFinalize}
                    onCancel={() => setShowFinalizeConfirm(false)}
                />
            </div>
        );
    }

    return (
        <div className="page-container">
            <header className="page-header page-header--stacked">
                <div>
                    <h1 className="page-title">Stock Opname</h1>
                    <p className="page-description">Pencatatan dan pencocokan stok fisik secara berkala.</p>
                </div>
            </header>

            <div className="history-card page-card-spacing">
                <h3 className="section-heading">Mulai Sesi Baru</h3>
                <div className="filter-bar">
                    <input 
                        className="input-control input-control--flush filter-field--grow"
                        placeholder="Catatan / Nama Sesi (Opsional)" 
                        value={formNotes} 
                        onChange={(e) => setFormNotes(e.target.value)}
                    />
                    <Button onClick={handleCreate} disabled={actionLoading} className="button-no-shrink">
                        {actionLoading ? 'Membuat...' : '+ Mulai Opname'}
                    </Button>
                </div>
            </div>

            <div className="history-card table-scroll-card">
                {error && <p className="danger-text">{error}</p>}
                <Table>
                    <THead>
                        <TR>
                            <TH>ID</TH>
                            <TH>Tanggal</TH>
                            <TH>Catatan</TH>
                            <TH>Status</TH>
                            <TH>Aksi</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {loading ? (
                            <SkeletonTableRows rows={5} columns={5} />
                        ) : sessions.length === 0 ? (
                            <TR><TD colSpan={5} className="empty-row">Belum ada sesi stock opname.</TD></TR>
                        ) : (
                            sessions.map(s => (
                                <TR key={s.id}>
                                    <TD>#{s.id}</TD>
                                    <TD>{new Date(s.opname_date).toLocaleString('id-ID')}</TD>
                                    <TD>{s.notes || '-'}</TD>
                                    <TD>
                                        <span className={`badge badge-${s.status === 'FINALIZED' ? 'approved' : 'pending'}`}>
                                            {s.status}
                                        </span>
                                    </TD>
                                    <TD>
                                        <div className="action-buttons">
                                            <Button variant="secondary" size="sm" onClick={() => loadSession(s.id)}>
                                                {s.status === 'DRAFT' ? 'Lanjutkan' : 'Lihat Hasil'}
                                            </Button>
                                            {s.status === 'DRAFT' && (
                                                <Button variant="ghost" size="sm" className="danger-text-button" onClick={() => deleteSession(s.id)}>
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>
                                    </TD>
                                </TR>
                            ))
                        )}
                    </TBody>
                </Table>

                <MobileCardList
                    isEmpty={!loading && sessions.length === 0}
                    isLoading={loading}
                    emptyMessage="Belum ada sesi stock opname."
                >
                    {sessions.map((s) => (
                        <MobileCard
                            key={s.id}
                            header={
                                <>
                                    <span className="mobile-card-header-title">#{s.id}</span>
                                    <span className={`badge badge-${s.status === 'FINALIZED' ? 'approved' : 'pending'}`}>{s.status}</span>
                                </>
                            }
                            fields={[
                                { label: 'Tanggal', value: new Date(s.opname_date).toLocaleString('id-ID') },
                                { label: 'Catatan', value: s.notes || '-' },
                            ]}
                            actions={
                                <div className="form-stack-compact">
                                    <Button variant="secondary" size="sm" onClick={() => loadSession(s.id)}>
                                        {s.status === 'DRAFT' ? 'Lanjutkan' : 'Lihat hasil'}
                                    </Button>
                                    {s.status === 'DRAFT' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="danger-text-button"
                                            onClick={() => deleteSession(s.id)}
                                        >
                                            Hapus sesi
                                        </Button>
                                    )}
                                </div>
                            }
                        />
                    ))}
                </MobileCardList>
            </div>
        </div>
    );
};

export default StockOpname;
