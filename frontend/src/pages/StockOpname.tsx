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
import { useTranslation } from '../hooks/useTranslation';

const StockOpname = () => {
    const { sessions, loading, error, createSession, deleteSession, getSession, updateItem, finalizeSession } = useOpname();
    const [activeSession, setActiveSession] = useState<OpnameSession | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [formNotes, setFormNotes] = useState('');
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
    const { showToast } = useToast();
    const { t, language } = useTranslation();

    const handleCreate = async () => {
        try {
            setActionLoading(true);
            const id = await createSession(formNotes);
            await loadSession(id);
            setFormNotes('');
        } catch (err: any) {
            let msg = err.message || t('stockOpname.createError');
            if (msg.includes('sesi DRAFT')) msg = t('stockOpname.draftExistsError');
            showToast(msg, 'error');
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
            showToast(err.message || t('stockOpname.loadError'), 'error');
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
            showToast(t('toast.stockOpname.updateFailed') + (err.message || t('toast.common.errorOccurred')), 'error');
        }
    };

    const handleFinalize = async () => {
        if (!activeSession) return;
        try {
            setActionLoading(true);
            await finalizeSession(activeSession.id);
            showToast(t('toast.stockOpname.finalizeSuccess'));
            setShowFinalizeConfirm(false);
            setActiveSession(null);
        } catch (err: any) {
            showToast(err.message || t('toast.stockOpname.finalizeFailed'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (activeSession) {
        return (
            <div className="page-container">
                <header className="page-header page-header--stacked">
                    <div>
                        <h1 className="page-title">{t('stockOpname.sessionTitle', { id: activeSession.id })}</h1>
                        <p className="page-description">{t('stockOpname.status')}: <span className="text-strong">{activeSession.status}</span> | {t('stockOpname.date')}: {new Date(activeSession.opname_date).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</p>
                    </div>
                    <div className="action-bar action-bar--wrap">
                        <Button variant="secondary" onClick={() => setActiveSession(null)}>{t('common.back')}</Button>
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
                                {actionLoading ? t('common.saving') : t('stockOpname.finalize')}
                            </Button>
                        )}
                    </div>
                </header>

                <div className="history-card table-scroll-card">
                    <Table>
                        <THead>
                            <TR>
                                <TH>{t('inventory.columns.itemCode')}</TH>
                                <TH>{t('inventory.columns.itemName')}</TH>
                                <TH>{t('stockOpname.systemStock')}</TH>
                                <TH className="th-width-150">{t('stockOpname.physicalStock')}</TH>
                                <TH>{t('stockOpname.difference')}</TH>
                                <TH>{t('stockOpname.noteOptional')}</TH>
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
                                            placeholder={t('stockOpname.notePlaceholder')}
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
                                    { label: t('inventory.columns.itemCode'), value: item.kode_barang || '-' },
                                    { label: t('stockOpname.systemStock'), value: item.system_qty },
                                    {
                                        label: t('stockOpname.difference'),
                                        value: (
                                            <span className={item.difference < 0 ? 'text-danger text-strong' : item.difference > 0 ? 'text-success text-strong' : ''}>
                                                {item.difference > 0 ? `+${item.difference}` : item.difference}
                                            </span>
                                        ),
                                    },
                                ]}
                                actions={
                                    <div className="form-stack-compact">
                                        <label className="form-label form-label--compact">{t('stockOpname.physicalStock')}</label>
                                        <Input
                                            type="number"
                                            value={item.physical_qty}
                                            disabled={activeSession.status === 'FINALIZED'}
                                            onChange={(e) => handleItemChange(item.item_id, parseInt(e.target.value) || 0, item.notes)}
                                            className="input-control input-control--compact"
                                        />
                                        <label className="form-label form-label--compact">{t('stockOpname.note')}</label>
                                        <Input
                                            type="text"
                                            value={item.notes || ''}
                                            disabled={activeSession.status === 'FINALIZED'}
                                            onChange={(e) => handleItemChange(item.item_id, item.physical_qty, e.target.value)}
                                            className="input-control input-control--compact"
                                            placeholder={t('stockOpname.notePlaceholder')}
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
                    <h1 className="page-title">{t('stockOpname.title')}</h1>
                    <p className="page-description">{t('stockOpname.subtitle')}</p>
                </div>
            </header>

            <div className="history-card page-card-spacing">
                <h3 className="section-heading">{t('stockOpname.startNewSession')}</h3>
                <div className="filter-bar">
                    <input 
                        className="input-control input-control--flush filter-field--grow"
                        placeholder={t('stockOpname.sessionNotePlaceholder')} 
                        value={formNotes} 
                        onChange={(e) => setFormNotes(e.target.value)}
                    />
                    <Button onClick={handleCreate} disabled={actionLoading} className="button-no-shrink">
                        {actionLoading ? t('common.creating') : t('stockOpname.startOpname')}
                    </Button>
                </div>
            </div>

            <div className="history-card table-scroll-card">
                {error && <p className="danger-text">{error}</p>}
                <Table>
                    <THead>
                        <TR>
                            <TH>{t('stockOpname.id')}</TH>
                            <TH>{t('stockOpname.date')}</TH>
                            <TH>{t('stockOpname.note')}</TH>
                            <TH>{t('stockOpname.status')}</TH>
                            <TH>{t('stockOpname.action')}</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {loading ? (
                            <SkeletonTableRows rows={5} columns={5} />
                        ) : sessions.length === 0 ? (
                            <TR><TD colSpan={5} className="empty-row">{t('stockOpname.noData')}</TD></TR>
                        ) : (
                            sessions.map(s => (
                                <TR key={s.id}>
                                    <TD>#{s.id}</TD>
                                    <TD>{new Date(s.opname_date).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</TD>
                                    <TD>{s.notes || '-'}</TD>
                                    <TD>
                                        <span className={`badge badge-${s.status === 'FINALIZED' ? 'approved' : 'pending'}`}>
                                            {s.status}
                                        </span>
                                    </TD>
                                    <TD>
                                        <div className="action-buttons">
                                            <Button variant="secondary" size="sm" onClick={() => loadSession(s.id)}>
                                                {s.status === 'DRAFT' ? t('stockOpname.continue') : t('stockOpname.viewResult')}
                                            </Button>
                                            {s.status === 'DRAFT' && (
                                                <Button variant="ghost" size="sm" className="danger-text-button" onClick={() => deleteSession(s.id)}>{t('common.delete')}</Button>
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
                    emptyMessage={t('stockOpname.noData')}
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
                                { label: t('stockOpname.date'), value: new Date(s.opname_date).toLocaleString('id-ID') },
                                { label: t('stockOpname.note'), value: s.notes || '-' },
                            ]}
                            actions={
                                <div className="form-stack-compact">
                                    <Button variant="secondary" size="sm" onClick={() => loadSession(s.id)}>
                                        {s.status === 'DRAFT' ? t('stockOpname.continue') : t('stockOpname.viewResult')}
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
