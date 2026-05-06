import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';

export interface AuditLog {
    id: number;
    table_name: string;
    record_id: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    old_values: any;
    new_values: any;
    user_name: string;
    created_at: string;
}

export interface AuditPagination {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}

export interface AuditQueryParams {
    page: number;
    perPage: number;
    search?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface AuditListResponse {
    logs: AuditLog[];
    pagination: AuditPagination;
}

const DEFAULT_PAGINATION: AuditPagination = {
    page: 1,
    perPage: 15,
    total: 0,
    totalPages: 1,
};

const buildAuditQuery = (params: Partial<AuditQueryParams>): string => {
    const qs = new URLSearchParams();

    if (params.page) qs.set('page', String(params.page));
    if (params.perPage) qs.set('perPage', String(params.perPage));

    const search = params.search?.trim();
    if (search) qs.set('search', search);

    const action = params.action?.trim();
    if (action) qs.set('action', action);

    const dateFrom = params.dateFrom?.trim();
    if (dateFrom) qs.set('dateFrom', dateFrom);

    const dateTo = params.dateTo?.trim();
    if (dateTo) qs.set('dateTo', dateTo);

    return qs.toString();
};

export async function fetchAuditLogs(params: Partial<AuditQueryParams> = {}): Promise<AuditListResponse> {
    const query = buildAuditQuery(params);
    const path = query ? `/audit?${query}` : '/audit';

    const data = await http.get<AuditListResponse | AuditLog[]>(path);

    // Backward compatibility fallback if server still returns array
    if (Array.isArray(data)) {
        const page = params.page ?? 1;
        const perPage = params.perPage ?? DEFAULT_PAGINATION.perPage;
        const total = data.length;
        return {
            logs: data,
            pagination: {
                page,
                perPage,
                total,
                totalPages: Math.max(1, Math.ceil(total / perPage)),
            },
        };
    }

    return data;
}

export function useAudit(params: AuditQueryParams) {
    const {
        page,
        perPage,
        search = '',
        action = '',
        dateFrom = '',
        dateTo = '',
    } = params;

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<AuditPagination>({
        ...DEFAULT_PAGINATION,
        page,
        perPage,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAuditLogs({
                page,
                perPage,
                search,
                action,
                dateFrom,
                dateTo,
            });

            setLogs(data.logs);
            setPagination(data.pagination ?? { ...DEFAULT_PAGINATION, page, perPage });
            setError(null);
        } catch (err: any) {
            setLogs([]);
            setPagination((prev) => ({
                ...prev,
                page,
                perPage,
                total: 0,
                totalPages: 1,
            }));
            const message = err?.message || 'Gagal memuat log audit';
            try {
                const parsed = JSON.parse(message);
                setError(parsed?.message || message);
            } catch {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }, [page, perPage, search, action, dateFrom, dateTo]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, pagination, loading, error, refresh: fetchLogs };
}
