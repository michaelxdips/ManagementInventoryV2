import { useTranslation } from '../hooks/useTranslation';
import React, { useEffect, useState } from 'react';
import { useAudit, AuditLog, fetchAuditLogs } from '../hooks/useAudit';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import { Download, FileText } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';
import { useToast } from '../components/ui/Toast';
import { getWIBInputDate } from '../utils/dateUtils';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';

const parseErrorMessage = (err: any, fallback: string): string => {
    if (err?.message) {
        try {
            const parsed = JSON.parse(err.message);
            if (parsed?.message) return parsed.message;
        } catch {
            return err.message;
        }
        return err.message;
    }
    return fallback;
};

const AuditLogs = () => {
  const { t } = useTranslation();
    const { showToast } = useToast();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [exporting, setExporting] = useState(false);

    const perPage = 15;
    const normalizedSearch = search.trim();

    const {
        logs: pageRows,
        pagination,
        loading,
        error,
    } = useAudit({
        page,
        perPage,
        search: normalizedSearch,
        action: filterAction,
        dateFrom,
        dateTo,
    });

    useEffect(() => {
        setPage(1);
    }, [normalizedSearch, filterAction, dateFrom, dateTo]);

    useEffect(() => {
        if (page > pagination.totalPages) {
            setPage(Math.max(1, pagination.totalPages));
        }
    }, [page, pagination.totalPages]);

    const formatDiff = (oldVals: any, newVals: any) => {
        if (!newVals) return '-';
        const changes = Object.keys(newVals).map((key) => {
            const oldVal = oldVals ? oldVals[key] : undefined;
            const newVal = newVals[key];
            if (oldVal !== newVal) {
                return (
                    <div key={key} style={{ fontSize: '0.85rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{key}:</span>{' '}
                        {oldVal !== undefined && <span style={{ textDecoration: 'line-through', color: 'var(--danger-text)' }}>{String(oldVal)}</span>}{' '}
                        <span style={{ color: 'var(--success-text)' }}>{String(newVal)}</span>
                    </div>
                );
            }
            return null;
        }).filter(Boolean);

        return changes.length > 0 ? changes : <span style={{ color: 'var(--text-muted)' }}>{t('audit.empty')}</span>;
    };

    const formatDiffText = (oldVals: any, newVals: any): string => {
        if (!newVals) return '-';
        return Object.keys(newVals).map((key) => {
            const oldVal = oldVals ? oldVals[key] : undefined;
            const newVal = newVals[key];
            if (oldVal !== newVal) {
                return `${key}: ${oldVal !== undefined ? oldVal + ' → ' : ''}${newVal}`;
            }
            return null;
        }).filter(Boolean).join('; ') || '-';
    };

    const fetchAllFilteredLogs = async (): Promise<AuditLog[]> => {
        const allLogs: AuditLog[] = [];
        let nextPage = 1;
        let totalPages = 1;

        do {
            const response = await fetchAuditLogs({
                page: nextPage,
                perPage: 100,
                search: normalizedSearch || undefined,
                action: filterAction || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            });

            allLogs.push(...response.logs);
            totalPages = response.pagination.totalPages;
            nextPage += 1;
        } while (nextPage <= totalPages);

        return allLogs;
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const exportRows = await fetchAllFilteredLogs();
            if (exportRows.length === 0) return;

            exportToExcel(
                exportRows.map((log) => ({
                    ...log,
                    created_at: new Date(log.created_at).toLocaleString('id-ID'),
                    changes: formatDiffText(log.old_values, log.new_values),
                })),
                [
                    { header: t('audit.time'), key: 'created_at' },
                    { header: 'Tabel', key: 'table_name' },
                    { header: t('audit.tableId'), key: 'record_id' },
                    { header: 'Aksi', key: 'action' },
                    { header: t('audit.user'), key: 'user_name' },
                    { header: t('audit.changes'), key: 'changes' },
                ],
                { filename: `Audit_Trail_${getWIBInputDate()}`, sheetName: 'Audit Trail' }
            );
        } catch (err: any) {
            showToast(parseErrorMessage(err, t('toast.audit.exportExcelFailed')), 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleExportPdf = async () => {
        setExporting(true);
        try {
            const exportRows = await fetchAllFilteredLogs();
            if (exportRows.length === 0) return;

            exportToPdf({
                filename: `Audit_Trail_${getWIBInputDate()}`,
                title: 'Laporan Audit Trail',
                columns: [
                    { header: t('audit.time'), dataKey: 'created_at' },
                    { header: 'Tabel', dataKey: 'table_name' },
                    { header: 'ID', dataKey: 'record_id' },
                    { header: 'Aksi', dataKey: 'action' },
                    { header: t('audit.user'), dataKey: 'user_name' },
                    { header: t('audit.changes'), dataKey: 'changes' },
                ],
                data: exportRows.map((log) => ({
                    ...log,
                    created_at: new Date(log.created_at).toLocaleString('id-ID'),
                    user_name: log.user_name || 'System',
                    changes: formatDiffText(log.old_values, log.new_values),
                })),
            });
        } catch (err: any) {
            showToast(parseErrorMessage(err, t('toast.audit.exportPdfFailed')), 'error');
        } finally {
            setExporting(false);
        }
    };

    const fromDisplay = pagination.total > 0
        ? (pagination.page - 1) * pagination.perPage + 1
        : 0;
    const toDisplay = pagination.total > 0
        ? Math.min(pagination.page * pagination.perPage, pagination.total)
        : 0;

    return (
        <div className="page-container">
            <header className="page-header page-header--stacked">
                <div>
                    <h1 className="page-title">Audit Trail</h1>
                    <p className="page-description">{t('audit.desc')}</p>
                </div>
                <div className="action-bar action-bar--wrap">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleExportPdf}
                        disabled={loading || exporting || pagination.total === 0}
                        className="action-button-inline"
                    >
                        <FileText size={16} />
                        {exporting ? 'Memproses...' : 'PDF'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleExportExcel}
                        disabled={loading || exporting || pagination.total === 0}
                        className="action-button-inline"
                    >
                        <Download size={16} />
                        {exporting ? 'Memproses...' : 'Excel'}
                    </Button>
                </div>
            </header>

            <div className="history-card filter-bar history-card--padded mb-4">
                <div className="filter-field filter-field--grow">
                    <label className="filter-label">{t('common.search')}</label>
                    <input className="input-control input-control--flush" placeholder={t('audit.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="filter-field filter-field--sm">
                    <label className="filter-label">{t('audit.action')}</label>
                    <select
                        className="input-control input-control--flush input-control--select"
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        <option value="">{t('audit.all')}</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
                <div className="filter-field filter-field--md">
                    <label className="filter-label">{t('common.from')}</label>
                    <input type="date" className="input-control input-control--flush" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="filter-field filter-field--md">
                    <label className="filter-label">{t('common.to')}</label>
                    <input type="date" className="input-control input-control--flush" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
            </div>

            <div className="history-card table-scroll-card">
                {error && <p className="danger-text history-card__message">{error}</p>}

                <div className="table-scroll-card__inner">
                    <Table>
                        <THead>
                            <TR>
                                <TH>{t('audit.time')}</TH>
                                <TH>{t('audit.tableId')}</TH>
                                <TH>{t('audit.action')}</TH>
                                <TH>{t('audit.user')}</TH>
                                <TH>{t('audit.changes')}</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                <SkeletonTableRows rows={8} columns={5} />
                            ) : pageRows.length === 0 ? (
                            <EmptyTableRow
                                colSpan={5}
                                title={t('audit.empty')}
                                description={t('audit.emptyDesc')}
                            />
                            ) : (
                                pageRows.map((log) => (
                                    <TR key={log.id}>
                                        <TD className="text-nowrap">{new Date(log.created_at).toLocaleString('id-ID')}</TD>
                                        <TD>
                                            <div className="audit-log-title">{log.table_name}</div>
                                            <div className="audit-log-meta">ID: {log.record_id}</div>
                                        </TD>
                                        <TD>
                                            <span className={`badge badge-${log.action === 'CREATE' ? 'approved' : log.action === 'DELETE' ? 'rejected' : 'pending'}`}>
                                                {log.action}
                                            </span>
                                        </TD>
                                        <TD>{log.user_name || 'System'}</TD>
                                        <TD>{formatDiff(log.old_values, log.new_values)}</TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </Table>
                </div>

                <MobileCardList
                    isEmpty={!loading && pageRows.length === 0}
                    isLoading={loading}
                    emptyMessage={t('audit.empty')}
                >
                    {pageRows.map((log) => (
                        <MobileCard
                            key={log.id}
                            header={
                                <>
                                    <span className="mobile-card-header-title">{log.table_name}</span>
                                    <span
                                        className={`badge badge-${
                                            log.action === 'CREATE' ? 'approved' : log.action === 'DELETE' ? 'rejected' : 'pending'
                                        }`}
                                    >
                                        {log.action}
                                    </span>
                                </>
                            }
                            fields={[
                                { label: t('audit.time'), value: new Date(log.created_at).toLocaleString('id-ID') },
                                { label: t('audit.tableId'), value: log.record_id },
                                { label: t('audit.user'), value: log.user_name || 'System' },
                                {
                                    label: t('audit.changes'),
                                    value: (
                                        <span className="audit-diff-text">{formatDiffText(log.old_values, log.new_values)}</span>
                                    ),
                                },
                            ]}
                        />
                    ))}
                </MobileCardList>

                <div className="items-footer">
                    <span className="items-meta">
                        {t('audit.showingLogs', { from: fromDisplay, to: toDisplay, total: pagination.total })}
                    </span>
                    <Pagination current={pagination.page} total={pagination.totalPages} onChange={setPage} />
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
