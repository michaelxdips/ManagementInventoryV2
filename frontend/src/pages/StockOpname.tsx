import React, { useState, useEffect, useCallback, useRef } from 'react';
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

interface StockOpnameRowProps {
    item: NonNullable<OpnameSession['items']>[0];
    disabled: boolean;
    t: any;
    onCommitLineChange: (itemId: number, changes: { physical_qty: number; notes: string }) => void;
    registerFlush?: (flushFn: () => void) => () => void;
}

const StockOpnameRow = React.memo(({ item, disabled, t, onCommitLineChange, registerFlush }: StockOpnameRowProps) => {
    const [localQtyStr, setLocalQtyStr] = useState(item.physical_qty.toString());
    const [localNotes, setLocalNotes] = useState(item.notes || '');

    const stateRef = useRef({ qty: item.physical_qty.toString(), notes: item.notes || '' });
    const lastPropRef = useRef({ qty: item.physical_qty, notes: item.notes || '' });
    const flushTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dirtyRef = useRef(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const qtyChanged = item.physical_qty !== lastPropRef.current.qty;
        const notesChanged = (item.notes || '') !== lastPropRef.current.notes;

        if (qtyChanged || notesChanged) {
            if (!isFocused) {
                setLocalQtyStr(item.physical_qty.toString());
                setLocalNotes(item.notes || '');
                stateRef.current = { qty: item.physical_qty.toString(), notes: item.notes || '' };
                lastPropRef.current = { qty: item.physical_qty, notes: item.notes || '' };
            }
        }
    }, [item.physical_qty, item.notes, isFocused]);

    const commitChanges = useCallback(() => {
        if (flushTimeout.current) {
            clearTimeout(flushTimeout.current);
            flushTimeout.current = null;
        }

        const currentQtyStr = stateRef.current.qty;
        const currentNotes = stateRef.current.notes;

        const parsedQty = parseInt(currentQtyStr);
        const qtyToSave = isNaN(parsedQty) ? 0 : parsedQty;

        if (qtyToSave !== item.physical_qty || currentNotes !== (item.notes || '')) {
            if (!dirtyRef.current) return;
            dirtyRef.current = false;
            onCommitLineChange(item.item_id, { physical_qty: qtyToSave, notes: currentNotes });
        }
    }, [item.physical_qty, item.notes, item.item_id, onCommitLineChange]);

    const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalQtyStr(val);
        stateRef.current.qty = val;
        dirtyRef.current = true;
        
        if (flushTimeout.current) clearTimeout(flushTimeout.current);
        flushTimeout.current = setTimeout(commitChanges, 500);
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalNotes(val);
        stateRef.current.notes = val;
        dirtyRef.current = true;

        if (flushTimeout.current) clearTimeout(flushTimeout.current);
        flushTimeout.current = setTimeout(commitChanges, 500);
    };

    const handleBlur = () => {
        setIsFocused(false);
        commitChanges();
    };

    const handleFocus = () => setIsFocused(true);

    useEffect(() => {
        return () => {
            commitChanges();
        };
    }, [commitChanges]);

    useEffect(() => {
        if (registerFlush) {
            return registerFlush(commitChanges);
        }
    }, [registerFlush, commitChanges]);

    const parsedLocalQty = parseInt(localQtyStr);
    const safeQty = isNaN(parsedLocalQty) ? 0 : parsedLocalQty;
    const diff = safeQty - item.system_qty;

    return (
        <TR className={diff !== 0 ? 'row-warning' : ''}>
            <TD>{item.kode_barang || '-'}</TD>
            <TD>{item.nama_barang}</TD>
            <TD>{item.system_qty}</TD>
            <TD>
                <Input 
                    type="number" 
                    value={localQtyStr}
                    disabled={disabled}
                    onChange={handleQtyChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="table-input-control"
                />
            </TD>
            <TD>
                <span className={diff < 0 ? 'text-danger text-strong' : diff > 0 ? 'text-success text-strong' : ''}>
                    {diff > 0 ? `+${diff}` : diff}
                </span>
            </TD>
            <TD>
                <Input 
                    type="text" 
                    value={localNotes}
                    disabled={disabled}
                    onChange={handleNotesChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="table-input-control"
                    placeholder={t('stockOpname.notePlaceholder')}
                />
            </TD>
        </TR>
    );
});
StockOpnameRow.displayName = 'StockOpnameRow';

