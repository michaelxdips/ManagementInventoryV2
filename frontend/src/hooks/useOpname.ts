import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/http';

export interface OpnameItem {
    id: number;
    opname_id: number;
    item_id: number;
    system_qty: number;
    physical_qty: number;
    difference: number;
    notes: string;
    nama_barang?: string;
    kode_barang?: string;
}

export interface OpnameSession {
    id: number;
    opname_date: string;
    status: 'DRAFT' | 'FINALIZED';
    notes: string;
    created_by: number;
    created_by_name: string;
    created_at: string;
    items?: OpnameItem[];
}

export function useOpname() {
    const [sessions, setSessions] = useState<OpnameSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await http.get<OpnameSession[]>('/opname');
            setSessions(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Gagal memuat sesi opname');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const getSession = async (id: number) => {
        return await http.get<OpnameSession>(`/opname/${id}`);
    };

    const createSession = async (notes: string = '') => {
        const res = await http.post<{ id: number, message: string }>('/opname', { notes });
        await fetchSessions();
        return res.id;
    };

    const updateItem = async (sessionId: number, itemId: number, physical_qty: number, notes: string = '') => {
        await http.put(`/opname/${sessionId}/items/${itemId}`, { physical_qty, notes });
    };

    const finalizeSession = async (id: number) => {
        await http.post<{ message: string }>(`/opname/${id}/finalize`, {});
        await fetchSessions();
    };

    const deleteSession = async (id: number) => {
        await http.delete(`/opname/${id}`);
        await fetchSessions();
    };

    return {
        sessions,
        loading,
        error,
        refresh: fetchSessions,
        getSession,
        createSession,
        updateItem,
        finalizeSession,
        deleteSession
    };
}
