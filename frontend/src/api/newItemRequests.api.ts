import { http } from './http';

export type NewItemRequest = {
    id: number;
    item_name: string;
    description: string | null;
    satuan: string | null;
    category: string | null;
    reason: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approved_by: number | null;
    approved_quantity: number | null;
    reject_reason: string | null;
    created_at: string;
    updated_at: string;
    requested_by_name: string;
};

export type CreateNewItemRequestPayload = {
    item_name: string;
    description?: string;
    satuan?: string;
    category?: string;
    reason?: string;
};

export type ApproveNewItemPayload = {
    approved_quantity: number;
    satuan?: string;
    category?: string;
    lokasi_simpan?: string;
    kode_barang?: string;
};

export type ApproveNewItemResponse = {
    message: string;
    item_id: number;
    item_name: string;
    approved_quantity: number;
    satuan: string;
};

export type RejectNewItemResponse = {
    message: string;
    id: number;
    status: string;
    reject_reason: string;
};

export const fetchNewItemRequests = () =>
    http.get<NewItemRequest[]>('/new-item-requests');

export const createNewItemRequest = (payload: CreateNewItemRequestPayload) =>
    http.post<NewItemRequest>('/new-item-requests', payload);

export const approveNewItemRequest = (id: number, payload: ApproveNewItemPayload) =>
    http.post<ApproveNewItemResponse>(`/new-item-requests/${id}/approve`, payload);

export const rejectNewItemRequest = (id: number, reason: string) =>
    http.post<RejectNewItemResponse>(`/new-item-requests/${id}/reject`, { reason });