const StockOpnameMobileCard = React.memo(({ item, disabled, t, onCommitLineChange, registerFlush }: StockOpnameRowProps) => {
    const [localQtyStr, setLocalQtyStr] = useState(item.physical_qty.toString());
    const [localNotes, setLocalNotes] = useState(item.notes || '');

    const stateRef = useRef({ qty: item.physical_qty.toString(), notes: item.notes || '' });
    const lastPropRef = useRef({ qty: item.physical_qty, notes: item.notes || '' });
    const flushTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dirtyRef = useRef(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const qtyChanged = item.physical_qty !== lastPropRef.current.qty;
        const notesChanged = (item.notes || '') !== lastPropRef.current.notes;

        if (qtyChanged || notesChanged) {
            if (!isFocused) {
                setLocalQtyStr(item.physical_qty.toString());
                setLocalNotes(item.notes || '');
                stateRef.current = { qty: item.physical_qty.toString(), notes: item.notes || '' };
                lastPropRef.current = { qty: item.physical_qty, notes: item.notes || '' };
            }
        }
    }, [item.physical_qty, item.notes, isFocused]);

    const commitChanges = useCallback(() => {
        if (flushTimeout.current) {
            clearTimeout(flushTimeout.current);
            flushTimeout.current = null;
        }

        const currentQtyStr = stateRef.current.qty;
        const currentNotes = stateRef.current.notes;

        const parsedQty = parseInt(currentQtyStr);
        const qtyToSave = isNaN(parsedQty) ? 0 : parsedQty;

        if (qtyToSave !== item.physical_qty || currentNotes !== (item.notes || '')) {
            if (!dirtyRef.current) return;
            dirtyRef.current = false;
            onCommitLineChange(item.item_id, { physical_qty: qtyToSave, notes: currentNotes });
        }
    }, [item.physical_qty, item.notes, item.item_id, onCommitLineChange]);

    const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalQtyStr(val);
        stateRef.current.qty = val;
        dirtyRef.current = true;
        
        if (flushTimeout.current) clearTimeout(flushTimeout.current);
        flushTimeout.current = setTimeout(commitChanges, 500);
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalNotes(val);
        stateRef.current.notes = val;
        dirtyRef.current = true;

        if (flushTimeout.current) clearTimeout(flushTimeout.current);
        flushTimeout.current = setTimeout(commitChanges, 500);
    };

    const handleBlur = () => {
        setIsFocused(false);
        commitChanges();
    };

    const handleFocus = () => setIsFocused(true);

    useEffect(() => {
        return () => {
            commitChanges();
        };
    }, [commitChanges]);

    useEffect(() => {
        if (registerFlush) {
            return registerFlush(commitChanges);
        }
    }, [registerFlush, commitChanges]);

    const parsedLocalQty = parseInt(localQtyStr);
    const safeQty = isNaN(parsedLocalQty) ? 0 : parsedLocalQty;
    const diff = safeQty - item.system_qty;

    return (
        <MobileCard
            className={diff !== 0 ? 'card-warning' : undefined}
            header={<span className="mobile-card-header-title">{item.nama_barang}</span>}
            fields={[
                { label: t('inventory.columns.itemCode'), value: item.kode_barang || '-' },
                { label: t('stockOpname.systemStock'), value: item.system_qty },
                {
                    label: t('stockOpname.difference'),
                    value: (
                        <span className={diff < 0 ? 'text-danger text-strong' : diff > 0 ? 'text-success text-strong' : ''}>
                            {diff > 0 ? `+${diff}` : diff}
                        </span>
                    ),
                },
            ]}
            actions={
                <div className="form-stack-compact">
                    <label className="form-label form-label--compact">{t('stockOpname.physicalStock')}</label>
                    <Input
                        type="number"
                        value={localQtyStr}
                        disabled={disabled}
                        onChange={handleQtyChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="table-input-control"
                    />
                    <label className="form-label form-label--compact">{t('stockOpname.note')}</label>
                    <Input
                        type="text"
                        value={localNotes}
                        disabled={disabled}
                        onChange={handleNotesChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        className="table-input-control"
                        placeholder={t('stockOpname.notePlaceholder')}
                    />
                </div>
            }
        />
    );
});
StockOpnameMobileCard.displayName = 'StockOpnameMobileCard';

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

    const activeSessionIdRef = useRef<number | null>(null);
    const latestSessionRef = useRef<OpnameSession | null>(null);
    const pendingPromisesRef = useRef<Set<Promise<void>>>(new Set());
    const flushRegistryRef = useRef<Set<() => void>>(new Set());

    const registerFlush = useCallback((flushFn: () => void) => {
        flushRegistryRef.current.add(flushFn);
        return () => {
            flushRegistryRef.current.delete(flushFn);
        };
    }, []);

    const forceFlushAll = () => {
        flushRegistryRef.current.forEach(flush => flush());
    };

    useEffect(() => {
        activeSessionIdRef.current = activeSession ? activeSession.id : null;
        latestSessionRef.current = activeSession;
    }, [activeSession]);

    const handleItemChange = useCallback(async (itemId: number, changes: { physical_qty: number; notes: string }) => {
        const sessionId = activeSessionIdRef.current;
        if (!sessionId) return;
        
        if (latestSessionRef.current) {
            latestSessionRef.current = {
                ...latestSessionRef.current,
                items: latestSessionRef.current.items?.map(i => i.item_id === itemId ? { ...i, physical_qty: changes.physical_qty, difference: changes.physical_qty - i.system_qty, notes: changes.notes } : i)
            };
        }

        const promise = (async () => {
            try {
                await updateItem(sessionId, itemId, changes.physical_qty, changes.notes);
                setActiveSession(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        items: prev.items?.map(i => i.item_id === itemId ? { ...i, physical_qty: changes.physical_qty, difference: changes.physical_qty - i.system_qty, notes: changes.notes } : i)
                    };
                });
            } catch (err: any) {
                showToast(t('toast.stockOpname.updateFailed') + (err.message || t('toast.common.errorOccurred')), 'error');
            }
        })();

        pendingPromisesRef.current.add(promise);
        promise.finally(() => {
            pendingPromisesRef.current.delete(promise);
        });

        await promise;
    }, [updateItem, t, showToast]);

    const handleFinalize = async () => {
        if (!activeSession) return;
        try {
            setActionLoading(true);
            forceFlushAll();
            await Promise.allSettled(Array.from(pendingPromisesRef.current));
            
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

    const handlePdf = async () => {
        if (!activeSession) return;
        
        setActionLoading(true);
        forceFlushAll();
        await Promise.allSettled(Array.from(pendingPromisesRef.current));
        setActionLoading(false);
        
        const sessionData = latestSessionRef.current || activeSession;
        
        exportToPdf({
            filename: `Stock_Opname_${sessionData.id}_${getWIBInputDate()}`,
            title: `Laporan Stock Opname #${sessionData.id}`,
            subtitle: `Status: ${sessionData.status} | Tanggal: ${new Date(sessionData.opname_date).toLocaleString('id-ID')}`,
            columns: [
                { header: 'Kode', dataKey: 'kode_barang' },
                { header: 'Nama Barang', dataKey: 'nama_barang' },
                { header: 'Stok Sistem', dataKey: 'system_qty' },
                { header: 'Stok Fisik', dataKey: 'physical_qty' },
                { header: 'Selisih', dataKey: 'difference' },
                { header: 'Catatan', dataKey: 'notes' },
            ],
            data: (sessionData.items || []).map(i => ({
                ...i,
                kode_barang: i.kode_barang || '-',
                notes: i.notes || '-',
            }))
        });
    };

    const handleBack = async () => {
        if (!activeSession) return;
        setActionLoading(true);
        forceFlushAll();
        await Promise.allSettled(Array.from(pendingPromisesRef.current));
        setActiveSession(null);
        setActionLoading(false);
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
                        <Button variant="secondary" onClick={handleBack} disabled={actionLoading}>{t('common.back')}</Button>
                        <Button variant="secondary" onClick={handlePdf} disabled={actionLoading} className="action-button-inline">
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
                                <StockOpnameRow
                                    key={item.id ?? item.item_id ?? item.kode_barang}
                                    item={item}
                                    disabled={activeSession.status === 'FINALIZED'}
                                    t={t}
                                    onCommitLineChange={handleItemChange}
                                    registerFlush={registerFlush}
                                />
                            ))}
                        </TBody>
                    </Table>

                    <MobileCardList isEmpty={(activeSession.items?.length ?? 0) === 0} isLoading={false} emptyMessage="Tidak ada barang dalam sesi.">
                        {(activeSession.items || []).map((item) => (
                            <StockOpnameMobileCard
                                key={item.id ?? item.item_id ?? item.kode_barang}
                                item={item}
                                disabled={activeSession.status === 'FINALIZED'}
                                t={t}
                                onCommitLineChange={handleItemChange}
                                registerFlush={registerFlush}
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
